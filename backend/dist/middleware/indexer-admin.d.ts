import type { FastifyRequest, FastifyReply } from "fastify";
/** API key, admin wallet signature, or admin JWT — otherwise 403 */
export declare function requireIndexerAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void>;
//# sourceMappingURL=indexer-admin.d.ts.map