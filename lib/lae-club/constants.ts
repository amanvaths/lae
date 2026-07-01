/** LAE Club — LAEClubMatrix 12 levels × 14 spots (BTitan-style) */

export const LAE_MATRIX_SIZE = 14;
export const LAE_LAST_LEVEL = 12;

/** On-chain matrix does not mint LAE rewards (separate LAECoin contract). */
export const MATRIX_SUPPORTS_LAE_REWARDS = false;

export const MATRIX_SPOT_LABELS: Record<
  number,
  { label: string; sublabel: string; tone: "gold" | "silver" }
> = {
  1:  { label: "Upline 1",    sublabel: "Income",   tone: "gold" },
  2:  { label: "Upline 2",    sublabel: "Income",   tone: "gold" },
  3:  { label: "You",         sublabel: "Income",   tone: "silver" },
  4:  { label: "Treasury",    sublabel: "Slot 2",   tone: "gold" },
  5:  { label: "Treasury/Cycle", sublabel: "Slot 2", tone: "gold" },
  6:  { label: "You",         sublabel: "Income",   tone: "silver" },
  7:  { label: "Downline 1",  sublabel: "Income",   tone: "gold" },
  8:  { label: "You",         sublabel: "Income",   tone: "silver" },
  9:  { label: "You",         sublabel: "Income",   tone: "silver" },
  10: { label: "Downline 2",  sublabel: "Income",   tone: "gold" },
  11: { label: "You",         sublabel: "Income",   tone: "silver" },
  12: { label: "You",         sublabel: "Income",   tone: "silver" },
  13: { label: "Downline DL", sublabel: "Income",   tone: "gold" },
  14: { label: "Recycle",     sublabel: "Treasury", tone: "gold" },
};

export const SILVER_SPOTS = [3, 6, 8, 9, 11, 12] as const;
export const GOLD_SPOTS = [1, 2, 4, 5, 7, 10, 13, 14] as const;

export const ENTRY_PRICE_BTC = "0.001";

export const LAE_COIN_TOKENOMICS = {
  name: "LAE Coin",
  symbol: "LAE",
  totalSupply: 500_000,
  rewardPool: 400_000,
  residualSupply: 100_000,
  launchPrice: 0.1,
  decimals: 18,
  vestingMonths: 20,
  monthlyReleaseBps: 500,
} as const;

/** Royal rank NFT milestones (levels 3, 6, 9, 12). */
export const ROYAL_NFT_MILESTONES = [
  { rank: 1, level: 3, label: "Royal Rank 1" },
  { rank: 2, level: 6, label: "Royal Rank 2" },
  { rank: 3, level: 9, label: "Royal Rank 3" },
  { rank: 4, level: 12, label: "Royal Rank 4" },
] as const;
