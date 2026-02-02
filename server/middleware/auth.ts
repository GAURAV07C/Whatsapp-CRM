import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function auth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // console.log("Auth Middleware - Token:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  let token;
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7); // Remove "Bearer "
  } else {
    token = authHeader;
  }

  console.log("token" , token)

  if (!token || token === "null") {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    // console.log("this is decode", decoded);
    const { agentId, tenantId } = decoded;

    if (!agentId || !tenantId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const agent = await storage.getAgent(agentId);
    const tenant = await storage.getTenant(agent!.tenantId);
    // console.log("💕 agent", tenant);
    if (!agent) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      username: agent.username,
      agentId,
      tenantId,
      publicKey: tenant?.publicKey as string,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
