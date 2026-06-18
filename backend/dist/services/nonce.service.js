import { randomBytes } from "node:crypto";
const NONCE_TTL_MS = 5 * 60 * 1000;
const store = new Map();
export function createNonce(walletAddress) {
    const normalized = walletAddress.toLowerCase();
    const nonce = randomBytes(16).toString("hex");
    store.set(normalized, { nonce, expiresAt: Date.now() + NONCE_TTL_MS });
    return nonce;
}
export function consumeNonce(walletAddress, nonce) {
    const normalized = walletAddress.toLowerCase();
    const entry = store.get(normalized);
    if (!entry)
        return false;
    if (Date.now() > entry.expiresAt) {
        store.delete(normalized);
        return false;
    }
    if (entry.nonce !== nonce)
        return false;
    store.delete(normalized);
    return true;
}
export function buildSignInMessage(walletAddress, nonce) {
    return [
        "Sign in to SENSO Limitless",
        `Wallet: ${walletAddress.toLowerCase()}`,
        `Nonce: ${nonce}`,
        `Issued: ${new Date().toISOString()}`,
    ].join("\n");
}
//# sourceMappingURL=nonce.service.js.map