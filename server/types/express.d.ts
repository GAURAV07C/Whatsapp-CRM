import { Agent } from "../storage"; // optional, ya custom type

declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        agentId: number;
        tenantId: number;
        publicKey:string;
      };
    }
  }
}

export {};
