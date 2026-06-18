export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  wallet: {
    balance: ["wallet", "balance"] as const,
    ledger: (page?: number) => ["wallet", "ledger", page] as const,
  },
  club: {
    matrices: ["club", "matrices"] as const,
    packages: ["club", "packages"] as const,
    matrix: (id: string) => ["club", "matrix", id] as const,
  },
  pilot: {
    matrices: ["pilot", "matrices"] as const,
    packages: ["pilot", "packages"] as const,
  },
  referral: {
    tree: (depth?: number) => ["referral", "tree", depth] as const,
    direct: (page?: number) => ["referral", "direct", page] as const,
    teamSize: ["referral", "teamSize"] as const,
    sponsorChain: ["referral", "sponsorChain"] as const,
  },
  transactions: {
    packages: ["transactions", "packages"] as const,
    withdrawals: ["transactions", "withdrawals"] as const,
    deposits: ["transactions", "deposits"] as const,
  },
  dashboard: {
    cache: ["dashboard", "cache"] as const,
    leaderboard: ["dashboard", "leaderboard"] as const,
  },
  admin: {
    dashboard: ["admin", "dashboard"] as const,
    users: (page?: number) => ["admin", "users", page] as const,
    config: ["admin", "config"] as const,
    incomeReport: ["admin", "incomeReport"] as const,
    deposits: ["admin", "deposits"] as const,
    withdrawals: ["admin", "withdrawals"] as const,
  },
};

export const STALE_TIME = {
  short: 30_000,
  medium: 60_000,
  long: 300_000,
};

export const RETRY = 2;
