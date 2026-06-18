import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fjwt from "@fastify/jwt";
import { config } from "../config/index.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

async function authPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fjwt, {
    secret: config.jwt.secret,
  });

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
  });

  app.decorate("requireAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAdmin(request, reply);
  });
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(authPlugin);
