import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { WhatsAppManager } from "./whatsapp";
import { storage } from "./storage";

import cors from "cors";
const app = express();
const httpServer = createServer(app);
await registerRoutes(httpServer, app);
// 🔥 AUTO BOOTSTRAP WHATSAPP CLIENTS

async function startWhatsApp() {
  const agentId = 3;
  const client = await WhatsAppManager.getClient(agentId);

  if (!client) {
    console.error("❌ Failed to initialize WhatsApp client.");
    return;
  }

  console.log("✅ WhatsApp client initialized for agent", agentId);

  // ready event will fire automatically when WhatsApp is ready
  // no need to emit manually

  // You can still attach additional logs for debugging if needed
  client.on("ready", () => {
    console.log("✅ WhatsApp client is READY to receive messages!");
  });

  client.on("message", async (msg) => {
    console.log("🔥 MESSAGE RECEIVED!");
    console.log(`From: ${msg.from}`);
    console.log(`Body: ${msg.body}`);

    // Optionally handle media, save to DB, emit to socket, etc.
    const contact = await msg.getContact();
    const chat = await msg.getChat();
    console.log(`Contact: ${contact.pushname} (${contact.number})`);
    console.log(`Chat ID: ${chat.id}`);
  });
}

// 4️⃣ Run the test
// 🔥 AUTO BOOTSTRAP WHATSAPP CLIENTS
startWhatsApp().catch(console.error);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
