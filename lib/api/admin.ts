import { api } from "@/lib/api-client";

export async function fetchAdminDashboard() {
  return api.get<{
    users: number;
    deposits: number;
    withdrawals: number;
    clubMatrices: number;
    pilotMatrices: number;
  }>("/api/admin/dashboard");
}

export async function fetchAdminUsers(page = 1) {
  return api.get<{ users: unknown[]; total: number; page: number; limit: number }>(
    `/api/admin/users?page=${page}`
  );
}

export async function fetchAdminConfig() {
  return api.get<{
    sponsorPayment: { enabled: boolean; clubPercent: number; pilotPercent: number };
    tokenReward: { mode: string };
    pilotIncentive: { enabled: boolean; recipient: string };
  }>("/api/admin/config");
}

export async function fetchAdminIncomeReport() {
  return api.get<{ byType: Array<{ type: string; _sum: { amount: number }; _count: number }> }>(
    "/api/admin/income-report"
  );
}

export async function updateSponsorPaymentConfig(config: {
  enabled: boolean;
  clubPercent: number;
  pilotPercent: number;
}) {
  return api.patch("/api/admin/config/sponsor-payment", config);
}

export async function updateTokenRewardConfig(config: Record<string, unknown>) {
  return api.patch("/api/admin/config/token-reward", config);
}

export async function updatePilotIncentiveConfig(config: Record<string, unknown>) {
  return api.patch("/api/admin/config/pilot-incentive", config);
}

export async function fetchAdminDeposits() {
  return api.get<unknown[]>("/api/admin/deposits");
}

export async function fetchAdminWithdrawals() {
  return api.get<unknown[]>("/api/admin/withdrawals");
}

export async function suspendUser(userId: string, status: "ACTIVE" | "SUSPENDED") {
  return api.patch(`/api/admin/users/${userId}/status`, { status });
}
