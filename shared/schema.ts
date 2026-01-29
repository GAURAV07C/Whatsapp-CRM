// shared/schema.ts
import {
  mysqlTable,
  text,
  serial,
  int,
  boolean,
  timestamp,
  json,
  varchar,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Tenants (Companies using the platform)
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  publicKey: varchar("public_key", { length: 255 }).notNull().unique(), // Used for embed
  config: json("config")
    .$type<{
      themeColor: string;
      greetingMessage: string;
      agentName: string;
      logoUrl?: string;
    }>()
    .notNull()
    .default({
      themeColor: "#25D366",
      greetingMessage: "Hello! How can we help you?",
      agentName: "Support Agent",
    }), // default empty JSON, populate defaults in code if needed

  allowedDomains: json("allowed_domains").$type<string[]>().default([]), // MySQL does not support array type
  whatsappStatus: text("whatsapp_status").default("disconnected"), // disconnected, connected, qr_ready
  createdAt: timestamp("created_at").defaultNow(),
});

// Users (Agents & Admins)
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(), // Hashed
  role: text("role").default("agent"),
  isOnline: boolean("is_online").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// WhatsApp Sessions
export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(), // Usually "agent-{id}"
  agentId: int("agent_id").references(() => agents.id).notNull(),
  data: json("data").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chats
export const chats = mysqlTable("chats", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  remoteJid: text("remote_jid").notNull(), // WhatsApp ID (phone@c.us)
  customerName: text("customer_name"),
  status: text("status").default("open"),
  assignedAgentId: int("assigned_agent_id").references(() => agents.id),
  unreadCount: int("unread_count").default(0),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  
});

// Messages
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  chatId: int("chat_id")
    .references(() => chats.id)
    .notNull(),
  tenantId: int("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  content: text("content").notNull(),
  type: text("type").default("text"), // text, image, etc.
  fromMe: boolean("from_me").default(false), // true if sent by agent
  senderName: text("sender_name"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// === RELATIONS ===
export const tenantsRelations = relations(tenants, ({ many }) => ({
  agents: many(agents),
  chats: many(chats),
}));

export const agentsRelations = relations(agents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [agents.tenantId],
    references: [tenants.id],
  }),
}));

export const meResponseSchema = z.object({
  agentId: z.number(),
  username: z.string(),
  tenantId: z.number(),
  publicKey: z.string(),
  role: z.string(),
});
export type MeResponse = z.infer<typeof meResponseSchema>; // WhatsApp Sessions (For whatsapp-web.js persistence) export const sessions = pgTable("sessions", { id: text("id").primaryKey(), // Usually "tenant-{id}" data: jsonb("data").notNull(), updatedAt: timestamp("updated_at").defaultNow(), });

export const chatsRelations = relations(chats, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [chats.tenantId],
    references: [tenants.id],
  }),
  assignedAgent: one(agents, {
    fields: [chats.assignedAgentId],
    references: [agents.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

// === INSERT SCHEMAS (Zod) ===
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  whatsappStatus: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  isOnline: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  unreadCount: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

// === TYPES ===
export type Tenant = typeof tenants.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type CreateTenantRequest = z.infer<typeof insertTenantSchema>;
export type CreateAgentRequest = z.infer<typeof insertAgentSchema>;

export type AgentLoginRequest = {
  username: string;
  password: string;
};

export type AgentLoginResponse = {
  token: string;
  agent: Agent;
  tenant: Tenant;
};

export type UpdateTenantConfig = {
  themeColor?: string;
  greetingMessage?: string;
  agentName?: string;
  logoUrl?: string;
  allowedDomains?: string[];
};

export type WidgetConfigResponse = {
  tenantId: number;
  name: string;
  config: Tenant["config"];
  whatsappStatus: string;
};
