import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupSocket, setIo } from "./socket";
import { WhatsAppManager } from "./whatsapp";
import { auth } from "./middleware/auth";
// import { Chat } from "whatsapp-web.js";
import { Chat, Message } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const io = setupSocket(httpServer);
  setIo(io);

  // === SEED DATA ===
  async function seed() {
    // Check if tenant with specific publicKey exists
    const existing = await storage.getTenantByPublicKey("mo-public-key-123");
    if (!existing) {
      console.log("Seeding database...");
      // Create Demo Tenant
      const tenant = await storage.createTenant({
        name: "Demo Company",
        publicKey: "mo-public-key-123",
        config: {
          themeColor: "#25D366",
          greetingMessage: "Hi there! How can we help?",
          agentName: "Support Team",
        },
        allowedDomains: ["*"],
      });

      // Create Admin Agent
      await storage.createAgent({
        tenantId: tenant.id,
        username: "admin",
        password: "password", // In real app, hash this!
        role: "admin",
      });
      console.log("Seeding complete. User: admin / password");
    }
  }
  seed();

  // === AUTH API ===
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, username, password } = req.body;

      const existing = await storage.getAgentByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const tenant = await storage.createTenant({
        name,
        publicKey: `pk_${Math.random().toString(36).substring(2, 11)}`,
        config: {
          themeColor: "#25D366",
          greetingMessage: "Hi there! How can we help?",
          agentName: "Support Team",
        },
        allowedDomains: ["*"],
      });

      const agent = await storage.createAgent({
        tenantId: tenant.id,
        username,
        password, // In real app, hash this!
        role: "admin",
      });

      res.status(201).json({ agent, tenant });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { username, password } = api.auth.login.input.parse(req.body);
      const agent = await storage.getAgentByUsername(username);

      if (!agent || agent.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const tenant = await storage.getTenant(agent.tenantId);
      if (!tenant) return res.status(401).json({ message: "Tenant not found" });

      // In real app, generate JWT. For demo, return simple token (username)
      // and client can store it.
      res.json({
        token: Buffer.from(
          JSON.stringify({
            agentId: agent.id,
            tenantId: tenant.id,
            tenantPublicKey: tenant.publicKey,
          }),
        ).toString("base64"),
        agent,
        tenant,
      });
      console.log("Login successful for user:", tenant.publicKey);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.auth.me.path, auth, async (req, res) => {
    const agent = await storage.getAgent(req.user!.agentId);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({
      agentId: req.user!.agentId,
      username: req.user!.username,
      tenantId: req.user!.tenantId,
      publicKey: req.user!.publicKey,
      role: agent.role,
    });
  });

  // Protect all routes below
  // === WHATSAPP API ===
  app.get("/api/whatsapp/debug/:agentId", auth, async (req, res) => {
    const agentId = parseInt(
      Array.isArray(req.params.agentId)
        ? req.params.agentId[0]
        : req.params.agentId || "",
    );
    const debug = await WhatsAppManager.debugClient(agentId);
    res.json(debug);
  });

  app.get(api.whatsapp.status.path, auth, async (req, res) => {
    // Mock Auth Check
    // In real app, verify JWT from headers
    const agentId = req.user!.agentId;
    const tenantId = req.user!.tenantId;

    console.log(
      `🔍 WhatsApp status check for agent ${agentId}, tenant ${tenantId}`,
    );

    const tenant = await storage.getTenant(tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // Always try to initialize/get client for this agent
    console.log(`🚀 Ensuring WhatsApp client for agent ${agentId}`);
    const clientStatus = WhatsAppManager.getStatus(agentId);
    console.log(`📊 Client status for agent ${agentId}: ${clientStatus}`);

    // Trigger QR generation if disconnected
    let qr = undefined;
    if (tenant.whatsappStatus !== "connected") {
      console.log(`📸 Getting QR code for agent ${agentId}`);
      const qrCode = await WhatsAppManager.getQrCode(agentId);
      console.log(`📸 QR result: ${qrCode ? "Got QR" : "No QR needed"}`);
      if (qrCode && qrCode !== "initializing") {
        qr = qrCode;
      }
    }

    res.json({
      status: tenant.whatsappStatus as any,
      qr,
    });
  });
  // app.use();
  app.post(api.whatsapp.logout.path, auth, async (req, res) => {
    const tenantId = req.user!.tenantId; // Hardcoded for demo
    console.log("Logging out tenantId", req.user);
    await WhatsAppManager.logout(tenantId);
    res.json({ success: true });
  });

  // === CHATS API ===
  app.get(api.chats.list.path, auth, async (req, res) => {
    console.log("tenantId", req.user);
    const tenantId = req.user!.tenantId; // Hardcoded
    const chats = await storage.getChats(tenantId);
    console.log("@@🌹💖👍", chats);
    res.json(chats);
  });

  app.post(api.chats.create.path, auth, async (req, res) => {
    const tenantId = req.user!.tenantId;
    const agentId = req.user!.agentId;

    const { remoteJid, customerName } = api.chats.create.input.parse(req.body);

    const chat = await storage.createChat({
      tenantId,

      remoteJid,
      customerName,
      assignedAgentId: 0,
    });

    res.status(201).json(chat);
  });

  app.get(api.chats.get.path, auth, async (req, res) => {
    res.set("Cache-Control", "no-store");
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    );
    const chat = await storage.getChat(id);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const messages = await storage.getMessages(id);
    console.log("💕💕 api.chats.get.path", messages);
    res.json({ ...chat, messages });
  });

  app.post(api.chats.sendMessage.path, auth, async (req, res) => {
    const chatId = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    );
    const { content } = api.chats.sendMessage.input.parse(req.body);

    console.log(
      `📤 DEBUG: Message send request received from client - Chat ID: ${chatId}, Content: "${content}"`,
    );

    const chat = await storage.getChat(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Send via WhatsApp Client using agent ID
    const client = await WhatsAppManager.getClient(req.user!.agentId);
    if (client) {
      try {
        // Check if client is ready
        const state = await client.getState();
        if (state !== "CONNECTED") {
          console.warn(`⚠️ WhatsApp client not connected. State: ${state}`);
          return res
            .status(503)
            .json({ message: "WhatsApp client not connected" });
        }

        // Add small delay to ensure stability
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Try to get the chat first to ensure it exists
        const whatsappChat = await client.getChatById(chat.remoteJid);
        if (!whatsappChat) {
          console.warn(`⚠️ Chat ${chat.remoteJid} not found in WhatsApp`);
          return res
            .status(404)
            .json({ message: "Chat not found in WhatsApp" });
        }

        await client.sendMessage(chat.remoteJid, content, { sendSeen: false });
        console.log(`✅ Message sent to ${chat.remoteJid}: ${content}`);
      } catch (error) {
        console.error(`❌ Failed to send message to ${chat.remoteJid}:`, error);

        // Check if it's a common whatsapp-web.js error
        if (
          error instanceof Error &&
          error.message &&
          error.message.includes("markedUnread")
        ) {
          console.warn(
            `⚠️ WhatsApp Web session issue detected. Client may need re-authentication.`,
          );
          return res.status(503).json({
            message: "WhatsApp session needs refresh. Please re-scan QR code.",
            code: "SESSION_EXPIRED",
          });
        }

        return res
          .status(500)
          .json({ message: "Failed to send message via WhatsApp" });
      }
    } else {
      console.warn(
        `⚠️ No WhatsApp client available for agent ${req.user!.agentId}`,
      );
      return res.status(503).json({ message: "WhatsApp client not available" });
    }

    // ⚡ Return response immediately with temporary message ID
    // Let client know message was sent to WhatsApp
    const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    res.status(201).json({
      id: tempMessageId,
      chatId,
      tenantId: chat.tenantId,
      content,
      type: "text",
      fromMe: true,
      senderName: "Agent",
      timestamp: new Date().toISOString(),
      isSaving: true,
    });

    // 🔄 BACKGROUND: Save to database asynchronously (don't wait)
    storage
      .createMessage({
        chatId,
        tenantId: chat.tenantId,
        content,
        type: "text",
        fromMe: true,
        senderName: "Agent",
      })
      .then((savedMessage) => {
        console.log(
          `💾 [BACKGROUND] Message saved to DB with ID: ${savedMessage.id}`,
        );
        io.to(`chat_${chatId}`).emit("message_saved", {
          tempId: tempMessageId,
          id: savedMessage.id,
        });
        io.to(`agent_${req.user!.agentId}`).emit("message_saved", {
          tempId: tempMessageId,
          id: savedMessage.id,
        });
      })
      .catch((error) => {
        console.error(`❌ [BACKGROUND] Failed to save message to DB:`, error);
        io.to(`chat_${chatId}`).emit("message_save_error", {
          tempId: tempMessageId,
          error: "Failed to save message",
        });
      });
  });

  app.delete(api.chats.delete.path, auth, async (req, res) => {
    const chatId = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    );
    const tenantId = req.user!.tenantId;

    const chat = await storage.getChat(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Ensure chat belongs to the user's tenant
    if (chat.tenantId !== tenantId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await storage.deleteChat(chatId);
    res.json({ success: true });
  });

  // === WIDGET API ===
  app.get(api.widget.config.path, async (req, res) => {
    const publicKey = req.query.publicKey as string;
    const origin = req.headers.origin; // 🔥 IMPORTANT

    console.log("Widget Config Request Received", req.query);
    console.log("Origin:", origin);
    console.log("publicKey:", publicKey);

    if (!publicKey) {
      return res.status(400).json({ message: "Missing public key" });
    }

    const tenant = await storage.getTenantByPublicKey(publicKey);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // 👇 allowed domains from tenant.allowedDomains
    const allowedDomains: string[] =
      (tenant.allowedDomains as string[] | undefined) || [];

    /**
     * CASE 1: SaaS wants to allow EVERYWHERE (open widget)
     */
    if (allowedDomains.includes("*") && origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    /**
     * CASE 2: Restricted domains
     */
    if (origin && allowedDomains.length > 0 && !allowedDomains.includes("*")) {
      if (!allowedDomains.includes(origin)) {
        return res.status(403).json({
          message: "Origin not allowed",
        });
      }

      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    // Common CORS headers
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    res.json({
      tenantId: tenant.id,
      name: tenant.name,
      config: tenant.config,
      whatsappStatus: tenant.whatsappStatus || "disconnected",
    });
  });

  app.get(api.widget.agents.path, async (req, res) => {
    const publicKey = req.query.publicKey as string;
    const origin = req.headers.origin;

    if (!publicKey) {
      return res.status(400).json({ message: "Missing public key" });
    }

    const tenant = await storage.getTenantByPublicKey(publicKey);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // CORS handling (same as config)
    const allowedDomains: string[] = (tenant.allowedDomains as string[]) || [];
    if (allowedDomains.includes("*") && origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    if (origin && allowedDomains.length > 0 && !allowedDomains.includes("*")) {
      if (!allowedDomains.includes(origin)) {
        return res.status(403).json({ message: "Origin not allowed" });
      }
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    const agents = await storage.getAgentsByTenantId(tenant.id);
    res.json(agents);
  });

  app.get(api.widget.qr.path, async (req, res) => {
    const agentId = parseInt(
      Array.isArray(req.params.agentId)
        ? req.params.agentId[0]
        : req.params.agentId,
    );
    const origin = req.headers.origin;

    const agent = await storage.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const tenant = await storage.getTenant(agent.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // CORS handling
    const allowedDomains: string[] = (tenant.allowedDomains as string[]) || [];
    if (allowedDomains.includes("*") && origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    if (origin && allowedDomains.length > 0 && !allowedDomains.includes("*")) {
      if (!allowedDomains.includes(origin)) {
        return res.status(403).json({ message: "Origin not allowed" });
      }
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    const qr = await WhatsAppManager.getQrCode(agentId);
    const status = WhatsAppManager.getStatus(agentId);

    res.json({
      qr,
      status,
    });
  });

  // === WIDGET CHATS API ===
  app.get(api.widget.chats.list.path, async (req, res) => {
    const publicKey = req.query.publicKey as string;
    const origin = req.headers.origin;

    if (!publicKey) {
      return res.status(400).json({ message: "Missing public key" });
    }

    const tenant = await storage.getTenantByPublicKey(publicKey);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // CORS handling (same as config)
    const allowedDomains: string[] = (tenant.allowedDomains as string[]) || [];
    if (allowedDomains.includes("*") && origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    if (origin && allowedDomains.length > 0 && !allowedDomains.includes("*")) {
      if (!allowedDomains.includes(origin)) {
        return res.status(403).json({ message: "Origin not allowed" });
      }
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    const chats = await storage.getChats(tenant.id);
    res.json(chats);
  });

  app.get(api.widget.chats.get.path, async (req, res) => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    );
    const publicKey = req.query.publicKey as string;
    const origin = req.headers.origin;

    if (!publicKey) {
      return res.status(400).json({ message: "Missing public key" });
    }

    const tenant = await storage.getTenantByPublicKey(publicKey);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // CORS handling
    const allowedDomains: string[] = (tenant.allowedDomains as string[]) || [];
    if (allowedDomains.includes("*") && origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    if (origin && allowedDomains.length > 0 && !allowedDomains.includes("*")) {
      if (!allowedDomains.includes(origin)) {
        return res.status(403).json({ message: "Origin not allowed" });
      }
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    const chat = await storage.getChat(id);
    if (!chat || chat.tenantId !== tenant.id) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const messages = await storage.getMessages(id);
    res.json({ ...chat, messages });
  });

  app.post(api.widget.chats.sendMessage.path, async (req, res) => {
    const chatId = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    );
    const { publicKey, content } = api.widget.chats.sendMessage.input.parse(
      req.body,
    );
    const origin = req.headers.origin;

    if (!publicKey) {
      return res.status(400).json({ message: "Missing public key" });
    }

    const tenant = await storage.getTenantByPublicKey(publicKey);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // CORS handling
    const allowedDomains: string[] = (tenant.allowedDomains as string[]) || [];
    if (allowedDomains.includes("*") && origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    if (origin && allowedDomains.length > 0 && !allowedDomains.includes("*")) {
      if (!allowedDomains.includes(origin)) {
        return res.status(403).json({ message: "Origin not allowed" });
      }
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

    const chat = await storage.getChat(chatId);
    if (!chat || chat.tenantId !== tenant.id) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // For widget, we need to find an available agent to send the message
    // For now, we'll use the first agent of the tenant
    const agents = await storage.getAgentsByTenantId(tenant.id);
    if (agents.length === 0) {
      return res.status(503).json({ message: "No agents available" });
    }

    const agent = agents[0]; // Use first agent for now

    // Send via WhatsApp Client using agent ID
    const client = await WhatsAppManager.getClient(agent.id);
    if (client) {
      try {
        const state = await client.getState();
        if (state !== "CONNECTED") {
          console.warn(`⚠️ WhatsApp client not connected. State: ${state}`);
          return res
            .status(503)
            .json({ message: "WhatsApp client not connected" });
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const whatsappChat = await client.getChatById(chat.remoteJid);
        if (!whatsappChat) {
          console.warn(`⚠️ Chat ${chat.remoteJid} not found in WhatsApp`);
          return res
            .status(404)
            .json({ message: "Chat not found in WhatsApp" });
        }

        await client.sendMessage(chat.remoteJid, content, { sendSeen: false });
        console.log(`✅ Message sent to ${chat.remoteJid}: ${content}`);
      } catch (error) {
        console.error(`❌ Failed to send message to ${chat.remoteJid}:`, error);
        if (
          error instanceof Error &&
          error.message &&
          error.message.includes("markedUnread")
        ) {
          console.warn(
            `⚠️ WhatsApp Web session issue detected. Client may need re-authentication.`,
          );
          return res.status(503).json({
            message: "WhatsApp session needs refresh. Please re-scan QR code.",
            code: "SESSION_EXPIRED",
          });
        }
        return res
          .status(500)
          .json({ message: "Failed to send message via WhatsApp" });
      }
    } else {
      console.warn(`⚠️ No WhatsApp client available for agent ${agent.id}`);
      return res.status(503).json({ message: "WhatsApp client not available" });
    }

    // ⚡ Return response immediately with temporary message ID (OPTIMISTIC)
    const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    res.status(201).json({
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

    // 🔄 BACKGROUND: Save to database asynchronously (don't wait)
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
          `💾 [BACKGROUND] Widget REST API message saved to DB with ID: ${savedMessage.id}`,
        );
        io.to(`chat_${chatId}`).emit("message_saved", {
          tempId: tempMessageId,
          id: savedMessage.id,
        });
      })
      .catch((error) => {
        console.error(
          `❌ [BACKGROUND] Failed to save widget REST message to DB:`,
          error,
        );
        io.to(`chat_${chatId}`).emit("message_save_error", {
          tempId: tempMessageId,
          error: "Failed to save message",
        });
      });
  });

  // === TENANT API ===
  app.get("/api/tenant/:id", auth, async (req, res) => {
    const tenantId = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    );
    if (req.user!.tenantId !== tenantId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const tenant = await storage.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json(tenant);
  });

  // === TENANT CONFIG API ===
  app.put(api.tenant.updateConfig.path, auth, async (req, res) => {
    const tenantId = req.user!.tenantId;
    const updates = api.tenant.updateConfig.input.parse(req.body);

    const tenant = await storage.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Update config
    const newConfig = {
      ...tenant.config,
      ...updates,
    };

    // Update allowedDomains separately
    const newAllowedDomains =
      updates.allowedDomains !== undefined
        ? updates.allowedDomains
        : tenant.allowedDomains;

    await storage.updateTenantConfigAndDomains(
      tenantId,
      newConfig,
      newAllowedDomains as string[],
    );

    res.json({
      success: true,
      config: newConfig,
      allowedDomains: newAllowedDomains,
    });
  });

  // ================open for all=================

  // tested  by postman
  app.post(api.open.tenants.createTenant.path, async (req, res) => {
    try {
      const { username, url } = req.body;

      const existing = await storage.getAgentByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const tenant = await storage.createTenant({
        name: url,
        publicKey: `pk_${Math.random().toString(36).substring(2, 11)}`,
        config: {
          themeColor: "#25D366",
          greetingMessage: "Hi there! How can we help?",
          agentName: username,
        },
        allowedDomains: ["*"],
      });
      res.status(201).json({ tenant });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // tested by postman
  app.post(api.open.agents.createAgent.path, async (req, res) => {
    try {
      const { tenantId, username } = req.body;

      if (!tenantId || !username) {
        return res
          .status(400)
          .json({ message: "Missing tenantId or username" });
      }

      const existing = await storage.getAgentByUsername(username);

      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const agent = await storage.createAgent({
        tenantId: tenantId,
        username,
        password: "password", // In real app, hash this!
      });

      res.status(201).json({ agent });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // === GET AGENTs BY TENANT ID ===
  app.get(api.open.agents.getAgentsByTenantId.path, async (req, res) => {
    try {
      const tenantId = parseInt(
        Array.isArray(req.params.tenantId)
          ? req.params.tenantId[0]
          : req.params.tenantId,
      );

      if (!tenantId) {
        return res.status(400).json({ message: "Missing tenantId" });
      }
      const agents = await storage.getAgentsByTenantId(tenantId);

      res.json({ agents });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // === GET AGENT BY Tend ID ===

  app.get(api.open.agents.getAgentByAgentId.path, async (req, res) => {
    try {
      const tenantId = parseInt(
        Array.isArray(req.params.tenantId)
          ? req.params.tenantId[0]
          : req.params.tenantId,
      );
      const agentId = parseInt(
        Array.isArray(req.params.agentId)
          ? req.params.agentId[0]
          : req.params.agentId,
      );
      if (!tenantId || !agentId) {
        return res.status(400).json({ message: "Missing tenantId or agentId" });
      }
      const agent = await storage.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      if (agent.tenantId !== tenantId) {
        return res
          .status(404)
          .json({ message: "Agent not found for this tenant" });
      }
      res.json({ agent });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.open.agents.getAgentById.path, async (req, res) => {
    try {
      const agentId = parseInt(
        Array.isArray(req.params.agentId)
          ? req.params.agentId[0]
          : req.params.agentId,
      );
      if (!agentId) {
        return res.status(400).json({ message: "Missing agentId" });
      }
      const agent = await storage.getAgent(agentId);
      res.json({ agent });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // get whatsapp status and qr  by agent id

  app.get(api.open.whatsapp.status.path, async (req, res) => {
    try {
      const tenantId = parseInt(
        Array.isArray(req.params.tenantId)
          ? req.params.tenantId[0]
          : req.params.tenantId,
      );
      console.log("tenantId", tenantId);
      const agentId = parseInt(
        Array.isArray(req.params.agentId)
          ? req.params.agentId[0]
          : req.params.agentId,
      );
      console.log("agentId", agentId);

      if (!agentId || !tenantId) {
        return res.status(400).json({ message: "Missing agentId or tenantId" });
      }

      const ValidateTendId = await storage.getTenant(tenantId);

      if (!ValidateTendId) {
        return res.status(400).json({ message: "Invalid tenantId" });
      }

      const ValidateAgentId = await storage.getAgent(agentId);

      if (!ValidateAgentId) {
        return res.status(400).json({ message: "Invalid agentId" });
      }

      const clientStatus = WhatsAppManager.getStatus(agentId);
      console.log(
        `📊 Client status for tend ${tenantId}  agent ${agentId}: ${clientStatus}`,
      );

      let qr = undefined;
      if (ValidateAgentId.whatsappStatus !== "connected") {
        console.log(`📸 Getting QR code for agent ${agentId}`);
        const qrCode = await WhatsAppManager.getQrCode(agentId);
        console.log(`📸 QR result: ${qrCode ? "Got QR" : "No QR needed"}`);
        if (qrCode && qrCode !== "initializing") {
          qr = qrCode;
        }
      }

      res.json({
        status: clientStatus,
        qr,
      });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // get chat by tend id
  app.get(api.open.chats.list.path, async (req, res) => {
    try {
      const tenantId = parseInt(
        Array.isArray(req.params.tenantId)
          ? req.params.tenantId[0]
          : req.params.tenantId,
      );
      if (!tenantId) {
        return res.status(400).json({ message: "Missing tenantId" });
      }
      const chats = await storage.getChats(tenantId);
      const grouped: Record<number, { agentId: number; chats: Chat[] }> = {};

      chats.forEach((chat) => {
        const agentId = chat.assignedAgentId;
        if (!grouped[agentId]) {
          grouped[agentId] = { agentId, chats: [] };
        }
        grouped[agentId].chats.push(chat);
      });

      // Convert to array
      const result = Object.values(grouped);

      res.json(result);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // create chat by tend/agent

  app.post(api.open.chats.create.path, async (req, res) => {
    try {
      const tenantId = parseInt(
        Array.isArray(req.params.tenantId)
          ? req.params.tenantId[0]
          : req.params.tenantId,
      );
      if (!tenantId) {
        return res.status(400).json({ message: "Missing tenantId" });
      }

      const agentId = parseInt(
        Array.isArray(req.params.agentId)
          ? req.params.agentId[0]
          : req.params.agentId,
      );
      console.log("agentId", agentId);
      const { remoteJid, customerName } = req.body;

      if (!remoteJid || !customerName) {
        return res.status(400).json({
          message: "Missing required fields: remoteJid and customerName",
        });
      }
      const chat = await storage.createChat({
        tenantId,
        assignedAgentId: agentId,
        remoteJid,
        customerName,
      });

      res.status(201).json(chat);
    } catch (err) {}
  });

  app.get(api.open.chats.get.path, async (req, res) => {
    try {
      const tenantId = parseInt(
        Array.isArray(req.params.tenantId)
          ? req.params.tenantId[0]
          : req.params.tenantId,
      );
      const agentId = parseInt(
        Array.isArray(req.params.agentId)
          ? req.params.agentId[0]
          : req.params.agentId,
      );

      const chatId = parseInt(
        Array.isArray(req.params.chatId)
          ? req.params.chatId[0]
          : req.params.chatId,
      );

      if (!tenantId || !agentId || !chatId) {
        return res
          .status(400)
          .json({ message: "Missing tenantId or agentId or chatId" });
      }

      // Optional: verify chat belongs to tenant & agent
      const chat = await storage.getChat(chatId);
      if (
        !chat ||
        chat.tenantId !== tenantId ||
        chat.assignedAgentId !== agentId
      ) {
        return res
          .status(404)
          .json({ message: "Chat not found for this agent/tenant" });
      }

      const messages = await storage.getMessages(chatId);

      // Return only messages array (matches expected type)
      res.status(200).json(messages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.post(api.open.chats.sendMessage.path, async (req, res) => {
    try {
      const tenantId = parseInt(
        Array.isArray(req.params.tenantId)
          ? req.params.tenantId[0]
          : req.params.tenantId,
      );
      const agentId = parseInt(
        Array.isArray(req.params.agentId)
          ? req.params.agentId[0]
          : req.params.agentId,
      );
      const chatId = parseInt(
        Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
      );
      const { content } = req.body;

      if (!tenantId || !agentId || !chatId) {
        return res
          .status(400)
          .json({ message: "Missing tenantId, agentId, or chatId" });
      }

      if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Fetch the chat to make sure it belongs to this tenant & agent
      const chat = await storage.getChat(chatId);
      if (
        !chat ||
        chat.tenantId !== tenantId ||
        chat.assignedAgentId !== agentId
      ) {
        return res
          .status(404)
          .json({ message: "Chat not found for this agent/tenant" });
      }

      // Create the message
      const message = await storage.createMessage({
        chatId,
        tenantId,
        content,
        fromMe: true, // assuming agent is sending
        senderName: "Agent", // you can replace with actual agent name
        type: "text", // can be dynamic if needed
        timestamp: new Date(),
      });

      return res.status(201).json(message);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ============================

  return httpServer;
}
