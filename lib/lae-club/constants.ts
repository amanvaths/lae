/** LAE Club Matrix — 15 levels · 14 spots */

export const LAE_LEVELS = 15;
export const LAE_MATRIX_SIZE = 14;

/**
 * Spot layout: 2 + 4 + 8 = 14 (Silver & Gold Matrix)
 *
 * Silver = YOUR INCOME positions: 3, 6, 8, 9, 11, 12
 * Gold   = FLOW & SYSTEM positions: 1, 2, 4, 5, 7, 10, 13, 14
 */
export const MATRIX_SPOT_LABELS: Record<
  number,
  { label: string; sublabel: string; tone: "gold" | "silver" }
> = {
  1:  { label: "Upline 1",          sublabel: "Income",           tone: "gold" },
  2:  { label: "Upline 2",          sublabel: "Income",           tone: "gold" },
  3:  { label: "Your",              sublabel: "Income",           tone: "silver" },
  4:  { label: "Next",              sublabel: "Slot",             tone: "gold" },
  5:  { label: "Next",              sublabel: "Slot",             tone: "gold" },
  6:  { label: "Your",              sublabel: "Income",           tone: "silver" },
  7:  { label: "Downline 1",        sublabel: "Income",           tone: "gold" },
  8:  { label: "Your",              sublabel: "Income",           tone: "silver" },
  9:  { label: "Your",              sublabel: "Income",           tone: "silver" },
  10: { label: "Downline 1",        sublabel: "Income",           tone: "gold" },
  11: { label: "Your",              sublabel: "Income",           tone: "silver" },
  12: { label: "Your",              sublabel: "Income",           tone: "silver" },
  13: { label: "Downline 2",        sublabel: "Income",           tone: "gold" },
  14: { label: "Recycle",           sublabel: "Sponsor",          tone: "gold" },
};

export const SILVER_SPOTS = [3, 6, 8, 9, 11, 12] as const;
export const GOLD_SPOTS = [1, 2, 4, 5, 7, 10, 13, 14] as const;

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
  "4.096",
  "8.192",
  "16.384",
] as const;

export const LAE_COIN_TOKENOMICS = {
  name: "LAE Coin",
  symbol: "LAE",
  totalSupply: 500_000,
  rewardPool: 450_000,
  residualSupply: 50_000,
  communityReward: 450_000,
  liquidityPool: 50_000,
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
