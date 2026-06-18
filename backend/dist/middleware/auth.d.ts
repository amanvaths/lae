import type { FastifyRequest, FastifyReply } from "fastify";
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
export declare function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function errorHandler(error: Error, _request: FastifyRequest, reply: FastifyReply): void;
//# sourceMappingURL=auth.d.ts.map