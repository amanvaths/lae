import type { QueryClient } from "@tanstack/react-query";
import { clearTokens } from "@/lib/api-client";
import { contractKeys } from "@/lib/contracts/query-keys";

/** Wipe wallet-linked client state (queries, tokens, cached reads, localStorage). */
export function clearWalletSession(qc: QueryClient) {
  clearTokens();
  qc.removeQueries({ queryKey: contractKeys.all });
  qc.removeQueries({ queryKey: ["analytics"] });
  qc.removeQueries({ queryKey: ["referral"] });
  qc.removeQueries({ queryKey: ["dashboard"] });
  qc.removeQueries({ queryKey: ["auth"] });
  qc.removeQueries({ queryKey: ["wallet"] });
  qc.clear();

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem("lae-session");
      window.sessionStorage.clear();
    } catch {}
  }
}
