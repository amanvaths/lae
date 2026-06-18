import { AppError } from "../utils/helpers.js";
export async function authenticate(request, reply) {
    try {
        const payload = await request.jwtVerify();
        request.userId = payload.userId;
        request.isAdmin = payload.isAdmin;
    }
    catch {
        reply.status(401).send({ error: "Unauthorized" });
    }
}
export async function requireAdmin(request, reply) {
    await authenticate(request, reply);
    if (reply.sent)
        return;
    if (!request.isAdmin) {
        reply.status(403).send({ error: "Admin access required" });
    }
}
export function errorHandler(error, _request, reply) {
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
//# sourceMappingURL=auth.js.map