/** LAE Club Matrix — 12 levels · 14 spots (BTitan-style) */

export const LAE_LEVELS = 12;
export const LAE_MATRIX_SIZE = 14;

/** Spot layout: 2 + 4 + 8 = 14 */
export const MATRIX_SPOT_LABELS: Record<number, { label: string; tone: string }> = {
  1: { label: "Upline 1", tone: "blue" },
  2: { label: "Upline 2", tone: "blue" },
  3: { label: "Your Income", tone: "pink" },
  4: { label: "Royal Pool / Upgrade Hold", tone: "slate" },
  5: { label: "Auto Upgrade", tone: "gold" },
  6: { label: "Your Income", tone: "pink" },
  7: { label: "Downline 1 Spill", tone: "orange" },
  8: { label: "Your Income", tone: "pink" },
  9: { label: "Your Income", tone: "pink" },
  10: { label: "Downline 1 Spill", tone: "orange" },
  11: { label: "Your Income", tone: "pink" },
  12: { label: "Your Income", tone: "pink" },
  13: { label: "Downline 2 Spill", tone: "orange" },
  14: { label: "Recycle Sponsor", tone: "red" },
};

export const DEFAULT_LEVEL_PRICES_BTC = [
  "0.001",
  "0.002",
  "0.004",
  "0.008",
  "0.016",
  "0.032",
  "0.064",
  "0.128",
  "0.256",
  "0.512",
  "1.024",
  "2.048",
] as const;

export const LAE_COIN_TOKENOMICS = {
  name: "LAE Coin",
  symbol: "LAE",
  totalSupply: 500_000,
  rewardPool: 400_000,
  residualSupply: 100_000,
  communityReward: 400_000,
  liquidityPool: 100_000,
  launchPrice: 0.1,
  decimals: 18,
  vestingMonths: 20,
  monthlyReleaseBps: 500,
  matrixSplitBps: 9000,
  liquiditySplitBps: 1000,
} as const;

export const ROYAL_NFT_MILESTONES = [
  { rank: 1, level: 3, label: "Royal Rank 1" },
  { rank: 2, level: 6, label: "Royal Rank 2" },
  { rank: 3, level: 9, label: "Royal Rank 3" },
  { rank: 4, level: 12, label: "Royal Rank 4" },
] as const;
