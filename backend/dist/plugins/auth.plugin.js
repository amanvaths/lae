import fp from "fastify-plugin";
import fjwt from "@fastify/jwt";
import { config } from "../config/index.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
async function authPlugin(app) {
    await app.register(fjwt, {
        secret: config.jwt.secret,
    });
    app.decorate("authenticate", async (request, reply) => {
        await authenticate(request, reply);
    });
    app.decorate("requireAdmin", async (request, reply) => {
        await requireAdmin(request, reply);
    });
}
export default fp(authPlugin);
//# sourceMappingURL=auth.plugin.js.map