import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

import QRCode from "qrcode";
import sharp from "sharp";
import { storage } from "./storage";
import { io } from "./socket";

/**
 * In-memory stores
 */
const clients = new Map<number, InstanceType<typeof Client>>();
const qrCodes = new Map<number, string>();
const initializingAgents = new Set<number>();
const clientStatus = new Map<number, string>();

export class WhatsAppManager {
  /**
   * Get or create client
   */
  static async getClient(agentId: number) {
    if (clients.has(agentId)) {
      return clients.get(agentId);
    }

    if (initializingAgents.has(agentId)) {
      return null;
    }

    return this.initializeClient(agentId);
  }

  /**
   * Initialize WhatsApp client (SAFE)
   */
  static async initializeClient(agentId: number) {
    if (clients.has(agentId)) {
      return clients.get(agentId);
    }

    if (initializingAgents.has(agentId)) {
      console.log(`⚠️ Client already initializing for agent ${agentId}`);
      return null;
    }

    initializingAgents.add(agentId);
    clientStatus.set(agentId, "initializing");

    console.log(`🚀 Initializing WhatsApp client for agent ${agentId}`);

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `agent-${agentId}`,
      }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });

    /**
     * QR EVENT
     */
    client.on("qr", async (qr) => {
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        console.error(`Agent ${agentId} not found`);
        return;
      }
      const tenantId = agent.tenantId;

      console.log(
        `📸 QR Code received for tenant ${tenantId}, agent ${agentId}`,
      );
      try {
        // Generate initial QR PNG Base64
        const qrDataUrl = await QRCode.toDataURL(qr);

        // Convert Base64 to Buffer
        const base64Data = qrDataUrl.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Compress QR image to JPEG (smaller size)
        const compressedBuffer = await sharp(buffer)
          .jpeg({ quality: 50 }) // adjust quality 30-70% as needed
          .toBuffer();

        // Convert back to Base64
        const compressedBase64 = `data:image/jpeg;base64,${compressedBuffer.toString(
          "base64",
        )}`;

        // Store and emit compressed QR
        qrCodes.set(agentId, compressedBase64);
        clientStatus.set(agentId, "qr_ready");

        await storage.updateWhatsappStatus(tenantId, "qr_ready");

        io.to(`tenant_${tenantId}`).emit("qr_code", {
          qr: compressedBase64, // much smaller Base64 string
        });
      } catch (err) {
        console.error("QR generation error:", err);
      }
    });

    /**
     * AUTHENTICATED EVENT
     */
    client.on("authenticated", async () => {
      console.log(`🔐 WhatsApp authenticated for agent ${agentId}`);
      qrCodes.delete(agentId);
      clientStatus.set(agentId, "connected");

      // Update tenant status to connected
      const agent = await storage.getAgent(agentId);
      if (agent) {
        await storage.updateWhatsappStatus(agent.tenantId, "connected");

        io.to(`tenant_${agent.tenantId}`).emit("status_change", {
          status: "connected",
        });
      }
    });

    /**
     * READY EVENT
     */
    client.on("ready", async () => {
      console.log(`✅ WhatsApp ready for agent ${agentId}`);
      qrCodes.delete(agentId);
      clientStatus.set(agentId, "connected");

      // Update tenant status to connected
      const agent = await storage.getAgent(agentId);
      if (agent) {
        await storage.updateWhatsappStatus(agent.tenantId, "connected");

        io.to(`tenant_${agent.tenantId}`).emit("status_change", {
          status: "connected",
        });
      }
    });

    /**
     * MESSAGE EVENT
     */
    console.log(`🎧 [AGENT ${agentId}] Setting up message event listener`);
    client.on("message", async (msg) => {
      // Log incoming messages from client
       if (msg.isStatus || msg.from === "status@broadcast") return;
      
       if (msg.from.endsWith("@g.us")) return;

    // 3️⃣ System / update / ephemeral / protocol / call messages
    const ignoredTypes = ["protocol", "ephemeral", "system", "call", "image", "video", "audio", "document", "sticker", "location", "vcard"];
    if (ignoredTypes.includes(msg.type)) return;

    

      // <<<<<<< HEAD
      console.log("💕❤🎁");
      // =======
      // >>>>>>> ed61ec9f205873f7f6b98aa9252c1ae455f442b3
      console.log(`🔥 [AGENT ${agentId}] MESSAGE EVENT TRIGGERED!`);
      console.log(`   Raw message data:`, {
        from: msg.from,
        to: msg.to,
        body: msg.body,
        type: msg.type,
        fromMe: msg.fromMe,
        timestamp: msg.timestamp,
        hasMedia: msg.hasMedia,
      });

      // Skip processing interactive messages to avoid media download errors
      if ((msg.type as string) === "interactive") {
        console.log(`   ⏭️ Skipping interactive message`);
        return;
      }

      try {
        const contact = await msg.getContact();
        const chat = await msg.getChat();

        console.log(`   Contact info:`, {
          number: contact?.number,
          name: contact?.name,
          pushname: contact?.pushname,
        });

        let chatId = msg.from;
        const cusId = contact?.number
          ? contact.number.replace(/\D/g, "")
          : null;

        // Normalize phone number format
        if (cusId) {
          chatId = `${cusId}@c.us`;
        }

        console.log(`📨 [AGENT ${agentId}] Processing WhatsApp message:`);
        console.log(`   From: ${msg.from} -> Normalized: ${chatId}`);
        console.log(`   Phone Number (cusId): ${cusId}`);
        console.log(`   Body: "${msg.body}"`);
        console.log(`   Type: ${msg.type}`);
        console.log(`   FromMe: ${msg.fromMe}`);

        const agent = await storage.getAgent(agentId);
        if (!agent) {
          console.error(`Agent ${agentId} not found`);
          return;
        }
        const tenantId = agent.tenantId;

        // 🔍 CRITICAL: Look up chat by BOTH tenantId and chatId (phone number)
        // This ensures messages from one number don't affect chats from another number
        let dbChat = await storage.getChatByRemoteJid(
          tenantId,
          agentId,
          chatId,
        );
        console.log(
          `   Chat lookup: tenantId=${tenantId}, remoteJid=${chatId} -> ${!!dbChat ? `Found existing chat (ID: ${dbChat.id})` : "Creating new chat"}`,
        );

        if (!dbChat) {
          dbChat = await storage.createChat({
            tenantId,
            remoteJid: chatId,
            customerName: contact?.name || contact?.pushname || "Customer",
            assignedAgentId: agent.id,
          });
          console.log(`   ✅ Created new chat ID: ${dbChat.id}`);
        } else {
          // Update unread count
          dbChat.unreadCount = (dbChat.unreadCount || 0) + 1;
          console.log(`   📈 Updated unread count to: ${dbChat.unreadCount}`);
        }

        // Handle media if present
        let media = null;
        if (msg.hasMedia && msg.type !== "interactive") {
          try {
            const m = await msg.downloadMedia();
            if (m?.data) {
              media = {
                mimetype: m.mimetype,
                data: m.data,
                filename: m.filename || "media",
              };
            }
          } catch (mediaErr) {
            console.warn("Failed to download media:", mediaErr);
          }
        }

        const message = await storage.createMessage({
          chatId: dbChat.id,
          tenantId,
          agentId,
          content: msg.body || "",
          type: msg.type,
          fromMe: msg.fromMe,
          senderName: contact?.name || contact?.pushname || "Customer",
           timestamp: new Date(),
        });

        console.log(`   💾 Message saved with ID: ${message.id}`);
        console.log(`   ✅ Message successfully associated with:`);
        console.log(`      - Chat ID: ${message.chatId}`);
        console.log(`      - Tenant ID: ${message.tenantId}`);
        console.log(`      - Sender: ${message.senderName}`);
        console.log(
          `   📤 Emitting to rooms: chat_${dbChat.id}, agent_${agentId}`,
        );

        // Emit with media support - route to specific chat room to prevent mixing messages
        console.log(
          `   🔄 DEBUG: About to emit new_message to chat_${dbChat.id} and agent_${agentId}`,
        );

        // Emit to the specific chat room (for agents viewing that chat AND for widgets)
        io.to(`chat_${dbChat.id}`).emit("new_message", {
          ...message,
          media,
        });

        // Also emit to agent (for agent-specific notifications)
        io.to(`agent_${agentId}`).emit("new_message", {
          ...message,
          media,
        });

        // Also emit to tenant for chat list updates
        io.to(`tenant_${tenantId}`).emit("new_message", {
          ...message,
          media,
        });

        console.log(`   ✅ DEBUG: Emitted new_message successfully`);
        io.to(`chat_${dbChat.id}`).emit("chat_update", dbChat);
        io.to(`tenant_${tenantId}`).emit("chat_update", dbChat);

        console.log(
          `   ✅ Message processing complete for tenant ${tenantId}\n`,
        );
      } catch (err) {
        console.error("❌ Message handling error:", err);
      }
    });

    /**
     * DISCONNECT EVENT
     */
    client.on("disconnected", async () => {
      console.log(`🔌 Client disconnected for agent ${agentId}`);

      clients.delete(agentId);
      initializingAgents.delete(agentId);
      clientStatus.set(agentId, "disconnected");

      // Note: We don't update tenant status here since multiple agents per tenant

      io.to(`agent_${agentId}`).emit("status_change", {
        status: "disconnected",
      });
    });

    try {
      await client.initialize();
      clients.set(agentId, client);
      return client;
    } catch (err) {
      console.error(`❌ Failed to initialize client for agent ${agentId}`, err);
      throw err;
    } finally {
      initializingAgents.delete(agentId);
    }
  }

  /**
   * Get QR Code or status (NO DUPLICATE INIT)
   */
  static async getQrCode(agentId: number) {
    const status = clientStatus.get(agentId);

    if (status === "connected") {
      return null;
    }

    if (qrCodes.has(agentId)) {
      return qrCodes.get(agentId);
    }

    if (!clients.has(agentId) && !initializingAgents.has(agentId)) {
      this.initializeClient(agentId).catch(console.error);
      return "initializing";
    }

    return "initializing";
  }

  /**
   * Logout client
   */
  static async logout(agentId: number) {
    const client = clients.get(agentId);

    if (client) {
      await client.logout();
      await client.destroy();
    }

    clients.delete(agentId);
    initializingAgents.delete(agentId);
    qrCodes.delete(agentId);
    clientStatus.set(agentId, "disconnected");

    // Update tenant status to disconnected
    const agent = await storage.getAgent(agentId);
    if (agent) {
      await storage.updateWhatsappStatus(agent.tenantId, "disconnected");
    }
  }

  /**
   * Debug client status and connection
   */
  static async debugClient(agentId: number) {
    const status = clientStatus.get(agentId) || "disconnected";
    const client = clients.get(agentId);

    const clientInfo: {
      status: string;
      hasClient: boolean;
      isInitializing: boolean;
      hasQrCode: boolean;
      clientState?: any;
      clientInfo?: {
        wid?: string;
        pushname?: string;
        platform?: string;
      };
      clientError?: string;
    } = {
      status,
      hasClient: !!client,
      isInitializing: initializingAgents.has(agentId),
      hasQrCode: qrCodes.has(agentId),
    };

    if (client) {
      try {
        const state = await client.getState();
        const info = await client.info;
        clientInfo.clientState = state;
        clientInfo.clientInfo = {
          wid: info?.wid?.user,
          pushname: info?.pushname,
          platform: info?.platform,
        };
      } catch (error) {
        clientInfo.clientError = (error as Error).message;
      }
    }

    return clientInfo;
  }

  /**
   * Status getter (SAFE for polling)
   */
  static getStatus(agentId: number) {
    return clientStatus.get(agentId) || "disconnected";
  }
}
