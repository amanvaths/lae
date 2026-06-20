import type { QueryClient } from "@tanstack/react-query";
import { clearTokens } from "@/lib/api-client";
import { contractKeys } from "@/lib/contracts/query-keys";

const WALLET_STORAGE_KEYS = [
  "wagmi.store",
  "wagmi.recentConnectorId",
  "wagmi.wallet",
  "wagmi.connected",
  "rainbowkit.recentConnectorId",
  "rk-recent",
  "lae-session",
] as const;

/** Clear wagmi / RainbowKit persisted connection keys so reconnect does not auto-login. */
export function clearWalletStorage() {
  if (typeof window === "undefined") return;
  for (const key of WALLET_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    window.sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

/** Wipe wallet-linked client state (queries, tokens, cached reads, localStorage). */
export function clearWalletSession(qc: QueryClient) {
  clearTokens();
  qc.removeQueries({ queryKey: contractKeys.all });
  qc.removeQueries({ queryKey: ["analytics"] });
  qc.removeQueries({ queryKey: ["referral"] });
  qc.removeQueries({ queryKey: ["dashboard"] });
  qc.removeQueries({ queryKey: ["auth"] });
  qc.removeQueries({ queryKey: ["wallet"] });
  qc.removeQueries({ queryKey: ["lae-events"] });
  qc.clear();
  clearWalletStorage();
}
