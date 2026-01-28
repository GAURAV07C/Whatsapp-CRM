import { Server as SocketIOServer } from "socket.io";
import { Server } from "http";
import { storage } from "./storage";

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
        } else if (data.chatId) {
          // Widget joining specific chat room
          socket.join(`chat_${data.chatId}`);
          console.log(
            `✅ DEBUG: Socket ${socket.id} joined chat_${data.chatId}`,
          );
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
