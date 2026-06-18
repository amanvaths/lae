import { api } from "@/lib/api-client";
import type {
  PackagePrice,
  WithdrawalRequest,
  BlockchainTransaction,
} from "@/lib/api/types";

export async function fetchPackagePrices() {
  return api.get<{ club: PackagePrice[]; pilot: PackagePrice[] }>(
    "/api/transactions/packages",
    false
  );
}

export async function submitPurchase(payload: {
  packageLevel: number;
  matrixType: "CLUB" | "PILOT";
  txHash: string;
}) {
  return api.post<{ message: string; packageLevel: number; matrixType: string }>(
    "/api/transactions/purchase",
    payload
  );
}

export async function submitWithdraw(amount: number) {
  return api.post<{ withdrawalId: string; status: string }>(
    "/api/transactions/withdraw",
    { amount }
  );
}

export async function fetchWithdrawals() {
  return api.get<WithdrawalRequest[]>("/api/transactions/withdrawals");
}

export async function fetchDeposits() {
  return api.get<BlockchainTransaction[]>("/api/transactions/deposits");
}

export async function fetchDashboardCache() {
  return api.get<import("@/lib/api/types").DashboardCache>("/api/cache/dashboard");
}

export async function fetchLeaderboard(limit = 100) {
  return api.get<import("@/lib/api/types").LeaderboardResponse>(
    `/api/cache/leaderboard?limit=${limit}`,
    false
  );
}
