import type { FastifyInstance } from "fastify";
declare function authPlugin(app: FastifyInstance): Promise<void>;
declare module "fastify" {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}
declare const _default: typeof authPlugin;
export default _default;
//# sourceMappingURL=auth.plugin.d.ts.map