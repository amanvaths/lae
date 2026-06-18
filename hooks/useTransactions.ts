import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPackagePrices,
  submitPurchase,
  submitWithdraw,
  fetchWithdrawals,
  fetchDeposits,
  fetchDashboardCache,
  fetchLeaderboard,
} from "@/lib/api/transactions";
import { queryKeys, STALE_TIME, RETRY } from "@/lib/api/query-keys";

export function usePackagePrices() {
  return useQuery({
    queryKey: queryKeys.transactions.packages,
    queryFn: fetchPackagePrices,
    staleTime: STALE_TIME.long,
    retry: RETRY,
  });
}

export function useWithdrawals() {
  return useQuery({
    queryKey: queryKeys.transactions.withdrawals,
    queryFn: fetchWithdrawals,
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}

export function useDeposits() {
  return useQuery({
    queryKey: queryKeys.transactions.deposits,
    queryFn: fetchDeposits,
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}

export function useDashboardCache() {
  return useQuery({
    queryKey: queryKeys.dashboard.cache,
    queryFn: fetchDashboardCache,
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.leaderboard,
    queryFn: () => fetchLeaderboard(),
    staleTime: STALE_TIME.medium,
    retry: RETRY,
  });
}

export function usePurchaseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitPurchase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.club.matrices });
      qc.invalidateQueries({ queryKey: queryKeys.pilot.matrices });
      qc.invalidateQueries({ queryKey: queryKeys.wallet.balance });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.cache });
    },
  });
}

export function useWithdrawMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => submitWithdraw(amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet.balance });
      qc.invalidateQueries({ queryKey: queryKeys.transactions.withdrawals });
    },
  });
}
