import type { QueryClient } from "@tanstack/react-query";
import { clearTokens } from "@/lib/api-client";
import { contractKeys } from "@/lib/contracts/query-keys";

/** Wipe wallet-linked client state (queries, tokens, cached reads). */
export function clearWalletSession(qc: QueryClient) {
  clearTokens();
  qc.removeQueries({ queryKey: contractKeys.all });
  qc.removeQueries({ queryKey: ["analytics"] });
  qc.removeQueries({ queryKey: ["referral"] });
  qc.removeQueries({ queryKey: ["dashboard"] });
  qc.removeQueries({ queryKey: ["auth"] });
  qc.removeQueries({ queryKey: ["wallet"] });
  qc.clear();
}
