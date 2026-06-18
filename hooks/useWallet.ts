import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWalletBalance, fetchWalletLedger } from "@/lib/api/wallet";
import { queryKeys, STALE_TIME, RETRY } from "@/lib/api/query-keys";

export function useWalletBalance() {
  return useQuery({
    queryKey: queryKeys.wallet.balance,
    queryFn: fetchWalletBalance,
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}

export function useWalletLedger(page = 1, limit = 50) {
  return useQuery({
    queryKey: queryKeys.wallet.ledger(page),
    queryFn: () => fetchWalletLedger(page, limit),
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}

export function useInvalidateWallet() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.wallet.balance });
    qc.invalidateQueries({ queryKey: ["wallet", "ledger"] });
  };
}
