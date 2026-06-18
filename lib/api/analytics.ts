import { api } from "@/lib/api-client";

export interface AnalyticsDashboard {
  wallet: string;
  registered: boolean;
  sponsor: string | null;
  registeredAt: string | null;
  totalIncome: string;
  totalTokenRewards: string;
  totalWithdrawals: string;
  directReferrals: number;
  clubEvents: number;
  pilotEvents: number;
}

export interface IndexedIncome {
  id: string;
  recipientAddress: string;
  payerAddress: string | null;
  incomeType: number;
  matrixType: number;
  level: number;
  amount: string;
  blockNumber: string;
  txHash: string;
  logIndex: number;
  createdAt: string;
}

export interface IndexedTransaction {
  id: string;
  walletAddress: string;
  eventName: string;
  blockNumber: string;
  txHash: string;
  logIndex: number;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface LeaderboardRow {
  rank: number;
  wallet: string;
  totalIncome: string;
}

function q(wallet: string, extra?: Record<string, string | number>) {
  const params = new URLSearchParams({ wallet });
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      params.set(k, String(v));
    }
  }
  return `?${params.toString()}`;
}

export async function fetchAnalyticsDashboard(wallet: string) {
  return api.get<AnalyticsDashboard>(`/api/dashboard${q(wallet)}`, false);
}

export async function fetchAnalyticsIncome(wallet: string, limit = 100) {
  return api.get<IndexedIncome[]>(`/api/income${q(wallet, { limit })}`, false);
}

export async function fetchAnalyticsTransactions(wallet: string, limit = 100) {
  return api.get<IndexedTransaction[]>(`/api/transactions${q(wallet, { limit })}`, false);
}

export async function fetchAnalyticsReferrals(wallet: string) {
  return api.get<
    Array<{
      id: string;
      sponsorAddress: string;
      referralAddress: string;
      blockNumber: string;
      txHash: string;
    }>
  >(`/api/referrals${q(wallet)}`, false);
}

export async function fetchAnalyticsTeam(wallet: string) {
  return api.get<{
    wallet: string;
    directCount: number;
    registeredDirect: number;
    qualifiedClub: number;
    qualifiedPilot: number;
    direct: Array<{ referralAddress: string; blockNumber: string }>;
  }>(`/api/team${q(wallet)}`, false);
}

export async function fetchAnalyticsLeaderboard(limit = 50) {
  return api.get<LeaderboardRow[]>(`/api/leaderboard?limit=${limit}`, false);
}

export async function fetchAnalyticsSpins(wallet: string) {
  return api.get<
    Array<{
      tier: number;
      sltAmount: string;
      txHash: string;
      blockNumber: string;
    }>
  >(`/api/spins${q(wallet)}`, false);
}

export async function fetchAnalyticsStakes(wallet: string) {
  return api.get<
    Array<{
      stakeIndex: string;
      amount: string;
      lockEnd: string;
      released: boolean;
      eventName: string;
    }>
  >(`/api/stakes${q(wallet)}`, false);
}

export async function fetchIndexerStatus() {
  return api.get<{ state: unknown; eventCount: number; mode: string }>(
    "/api/indexer/status",
    false
  );
}
