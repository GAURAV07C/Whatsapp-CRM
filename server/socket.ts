import { Server as SocketIOServer } from "socket.io";
import { Server } from "http";
import { storage } from "./storage";
import { WhatsAppManager } from "./whatsapp";

export function setupSocket(httpServer: Server) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // In production, restrict to allowedDomains
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  io.on("connection", async (socket) => {
    console.log("🔌 DEBUG: New socket connection:", socket.id);

    // Join room based on role
    socket.on(
      "join_room",
      async (data: {
        tenantId?: number;
        chatId?: number;
        agentId?: number;
        publicKey?: string;
      }) => {
        console.log(`🚪 DEBUG: Socket ${socket.id} received join_room:`, data);
        if (data.agentId) {
          socket.join(`agent_${data.agentId}`);
          console.log(`✅ Socket ${socket.id} joined agent_${data.agentId}`);
        }
        if (data.tenantId) {
          // Agent joining tenant room
          socket.join(`tenant_${data.tenantId}`);
          console.log(
            `✅ DEBUG: Socket ${socket.id} joined tenant_${data.tenantId}`,
          );
        }
        if (data.chatId) {
          // Join specific chat room (supports both agent and widget views)
          socket.join(`chat_${data.chatId}`);
          console.log(
            `✅ DEBUG: Socket ${socket.id} joined chat_${data.chatId}`,
          );
        }
        if (data.publicKey && !data.tenantId && !data.chatId) {
          // Widget joining with publicKey only
          const tenant = await storage.getTenantByPublicKey(data.publicKey);
          if (tenant) {
            socket.join(`tenant_${tenant.id}`);
            console.log(
              `✅ DEBUG: Socket ${socket.id} joined tenant_${tenant.id} via publicKey`,
            );
          }
        }
      },
    );

    // Handle real-time message sending from widget
    socket.on(
      "send_message",
      async (data: { chatId: number; content: string; publicKey: string; tempId?: string }) => {
        console.log(`📤 Socket ${socket.id} received send_message:`, data);

        try {
          const { chatId, content, publicKey, tempId } = data;

          // Get tenant by publicKey
          const tenant = await storage.getTenantByPublicKey(publicKey);
          if (!tenant) {
            socket.emit("message_error", { error: "Invalid public key" });
            return;
          }

          // Get chat and verify ownership
          const chat = await storage.getChat(chatId);
          if (!chat || chat.tenantId !== tenant.id) {
            socket.emit("message_error", { error: "Chat not found" });
            return;
          }

          // Get first available agent for the tenant
          const agents = await storage.getAgentsByTenantId(tenant.id);
          if (agents.length === 0) {
            socket.emit("message_error", { error: "No agents available" });
            return;
          }

          const agent = agents[0]; // Use first agent

          // Send message via WhatsApp
          const client = await WhatsAppManager.getClient(agent.id);
          if (client) {
            try {
              const state = await client.getState();
              if (state !== "CONNECTED") {
                socket.emit("message_error", {
                  error: "WhatsApp client not connected",
                });
                return;
              }

              await new Promise((resolve) => setTimeout(resolve, 2000));

              const whatsappChat = await client.getChatById(chat.remoteJid);
              if (!whatsappChat) {
                socket.emit("message_error", {
                  error: "Chat not found in WhatsApp",
                });
                return;
              }

              await client.sendMessage(chat.remoteJid, content, {
                sendSeen: false,
              });
              console.log(`✅ Message sent to ${chat.remoteJid}: ${content}`);

              // ⚡ Create temporary message ID for client (use client's tempId if provided)
              const tempMessageId = tempId || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

              // 📤 Send immediate confirmation to client (after WhatsApp send succeeds)
              socket.emit("message_sent", {
                tempId: tempMessageId,
                isSaving: true,
              });
              console.log(
                `📤 [WIDGET] Sent message_sent event with tempId: ${tempMessageId}`,
              );

              // Emit to specific chat room immediately (prevents mixing messages across chats)
              io.to(`chat_${chatId}`).emit("new_message", {
                id: tempMessageId,
                chatId,
                tenantId: chat.tenantId,
                content,
                type: "text",
                fromMe: true,
                senderName: "Widget User",
                timestamp: new Date().toISOString(),
                isSaving: true,
              });

              // Emit to tenant for chat list updates
              io.to(`tenant_${tenant.id}`).emit("new_message", {
                id: tempMessageId,
                chatId,
                tenantId: chat.tenantId,
                content,
                type: "text",
                fromMe: true,
                senderName: "Widget User",
                timestamp: new Date().toISOString(),
                isSaving: true,
              });

              // Emit chat update to all viewers
              io.to(`chat_${chatId}`).emit("chat_update", chat);
              io.to(`tenant_${tenant.id}`).emit("chat_update", chat);

              // 🔄 BACKGROUND: Save message to database asynchronously
              storage
                .createMessage({
                  chatId,
                  tenantId: chat.tenantId,
                  content,
                  type: "text",
                  fromMe: true,
                  senderName: "Widget User",
                })
                .then((savedMessage) => {
                  console.log(
                    `💾 [BACKGROUND] Widget message saved to DB with ID: ${savedMessage.id}`,
                  );
                  io.to(`chat_${chatId}`).emit("message_saved", {
                    tempId: tempMessageId,
                    id: savedMessage.id,
                  });
                  io.to(`tenant_${tenant.id}`).emit("message_saved", {
                    tempId: tempMessageId,
                    id: savedMessage.id,
                  });
                })
                .catch((error) => {
                  console.error(
                    `❌ [BACKGROUND] Failed to save widget message to DB:`,
                    error,
                  );
                  io.to(`chat_${chatId}`).emit("message_save_error", {
                    tempId: tempMessageId,
                    error: "Failed to save message",
                  });
                });
            } catch (error) {
              console.error(`❌ Failed to send message:`, error);
              socket.emit("message_error", { error: "Failed to send message" });
            }
          } else {
            socket.emit("message_error", {
              error: "WhatsApp client not available",
            });
          }
        } catch (error) {
          console.error("❌ Socket message sending error:", error);
          socket.emit("message_error", { error: "Internal server error" });
        }
      },
    );

    socket.on("disconnect", () => {
      console.log("🔌 DEBUG: Socket disconnected:", socket.id);
    });
  });

  return io;
}

export let io: SocketIOServer;

export function setIo(instance: SocketIOServer) {
  io = instance;
}
