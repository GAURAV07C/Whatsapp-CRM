// swagger.ts
import swaggerUi from "swagger-ui-express";


// Basic OpenAPI document
const openApiDoc = {
  openapi: "3.0.0",
  info: {
    title: "WhatsApp CRM API",
    version: "1.0.0",
    description: "Comprehensive API documentation for WhatsApp CRM system. This API provides endpoints for managing tenants (companies), agents, WhatsApp connections, chats, and messaging functionality. The 'open' endpoints are publicly accessible and can be used by external systems to integrate with the CRM platform.",
  },
  components: {
    // securitySchemes: {
    //   bearerAuth: {
    //     type: "http",
    //     scheme: "bearer",
    //     bearerFormat: "JWT",
    //   },
    // },
    schemas: {
      Tenant: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          publicKey: { type: "string" },
          config: {
            type: "object",
            properties: {
              themeColor: { type: "string" },
              greetingMessage: { type: "string" },
              agentName: { type: "string" },
              logoUrl: { type: "string" },
            },
          },
          allowedDomains: {
            type: "array",
            items: { type: "string" },
          },
          whatsappStatus: { type: "string", enum: ["disconnected", "connected", "qr_ready"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Agent: {
        type: "object",
        properties: {
          id: { type: "number" },
          tenantId: { type: "number" },
          username: { type: "string" },
          password: { type: "string" },
          role: { type: "string" },
          isOnline: { type: "boolean" },
          whatsappStatus: { type: "string", enum: ["disconnected", "connected", "qr_ready"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Chat: {
        type: "object",
        properties: {
          id: { type: "number" },
          tenantId: { type: "number" },
          remoteJid: { type: "string" },
          customerName: { type: "string" },
          status: { type: "string" },
          assignedAgentId: { type: "number" },
          unreadCount: { type: "number" },
          lastMessageAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Message: {
        type: "object",
        properties: {
          id: { type: "number" },
          chatId: { type: "number" },
          tenantId: { type: "number" },
          content: { type: "string" },
          type: { type: "string" },
          fromMe: { type: "boolean" },
          senderName: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/api/open/tenants": {
      post: {
        summary: "Create Tenant",
        description: "Creates a new tenant (company) in the WhatsApp CRM system. This endpoint initializes a new company account with default configuration settings including theme colors, greeting messages, and agent names. The tenant will be assigned a unique public key for widget integration and can be configured with allowed domains for security. This is typically the first step when onboarding a new company to the platform.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", description: "Agent username for the tenant" },
                  url: { type: "string", description: "Tenant name/URL" },
                },
                required: ["username", "url"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Tenant created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tenant: { $ref: "#/components/schemas/Tenant" },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid input",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/open/agents": {
      post: {
        summary: "Create Agent",
        description: "Creates a new support agent account for an existing tenant. The agent will be able to handle WhatsApp conversations, manage chats, and access the CRM dashboard. Each agent gets a unique username and is automatically assigned a default password that should be changed upon first login. Agents can be assigned different roles (admin, agent) with varying levels of permissions.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  tenantId: { type: "number", description: "ID of the tenant" },
                  username: { type: "string", description: "Agent username" },
                },
                required: ["tenantId", "username"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Agent created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    agent: { $ref: "#/components/schemas/Agent" },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid input or username already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/open/agents/tenant/{tenantId}": {
      get: {
        summary: "Get Agents by Tenant ID",
        description: "Retrieves a complete list of all support agents associated with a specific tenant (company). This endpoint is useful for administrative purposes, allowing you to see all active agents, their roles, and their current online status. The response includes agent details such as usernames, roles, and WhatsApp connection status for each agent in the tenant.",
        security: [],
        parameters: [
          {
            name: "tenantId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the tenant",
          },
        ],
        responses: {
          200: {
            description: "Agents retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    agents: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Agent" },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing tenantId",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/open/tend/agent/{tenantId}/{agentId}": {
      get: {
        summary: "Get Agent by Tenant and Agent ID",
        description: "Retrieves detailed information about a specific agent within a tenant. This endpoint validates that the agent belongs to the specified tenant and returns comprehensive agent data including their role, online status, and WhatsApp connection status. Useful for verifying agent-tenant relationships and getting agent details for administrative purposes.",
        security: [],
        parameters: [
          {
            name: "tenantId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the tenant",
          },
          {
            name: "agentId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the agent",
          },
        ],
        responses: {
          200: {
            description: "Agent retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    agent: { $ref: "#/components/schemas/Agent" },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing tenantId or agentId",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          404: {
            description: "Agent not found for this tenant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/open/agents/{agentId}": {
      get: {
        summary: "Get Agent by ID",
        description: "Retrieves comprehensive information about a specific agent using their unique ID. This endpoint returns all agent details including their tenant association, role, online status, and WhatsApp connection status. Useful for getting agent information when you only have the agent ID without knowing the tenant context.",
        security: [],
        parameters: [
          {
            name: "agentId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the agent",
          },
        ],
        responses: {
          200: {
            description: "Agent retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    agent: { $ref: "#/components/schemas/Agent" },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing agentId",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          404: {
            description: "Agent not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/open/whatsapp/status/{tenantId}/{agentId}": {
      get: {
        summary: "Get WhatsApp Status",
        description: "Retrieves the current WhatsApp Web connection status for a specific agent. This endpoint checks if the agent's WhatsApp session is active, disconnected, or ready for QR code scanning. If the agent is not connected, it may return a QR code in base64 format that can be used to authenticate the WhatsApp Web session. This is essential for monitoring agent availability and managing WhatsApp connectivity.",
        security: [],
        parameters: [
          {
            name: "tenantId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the tenant",
          },
          {
            name: "agentId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the agent",
          },
        ],
        responses: {
          200: {
            description: "Status retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: ["disconnected", "connected", "qr_ready"],
                    },
                    qr: {
                      type: "string",
                      description: "Base64 QR code (if available)",
                      le: "![QR Code](data:image/jpeg;base64,/9j/2wBDABALDA4MChAO...)"

                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing agentId or tenantId",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/open/chats/{tenantId}": {
      get: {
        summary: "Get Chats by Tenant ID",
        description: "Retrieves all active chats for a specific tenant, organized and grouped by the assigned agent. This endpoint provides a comprehensive overview of all ongoing conversations within a company, showing which agents are handling which chats. The response includes chat details like customer information, unread message counts, and last activity timestamps.",
        security: [],
        parameters: [
          {
            name: "tenantId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the tenant",
          },
        ],
        responses: {
          200: {
            description: "Chats retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      agentId: { type: "number" },
                      chats: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Chat" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing tenantId",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/open/chats/{tenantId}/{agentId}": {
      get: {
        summary: "Get Chats by Tenant and Agent ID",
        description: "Retrieves a list of all messages for chats assigned to a specific agent within a tenant. This endpoint returns the complete message history for all conversations handled by the specified agent, useful for building chat interfaces or reviewing agent activity. Messages are returned in chronological order with sender information and timestamps.",
        security: [],
        parameters: [
          {
            name: "tenantId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the tenant",
          },
          {
            name: "agentId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the agent",
          },
        ],
        responses: {
          200: {
            description: "Chats retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Message" },
                },
              },
            },
          },
          400: {
            description: "Missing tenantId or agentId",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          404: {
            description: "Chat not found for this agent/tenant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      post: {
        summary: "Create Chat",
        description: "Initiates a new chat conversation for a specific agent within a tenant. This endpoint creates a chat record with the customer's WhatsApp ID and assigns it to the specified agent. The chat will be marked as active and ready for messaging. This is typically used when starting proactive conversations or when an agent wants to initiate contact with a customer.",
        security: [],
        parameters: [
          {
            name: "tenantId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the tenant",
          },
          {
            name: "agentId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the agent",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  remoteJid: { type: "string", description: "WhatsApp ID (phone@c.us)" },
                  customerName: { type: "string", description: "Customer name" },
                },
                required: ["remoteJid"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Chat created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Chat" },
              },
            },
          },
          400: {
            description: "Missing required fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/open/chats/{tenantId}/{agentId}/{chatId}/messages": {
      get: {
        summary: "Get Messages by Chat ID",
        description: "Retrieves the complete message history for a specific chat conversation. This endpoint returns all messages in chronological order, including both incoming customer messages and outgoing agent responses. Each message includes sender information, content, timestamp, and message type. This is essential for displaying chat history in CRM interfaces and maintaining conversation context.",
        security: [],
        parameters: [
          {
            name: "tenantId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the tenant",
          },
          {
            name: "agentId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the agent",
          },
          {
            name: "chatId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the chat",
          },
        ],
        responses: {
          200: {
            description: "Messages retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Message" },
                },
              },
            },
          },
          400: {
            description: "Missing tenantId, agentId, or chatId",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          404: {
            description: "Chat not found for this agent/tenant",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/open/chats/getByRemoteJid/{tenantId}/{agentId}/{remoteJid}": {
      get: {
        summary: "Get Chat by Remote JID with Messages",
        description: "Retrieves a specific chat conversation by its WhatsApp remote JID (phone number) along with the complete message history. This endpoint finds the chat associated with the given remoteJid for the specified tenant and agent, then returns both the chat details and all messages in chronological order. This is useful for retrieving conversation history when you only have the customer's WhatsApp number.",
        security: [],
        parameters: [
          {
            name: "tenantId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the tenant (company)",
          },
          {
            name: "agentId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the agent assigned to the chat",
          },
          {
            name: "remoteJid",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "WhatsApp remote JID (phone number) of the customer",
          },
        ],
        responses: {
          200: {
            description: "Chat and messages retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    tenantId: { type: "number" },
                    remoteJid: { type: "string" },
                    customerName: { type: "string" },
                    status: { type: "string" },
                    assignedAgentId: { type: "number" },
                    unreadCount: { type: "number" },
                    lastMessageAt: { type: "string", format: "date-time" },
                    createdAt: { type: "string", format: "date-time" },
                    messages: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Message" },
                      description: "All messages in the chat, ordered chronologically",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing required parameters (tenantId, agentId, or remoteJid)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          404: {
            description: "Chat not found for this remoteJid, or tenant/agent not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          500: {
            description: "Internal server error while fetching chat data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      post: {
        summary: "Create or Get Chat by Remote JID",
        description: "Creates a new chat conversation for a specific customer (identified by remoteJid) if it doesn't exist, or returns the existing chat if it does. This endpoint ensures there's always a chat record for a customer-agent pair, making it safe to call before sending messages. The chat will be assigned to the specified agent and tenant.",
        security: [],
        parameters: [
          {
            name: "tenantId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the tenant (company)",
          },
          {
            name: "agentId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the agent to assign the chat to",
          },
          {
            name: "remoteJid",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "WhatsApp remote JID (phone number) of the customer",
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  customerName: {
                    type: "string",
                    description: "Optional customer name to associate with the chat"
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Existing chat found and returned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Chat" },
              },
            },
          },
          201: {
            description: "New chat created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Chat" },
              },
            },
          },
          400: {
            description: "Missing required parameters or invalid input",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          404: {
            description: "Tenant or agent not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          500: {
            description: "Internal server error while creating or retrieving chat",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },

    "/api/open/chats/sendMessageByRemoteJid/{tenantId}/{agentId}/{remoteJid}": {
      post: {
        summary: "Send WhatsApp Message by Remote JID",
        description: "Sends a text message to a WhatsApp number (remoteJid) using a specific agent. This endpoint automatically creates a chat if one doesn't exist for the remoteJid, then sends the message via WhatsApp. The message is saved to the database asynchronously, and real-time updates are sent to connected clients. This is similar to sendMessageNoAuth but uses remoteJid instead of chatId, making it perfect for direct messaging to WhatsApp numbers.",
        security: [],
        parameters: [
          {
            name: "tenantId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the tenant (company)",
          },
          {
            name: "agentId",
            in: "path",
            required: true,
            schema: { type: "number" },
            description: "ID of the WhatsApp agent sending the message",
          },
          {
            name: "remoteJid",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "WhatsApp remote JID (phone number) of the recipient",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  content: {
                    type: "string",
                    description: "Text message content to send via WhatsApp"
                  },
                },
                required: ["content"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Message sent successfully (temporary message ID returned, actual save happens asynchronously)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Temporary message ID" },
                    chatId: { type: "number", description: "ID of the chat" },
                    tenantId: { type: "number", description: "ID of the tenant" },
                    content: { type: "string", description: "Message content" },
                    type: { type: "string", description: "Message type (text)" },
                    fromMe: { type: "boolean", description: "True for outgoing messages" },
                    senderName: { type: "string", description: "Sender name" },
                    timestamp: { type: "string", format: "date-time", description: "Message timestamp" },
                    isSaving: { type: "boolean", description: "True while message is being saved to database" },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing required parameters or invalid message content",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          404: {
            description: "Tenant or agent not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          503: {
            description: "WhatsApp client not available or not connected",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          500: {
            description: "Internal server error while sending message",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },

    "/api/chats/sendMessageNoAuth/{agentId}/{id}": {
  "post": {
    "summary": "Send WhatsApp Message without Authentication",
    "description": "Sends a text message to a specific chat using a specific agent. No authentication required. The message is sent via WhatsApp and saved to the database asynchronously.",
    "security": [],
    "parameters": [
      {
        "name": "agentId",
        "in": "path",
        "required": true,
        "schema": { "type": "integer" },
        "description": "ID of the WhatsApp agent sending the message"
      },
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": { "type": "integer" },
        "description": "Chat ID in the database"
      }
    ],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "content": { "type": "string", "description": "Text message to send" }
            },
            "required": ["content"]
          }
        }
      }
    },
    "responses": {
      "201": {
        "description": "Message sent successfully (temporary message ID returned)",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Message" }
          }
        }
      },
      "400": {
        "description": "Missing agentId, chat ID, or message content",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      },
      "404": {
        "description": "Chat not found",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      },
      "503": {
        "description": "WhatsApp client not available or not connected",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      },
      "500": {
        "description": "Failed to send message due to internal error",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  }
}

  },
};

// Export Swagger UI middleware for integration into main server
export const swaggerUiMiddleware = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(openApiDoc);
