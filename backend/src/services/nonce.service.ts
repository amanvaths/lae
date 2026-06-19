import { randomBytes } from "node:crypto";

const NONCE_TTL_MS = 5 * 60 * 1000;
const store = new Map<string, { nonce: string; expiresAt: number }>();

export function createNonce(walletAddress: string): string {
  const normalized = walletAddress.toLowerCase();
  const nonce = randomBytes(16).toString("hex");
  store.set(normalized, { nonce, expiresAt: Date.now() + NONCE_TTL_MS });
  return nonce;
}

export function consumeNonce(walletAddress: string, nonce: string): boolean {
  const normalized = walletAddress.toLowerCase();
  const entry = store.get(normalized);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(normalized);
    return false;
  }
  if (entry.nonce !== nonce) return false;
  store.delete(normalized);
  return true;
}

export function buildSignInMessage(walletAddress: string, nonce: string): string {
  return [
    "Sign in to LAE Protocol",
    `Wallet: ${walletAddress.toLowerCase()}`,
    `Nonce: ${nonce}`,
    `Issued: ${new Date().toISOString()}`,
  ].join("\n");
}
