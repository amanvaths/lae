import { api } from "@/lib/api-client";
import type { AuthTokens, UserProfile } from "@/lib/api/types";

export async function fetchNonce(walletAddress: string) {
  return api.get<{ nonce: string; walletAddress: string }>(
    `/api/auth/nonce?walletAddress=${encodeURIComponent(walletAddress)}`,
    false
  );
}

export async function loginWithSignature(payload: {
  walletAddress: string;
  signature: string;
  nonce: string;
}) {
  return api.post<AuthTokens>("/api/auth/login", payload, false);
}

export async function registerWithSignature(payload: {
  walletAddress: string;
  referralCode: string;
  signature: string;
  nonce: string;
  username?: string;
}) {
  return api.post<AuthTokens>("/api/auth/register", payload, false);
}

export async function fetchMe() {
  return api.get<UserProfile>("/api/auth/me");
}

export async function logoutApi() {
  return api.post<{ success: boolean }>("/api/auth/logout");
}
