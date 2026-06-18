"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  fetchAnalyticsDashboard,
  fetchAnalyticsIncome,
  fetchAnalyticsTransactions,
  fetchAnalyticsReferrals,
  fetchAnalyticsTeam,
  fetchAnalyticsLeaderboard,
} from "@/lib/api/analytics";

const enabled = (address?: string) => !!address;

export function useAnalyticsDashboard() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["analytics", "dashboard", address],
    queryFn: () => fetchAnalyticsDashboard(address!),
    enabled: enabled(address),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useAnalyticsIncome() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["analytics", "income", address],
    queryFn: () => fetchAnalyticsIncome(address!),
    enabled: enabled(address),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useAnalyticsTransactions() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["analytics", "transactions", address],
    queryFn: () => fetchAnalyticsTransactions(address!),
    enabled: enabled(address),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useAnalyticsReferrals() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["analytics", "referrals", address],
    queryFn: () => fetchAnalyticsReferrals(address!),
    enabled: enabled(address),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useAnalyticsTeam() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["analytics", "team", address],
    queryFn: () => fetchAnalyticsTeam(address!),
    enabled: enabled(address),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useAnalyticsLeaderboard(limit = 50) {
  return useQuery({
    queryKey: ["analytics", "leaderboard", limit],
    queryFn: () => fetchAnalyticsLeaderboard(limit),
    staleTime: 30_000,
    retry: 1,
  });
}
