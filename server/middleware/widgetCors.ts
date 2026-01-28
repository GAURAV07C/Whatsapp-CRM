import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export const widgetCors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const origin = req.headers.origin;
    const publicKey = req.query.publicKey as string;

    if (!publicKey) {
      return res.status(400).json({ error: "publicKey missing" });
    }

    const tenant = await storage.getTenantByPublicKey(publicKey);

    if (!tenant) {
      return res.status(401).json({ error: "Invalid public key" });
    }

    // 👇 config se allowed origins
    const allowedOrigins: string[] =
      (tenant.config as any)?.allowedOrigins || [];

    // origin validation
    if (origin && allowedOrigins.length > 0) {
      if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({
          error: "Origin not allowed",
        });
      }

      // 🔥 IMPORTANT
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    // attach tenant for next handlers (useful)
    (req as any).tenant = tenant;

    next();
  } catch (err) {
    console.error("Widget CORS error", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
