const ADMIN_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("lae_admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type AdminFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

async function adminFetch<T>(path: string): Promise<AdminFetchResult<T>> {
  try {
    const res = await fetch(`${ADMIN_API}/api/admin${path}`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      if (res.status === 401) {
        return { ok: false, error: "Session expired — sign in again", status: 401 };
      }
      return { ok: false, error: `Admin API error (${res.status})`, status: res.status };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Backend unavailable — is the API running?" };
  }
}

/** Matches backend getLaeAdminDashboardStats() exactly. */
export type LaeAdminStats = {
  totalUsers: number;
  todayRegistrations: number;
  positionSales: Array<{ position: number; count: number; volume: string }>;
  treasuryPool: { totalPaid: string; eventCount: number };
  matrixIncome: { totalPaid: string; eventCount: number };
  positions: number;
  recycles: number;
  staking: { totalStaked: string; stakeEvents: number; activeStakes: number };
  indexer: { lastBlock: string; chainId: number | null };
  chainEvents: number;
};

export function fetchLaeAdminStats() {
  return adminFetch<LaeAdminStats>("/stats");
}

/** Matches backend listLaeUsers(). */
export type LaeIndexedUser = {
  userId: number;
  walletAddress: string;
  sponsorId: number | null;
  currentCycle: number;
  highestSlot: number;
  directReferrals: number;
  totalEarned: string;
  totalCycles: number;
  registeredBlock: string;
  registeredAt: string;
  createdAt: string;
};

/** Matches backend listLaePlacements() (serialized MatrixCorePosition). */
export type LaeIndexedPlacement = {
  id: string;
  matrixOwnerId: number;
  level: number;
  cycleId: number;
  position: number;
  occupantId: number;
  blockNumber: string;
  txHash: string;
  logIndex: number;
  createdAt: string;
};

/** Matches backend listLaeIncome() (serialized MatrixCoreIncome). */
export type LaeIndexedIncome = {
  id: string;
  kind: string;
  fromUserId: number | null;
  toUserId: number | null;
  matrixOwnerId: number | null;
  boardLevel: number | null;
  level: number | null;
  cycleId: number | null;
  position: number | null;
  amount: string;
  blockNumber: string;
  txHash: string;
  logIndex: number;
  createdAt: string;
};

export function fetchLaeAdminUsers(limit = 100, offset = 0) {
  return adminFetch<{ users: LaeIndexedUser[]; total: number }>(`/users?limit=${limit}&offset=${offset}`);
}

export function fetchLaeAdminIncome(kind?: string, limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (kind) params.set("kind", kind);
  return adminFetch<{ incomes: LaeIndexedIncome[] }>(`/income?${params}`);
}

export function fetchLaeAdminMatrix(limit = 100) {
  return adminFetch<{ placements: LaeIndexedPlacement[] }>(`/matrix?limit=${limit}`);
}

export type LaeAdminAnalytics = {
  registrationsByDay: Array<{ day: string; count: number }>;
  incomeByKind: Array<{ kind: string; total: string; count: number }>;
  topEarners: Array<{
    userId: number;
    walletAddress: string;
    totalEarned: string;
    directReferrals: number;
  }>;
};

export function fetchLaeAdminAnalyticsTyped() {
  return adminFetch<LaeAdminAnalytics>("/analytics");
}

export type LaeAdminSettings = {
  contracts: Record<string, string>;
  indexer: {
    lastBlock: string;
    chainId: number | null;
    lastBlockHash: string | null;
    matrixDeployBlock: string;
    indexedUsers: number;
  };
  adminEmail: string;
};

export function fetchLaeAdminSettings() {
  return adminFetch<LaeAdminSettings>("/settings");
}

export type LaeRewardsAnalytics = {
  allocatedCount: number;
  claimedCount: number;
  sampleAllocatedTotal: string;
  sampleClaimedTotal: string;
  recentAllocated: Array<{
    txHash: string;
    blockNumber: string;
    walletAddress: string | null;
    payload: unknown;
  }>;
  recentClaimed: Array<{
    txHash: string;
    blockNumber: string;
    walletAddress: string | null;
    payload: unknown;
  }>;
};

export function fetchLaeAdminRewards(limit = 100) {
  return adminFetch<LaeRewardsAnalytics>(`/rewards?limit=${limit}`);
}

export function fetchLaeAdminAnalytics() {
  return adminFetch<unknown>("/analytics");
}

export function fetchLaeAdminStaking() {
  return adminFetch<unknown>("/staking");
}

export function triggerAdminIndexerSync(fromBlock?: string) {
  return adminPost<{ ok: boolean; indexedUsers: number; lastBlock: string; chainEvents: number }>(
    "/indexer/sync",
    fromBlock ? { fromBlock } : {}
  );
}

export function triggerAdminIndexerReset() {
  return adminPost<{
    ok: boolean;
    deleted: Record<string, number>;
    lastBlock: string;
    matrixDeployBlock: string;
  }>("/indexer/reset", {});
}

async function adminPost<T>(path: string, body: object): Promise<AdminFetchResult<T>> {
  try {
    const res = await fetch(`${ADMIN_API}/api/admin${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      if (res.status === 401) {
        return { ok: false, error: "Session expired — sign in again", status: 401 };
      }
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: err.message ?? `Admin API error (${res.status})`, status: res.status };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Backend unavailable — is the API running?" };
  }
}
