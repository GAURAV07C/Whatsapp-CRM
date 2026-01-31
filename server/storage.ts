import { db } from "./db";
import {
  tenants,
  agents,
  chats,
  messages,
  type Tenant,
  type Agent,
  type Chat,
  type Message,
  type CreateTenantRequest,
  type CreateAgentRequest,
  type UpdateTenantConfig,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Tenants
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantByPublicKey(key: string): Promise<Tenant | undefined>;
  createTenant(tenant: CreateTenantRequest): Promise<Tenant>;
  updateTenantConfig(id: number, config: UpdateTenantConfig): Promise<Tenant>;
  updateWhatsappStatus(id: number, status: string): Promise<void>;
  updateTenantConfigAndDomains(
    id: number,
    config: UpdateTenantConfig,
    allowedDomains: string[],
  ): Promise<Tenant>;

  // Agents
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentByUsername(username: string): Promise<Agent | undefined>;
  getAgentsByTenantId(tenantId: number): Promise<Agent[]>;
  createAgent(agent: CreateAgentRequest): Promise<Agent>;

  // Chats
  getChats(tenantId: number, assignedAgentId?: number): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  getChatByRemoteJid(
    tenantId: number,
    assignedAgentId: number,
    remoteJid: string,
  ): Promise<Chat | undefined>;
  createChat(chat: any): Promise<Chat>;
  updateChatStatus(id: number, status: "open" | "closed"): Promise<Chat>;
  deleteChat(id: number): Promise<void>;

  // Messages
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: any): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  // Tenants
  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantByPublicKey(key: string): Promise<Tenant | undefined> {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.publicKey, key));
    return tenant;
  }

  async createTenant(tenant: CreateTenantRequest): Promise<Tenant> {
    const result = await db
      .insert(tenants)
      .values({
        name: tenant.name,
        publicKey: tenant.publicKey,
        config: tenant.config as any,
        allowedDomains: (tenant.allowedDomains || []) as string[],
      })
      .$returningId();
    const newTenant = await this.getTenant(result[0].id);
    return newTenant!;
  }

  async updateTenantConfig(
    id: number,
    config: UpdateTenantConfig,
  ): Promise<Tenant> {
    const current = await this.getTenant(id);
    if (!current) throw new Error("Tenant not found");

    const currentConfig = current.config || {
      themeColor: "#25D366",
      greetingMessage: "Hello! How can we help you?",
      agentName: "Support Agent",
    };
    const newConfig = { ...currentConfig, ...config };
    await db
      .update(tenants)
      .set({ config: newConfig })
      .where(eq(tenants.id, id));

    const updated = await this.getTenant(id);
    return updated!;
  }

  async updateTenantConfigAndDomains(
    id: number,
    config: UpdateTenantConfig,
    allowedDomains: string[],
  ): Promise<Tenant> {
    const current = await this.getTenant(id);
    if (!current) throw new Error("Tenant not found");

    const currentConfig = current.config || {
      themeColor: "#25D366",
      greetingMessage: "Hello! How can we help you?",
      agentName: "Support Agent",
    };
    const newConfig = { ...currentConfig, ...config };
    await db
      .update(tenants)
      .set({ config: newConfig, allowedDomains })
      .where(eq(tenants.id, id));

    const updated = await this.getTenant(id);
    return updated!;
  }

  async updateWhatsappStatus(id: number, status: string): Promise<void> {
    await db
      .update(tenants)
      .set({ whatsappStatus: status })
      .where(eq(tenants.id, id));
  }

  // Agents
  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async getAgentByUsername(username: string): Promise<Agent | undefined> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.username, username));
    return agent;
  }

  async getAgentsByTenantId(tenantId: number): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.tenantId, tenantId));
  }

  async createAgent(agent: CreateAgentRequest): Promise<Agent> {
    const result = await db.insert(agents).values(agent).$returningId();
    console.log("Created agent with ID:", result[0].id);
    const newAgent = await this.getAgent(result[0].id);
    return newAgent!;
  }

  // Chats
  async getChats(tenantId: number, assignedAgentId?: number): Promise<Chat[]> {
    const conditions = [eq(chats.tenantId, tenantId)];
    if (assignedAgentId) {
      conditions.push(eq(chats.assignedAgentId, assignedAgentId));
    }

    const whereClause =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    return await db
      .select()
      .from(chats)
      .where(whereClause)
      .orderBy(desc(chats.lastMessageAt));
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  // storage.ts (DatabaseStorage class ke andar)
  async getAgentChats(
    tenantId: number,
    assignedAgentId: number,
  ): Promise<Chat[]> {
    return await db
      .select({
        id: chats.id,
        tenantId: chats.tenantId,
        remoteJid: chats.remoteJid,
        customerName: chats.customerName,
        status: chats.status,
        assignedAgentId: chats.assignedAgentId,
        unreadCount: chats.unreadCount,
        lastMessageAt: chats.lastMessageAt,
        createdAt: chats.createdAt,
      })
      .from(chats)
      .where(
        and(
          eq(chats.tenantId, tenantId),
          eq(chats.assignedAgentId, assignedAgentId),
        ),
      )
      .orderBy(desc(chats.lastMessageAt));
  }

  async getChatByRemoteJid(
    tenantId: number,
    assignedAgentId: number,
    remoteJid: string,
  ): Promise<Chat | undefined> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.tenantId, tenantId),
          eq(chats.assignedAgentId, assignedAgentId),
          eq(chats.remoteJid, remoteJid),
        ),
      );
    return chat;
  }

  async createChat(chat: {
    tenantId: number;
    assignedAgentId: number;
    remoteJid: string;
    customerName?: string;
  }): Promise<Chat> {
    // check if chat already exists for this agent
    const existing = await this.getChatByRemoteJid(
      chat.tenantId,
      chat.assignedAgentId,
      chat.remoteJid,
    );
    if (existing) return existing;

    const result = await db.insert(chats).values(chat).$returningId();
    const newChat = await this.getChat(result[0].id);
    return newChat!;
  }

  async updateChatStatus(id: number, status: "open" | "closed"): Promise<Chat> {
    await db.update(chats).set({ status }).where(eq(chats.id, id));
    const updated = await this.getChat(id);
    return updated!;
  }

  async deleteChat(id: number): Promise<void> {
    // Delete messages first to avoid foreign key constraint
    await db.delete(messages).where(eq(messages.chatId, id));
    // Then delete the chat
    await db.delete(chats).where(eq(chats.id, id));
  }

  // Messages
  async getMessages(chatId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.timestamp);
  }

  

  async createMessage(message: any): Promise<Message> {
    const result = await db.insert(messages).values(message).$returningId();
    const newMessage = await db
      .select()
      .from(messages)
      .where(eq(messages.id, result[0].id))
      .then(([msg]) => msg);

    // Update chat last message and unread count
    const currentChat = await this.getChat(message.chatId);
    const newUnreadCount = message.fromMe
      ? 0
      : (currentChat?.unreadCount || 0) + 1;

    await db
      .update(chats)
      .set({
        lastMessageAt: new Date(),
        unreadCount: newUnreadCount,
      })
      .where(eq(chats.id, message.chatId));

    return newMessage!;
  }

  // =================open for all================

  // =======================================================
}

export const storage = new DatabaseStorage();
