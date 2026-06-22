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

export type LaeAdminStats = {
  totalUsers: number;
  todayRegistrations: number;
  levelSales: Array<{ level: number; count: number; volume: string }>;
  royalPool: { totalPaid: string; eventCount: number };
  matrixIncome: { totalPaid: string; eventCount: number };
  placements: number;
  reinvests: number;
  staking: { totalStaked: string; stakeEvents: number; activeStakes: number };
  indexer: { lastBlock: string; chainId: number | null };
  chainEvents: number;
};

export function fetchLaeAdminStats() {
  return adminFetch<LaeAdminStats>("/stats");
}

export type LaeIndexedUser = {
  walletAddress: string;
  userId: number;
  sponsorId: number | null;
  teamSize: number;
  totalIncome: string;
  registeredAt: string;
};

export type LaeIndexedPlacement = {
  userId: number;
  referrerId: number;
  level: number;
  cycle: number;
  spot: number;
  txHash: string;
  blockNumber: string;
};

export type LaeIndexedIncome = {
  receiverUserId: number;
  fromUserId: number | null;
  level: number;
  amount: string;
  incomeKind: string;
  txHash: string;
};

export function fetchLaeAdminUsers(limit = 100, offset = 0) {
  return adminFetch<{ users: LaeIndexedUser[]; total: number }>(`/users?limit=${limit}&offset=${offset}`);
}

export function fetchLaeAdminIncome(kind?: string) {
  const q = kind ? `?kind=${kind}` : "";
  return adminFetch<{ incomes: LaeIndexedIncome[] }>(`/income${q}`);
}

export function fetchLaeAdminMatrix() {
  return adminFetch<{ placements: LaeIndexedPlacement[] }>("/matrix");
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
