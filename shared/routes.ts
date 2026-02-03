import { z } from "zod";
import {
  insertTenantSchema,
  insertAgentSchema,
  insertChatSchema,
  insertMessageSchema,
  tenants,
  agents,
  chats,
  messages,
  type MeResponse,
} from "./schema";
import type { AgentLoginRequest, AgentLoginResponse } from "./schema";
import { response } from "express";

export type { AgentLoginRequest, AgentLoginResponse, MeResponse };

// Shared error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // === AUTH & TENANTS ===
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/auth/login",
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.object({
          token: z.string(),
          agent: z.custom<typeof agents.$inferSelect>(),
          tenant: z.custom<typeof tenants.$inferSelect>(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me",
      responses: {
        200: z.object({
          agentId: z.number(),
          username: z.string(),
          tenantId: z.number(),
          publicKey: z.string(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },

  open: {
    tenants: {
      createTenant: {
        method: "POST" as const,
        path: "/api/open/tenants",
        input: z.object({
          username: z.string(),
          url: z.string(),
        }),
        responses: {
          201: z.object({
            tenant: z.custom<typeof tenants.$inferSelect>(),
          }),
        },
      },
    },

    agents: {
      createAgent: {
        method: "POST" as const,
        path: "/api/open/agents",
        input: z.object({
          tenantId: z.number(),
          username: z.string(),
        }),
      },
      getAgentsByTenantId: {
        method: "GET" as const,
        path: "/api/open/agents/tenant/:tenantId",
        responses: {
          200: z.array(z.custom<typeof agents.$inferSelect>()),
        },
      },
      getAgentByAgentId: {
        method: "GET" as const,
        path: "/api/open/tend/agent/:tenantId/:agentId",
        responses: {
          200: z.custom<typeof agents.$inferSelect>(),
        },
      },

      getAgentById: {
        method: "GET" as const,
        path: "/api/open/agents/:agentId",
        responses: {
          200: z.custom<typeof agents.$inferSelect>(),
        },
      },
    },

    whatsapp: {
      status: {
        method: "GET" as const,
        path: "/api/open/whatsapp/status/:tenantId/:agentId",
        responses: {
          200: z.object({
            status: z.enum(["disconnected", "connected", "qr_ready"]),
            qr: z.string().optional(), // Base64 QR code
          }),
        },
      },
      logout: {
        method: "POST" as const,
        path: "/api/open/whatsapp/logout",
        responses: {
          200: z.object({ success: z.boolean() }),
        },
      },
    },

   chats: {
  list: {
    method: "GET",
    path: "/api/open/chats/:tenantId",
  },

  listByAgent: {
    method: "GET",
    path: "/api/open/chats/:tenantId/:agentId",
  },

  create: {
    method: "POST",
    path: "/api/open/chats/:tenantId/:agentId",
  },

  get: {
    method: "GET",
    path: "/api/open/chats/:tenantId/:agentId/:chatId",
  },

  messages: {
    list: {
      method: "GET",
      path: "/api/open/chats/:tenantId/:agentId/:chatId/messages",
    },

    send: {
      method: "POST",
      path: "/api/open/chats/:tenantId/:agentId/:chatId/messages",
    },
  },

  delete: {
    method: "DELETE",
    path: "/api/open/chats/:tenantId/:agentId/:chatId",
  },

  getByRemoteJid: {
    method: "GET",
    path: "/api/open/chats/getByRemoteJid/:tenantId/:agentId/:remoteJid",
    responses: {
      200: z.custom<
        typeof chats.$inferSelect & {
          messages: (typeof messages.$inferSelect)[];
        }
      >(),
      404: errorSchemas.notFound,
    },
  },
  sendMessageByRemoteJid: {
    method: "POST",
    path: "/api/open/chats/sendMessageByRemoteJid/:tenantId/:agentId/:remoteJid",
    input: z.object({
      content: z.string(),
    }),
    responses: {
      201: z.custom<typeof messages.$inferSelect>(),
      400: errorSchemas.validation,
      404: errorSchemas.notFound,
      503: z.object({
        message: z.string(),
      }),
    },
  },
}

  },

  whatsapp: {
    status: {
      method: "GET" as const,
      path: "/api/whatsapp/status",
      responses: {
        200: z.object({
          status: z.enum(["disconnected", "connected", "qr_ready"]),
          qr: z.string().optional(), // Base64 QR code
        }),
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/whatsapp/logout",
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },

  // === CHATS (Agent View) ===
  chats: {
    list: {
      method: "GET" as const,
      path: "/api/chats",
      responses: {
        200: z.array(z.custom<typeof chats.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/chats",
      input: z.object({
        remoteJid: z.string(),
        customerName: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof chats.$inferSelect>(),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/chats/:id",
      responses: {
        200: z.custom<
          typeof chats.$inferSelect & {
            messages: (typeof messages.$inferSelect)[];
          }
        >(),
        404: errorSchemas.notFound,
      },
    },
    sendMessage: {
      method: "POST" as const,
      path: "/api/chats/:id/messages",
      input: z.object({
        content: z.string(),
      }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
      },
    },
      sendMessage2: {
      method: "POST" as const,
      path: "/api/chats/:agentId/:id/messages",
      input: z.object({
        content: z.string(),
      }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/chats/:id",
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
  },

  // === WIDGET (Public Access) ===
  widget: {
    config: {
      method: "GET" as const,
      path: "/api/widget/config",
      input: z.object({
        publicKey: z.string(),
      }),
      responses: {
        200: z.object({
          tenantId: z.number(),
          name: z.string(),
          config: z
            .object({
              themeColor: z.string(),
              greetingMessage: z.string(),
              agentName: z.string(),
              logoUrl: z.string().optional(),
            })
            .nullable(),
          whatsappStatus: z.string(),
        }),
        404: errorSchemas.notFound,
      },
    },
    agents: {
      method: "GET" as const,
      path: "/api/widget/agents",
      input: z.object({
        publicKey: z.string(),
      }),
      responses: {
        200: z.array(z.custom<typeof agents.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
    qr: {
      method: "GET" as const,
      path: "/api/widget/whatsapp/qr/:agentId",
      responses: {
        200: z.object({
          qr: z.string(),
          status: z.string(),
        }),
        404: errorSchemas.notFound,
      },
    },
    chats: {
      list: {
        method: "GET" as const,
        path: "/api/widget/chats",
        input: z.object({
          publicKey: z.string(),
        }),
        responses: {
          200: z.array(z.custom<typeof chats.$inferSelect>()),
        },
      },
      get: {
        method: "GET" as const,
        path: "/api/widget/chats/:id",
        input: z.object({
          publicKey: z.string(),
        }),
        responses: {
          200: z.custom<
            typeof chats.$inferSelect & {
              messages: (typeof messages.$inferSelect)[];
            }
          >(),
          404: errorSchemas.notFound,
        },
      },
      sendMessage: {
        method: "POST" as const,
        path: "/api/widget/chats/:id/messages",
        input: z.object({
          publicKey: z.string(),
          content: z.string(),
        }),
        responses: {
          201: z.custom<typeof messages.$inferSelect>(),
        },
      },
    },
  },

  // === TENANT CONFIG ===
  tenant: {
    updateConfig: {
      method: "PUT" as const,
      path: "/api/tenant/config",
      input: z.object({
        themeColor: z.string().optional(),
        greetingMessage: z.string().optional(),
        agentName: z.string().optional(),
        logoUrl: z.string().optional(),
        allowedDomains: z.array(z.string()).optional(),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
          config: z.object({
            themeColor: z.string(),
            greetingMessage: z.string(),
            agentName: z.string(),
            logoUrl: z.string().optional(),
          }),
          allowedDomains: z.array(z.string()),
        }),
      },
    },
  },
};

export const ws = {
  // Server -> Client
  events: {
    qrCode: "qr_code", // Payload: { qr: string }
    status: "status_change", // Payload: { status: string }
    message: "new_message", // Payload: Message
    chatUpdate: "chat_update", // Payload: Chat
  },
  // Client -> Server
  actions: {
    joinRoom: "join_room", // Payload: { tenantId: number } (Agents) or { chatId: number } (Widget)
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
