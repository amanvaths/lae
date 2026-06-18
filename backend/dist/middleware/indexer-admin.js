import { verifyMessage } from "ethers";
import { config } from "../config/index.js";
const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;
function bearerToken(request) {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer "))
        return undefined;
    return header.slice("Bearer ".length).trim();
}
function isLikelyJwt(token) {
    return token.split(".").length === 3;
}
function verifyAdminWalletSignature(request) {
    const wallet = request.headers["x-admin-wallet"];
    const signature = request.headers["x-admin-signature"];
    const timestamp = request.headers["x-admin-timestamp"];
    if (typeof wallet !== "string" ||
        typeof signature !== "string" ||
        typeof timestamp !== "string") {
        return false;
    }
    const normalized = wallet.toLowerCase();
    if (!config.adminWallets.includes(normalized)) {
        return false;
    }
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > SIGNATURE_MAX_AGE_MS) {
        return false;
    }
    const message = `LAE indexer replay ${timestamp}`;
    try {
        const recovered = verifyMessage(message, signature).toLowerCase();
        return recovered === normalized;
    }
    catch {
        return false;
    }
}
/** API key, admin wallet signature, or admin JWT — otherwise 403 */
export async function requireIndexerAdmin(request, reply) {
    const apiKeyHeader = request.headers["x-api-key"];
    const configuredKey = process.env.INDEXER_ADMIN_API_KEY ?? "";
    if (configuredKey &&
        typeof apiKeyHeader === "string" &&
        apiKeyHeader === configuredKey) {
        return;
    }
    const bearer = bearerToken(request);
    if (configuredKey &&
        bearer &&
        !isLikelyJwt(bearer) &&
        bearer === configuredKey) {
        return;
    }
    if (verifyAdminWalletSignature(request)) {
        return;
    }
    if (bearer && isLikelyJwt(bearer)) {
        try {
            const payload = await request.jwtVerify();
            if (payload.isAdmin) {
                return;
            }
        }
        catch {
            /* fall through to 403 */
        }
    }
    reply.status(403).send({ error: "Forbidden" });
}
//# sourceMappingURL=indexer-admin.js.map