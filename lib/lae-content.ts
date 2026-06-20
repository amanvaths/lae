/** LAE Club homepage content — sourced from official deck */

export const LAE_VISION = {
  eyebrow: "Decentralized",
  title: "Vision",
  subtitle: "Building the world's strongest blockchain community",
  body: [
    "Our vision is to build one of the world's strongest blockchain communities where every participant contributes to ecosystem growth and benefits from transparent reward distribution.",
    "LAE Club aims to eliminate centralized control and create a self-sustaining ecosystem driven by smart contracts, community participation, and decentralized governance.",
  ],
};

export const LAE_TOKENOMICS = {
  totalSupply: 500_000,
  communityReward: { amount: 450_000, pct: 90, label: "Reward Pool (vesting)" },
  liquidityPool: { amount: 50_000, pct: 10, label: "Treasury · Liquidity · Operations" },
  launchPrice: 0.1,
  launchPriceLabel: "$0.10",
  ecosystemTarget: "Up To 1 BTC",
  chain: "BNB Chain · BEP-20",
};

export const LAE_DISTRIBUTION = {
  headline: "Community distribution",
  subtitle: "Every new registration contributes 0.001 BTC to the ecosystem.",
  registrationBtc: 0.001,
  splits: [
    {
      pct: 90,
      title: "Community reward mechanisms",
      desc: "Allocated toward transparent on-chain reward routing for active participants.",
    },
    {
      pct: 10,
      title: "Liquidity & ecosystem fund",
      desc: "Allocated toward liquidity depth and long-term ecosystem growth.",
    },
  ],
};

export const LAE_SMART_MATRIX = {
  eyebrow: "15 level smart matrix",
  title: "Fully automated matrix distribution",
  body: "The LAE Club ecosystem operates through a fully automated 15-level Smart Matrix with 14 spots per level. Each participant activates Level 1 through registration and progresses through higher levels based on matrix completion, auto-upgrade, and recycle events.",
  slots: 14,
  levels: 15,
};

export const LAE_COMMUNITY = {
  title: "The community that never stops growing",
  body: "Every member strengthens the matrix, every slot completion unlocks new potential, and every reward is settled on-chain — transparent, instant, and owned by you.",
};

export function fmtLae(n: number) {
  return n.toLocaleString("en-US");
}
