import type { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "../utils/helpers.js";

export interface JwtPayload {
  userId: string;
  walletAddress: string;
  isAdmin: boolean;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
    isAdmin?: boolean;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const payload = await request.jwtVerify<JwtPayload>();
    request.userId = payload.userId;
    request.isAdmin = payload.isAdmin;
  } catch {
    reply.status(401).send({ error: "Unauthorized" });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await authenticate(request, reply);
  if (reply.sent) return;
  if (!request.isAdmin) {
    reply.status(403).send({ error: "Admin access required" });
  }
}

export function errorHandler(
  error: Error,
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
    });
    return;
  }

  console.error("[error]", error);
  reply.status(500).send({ error: "Internal server error" });
}
