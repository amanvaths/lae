import type { LucideIcon } from "lucide-react";
import {
  Bitcoin,
  CalendarCheck,
  CalendarClock,
  Crown,
  Gem,
  Grid3x3,
  Infinity as InfinityIcon,
  Layers,
  ShieldCheck,
  TrendingUp,
  Trophy,
  User,
  Users,
  Wallet,
} from "lucide-react";

export type ClubPhase = {
  num: number;
  name: string;
  phase: number;
  tagline: string;
  icon: LucideIcon;
  entryFee: string;
  matrix: string;
  slots: string;
  duration: string;
  earning: string;
  guaranteeMonths: number;
  unlock: string;
  milestoneMonths: number;
};

export const CLUBS: ClubPhase[] = [
  {
    num: 1,
    name: "LAE Club",
    phase: 1,
    tagline: "Start Your Journey",
    icon: Users,
    entryFee: "0.001 BTC",
    matrix: "14 Box Matrix",
    slots: "15 Slots",
    duration: "20 Months",
    earning: "Min. 5 BTC",
    guaranteeMonths: 20,
    unlock: "After 20 Months in LAE Club, Royal Club will be unlocked.",
    milestoneMonths: 20,
  },
  {
    num: 2,
    name: "Royal Club",
    phase: 2,
    tagline: "Grow Your Network",
    icon: Crown,
    entryFee: "0.1 BTC",
    matrix: "14 Box Matrix",
    slots: "10 Slots",
    duration: "10 Months",
    earning: "Min. 50 BTC",
    guaranteeMonths: 10,
    unlock: "After 10 Months in Royal Club, High Rich Club will be unlocked.",
    milestoneMonths: 10,
  },
  {
    num: 3,
    name: "High Rich Club",
    phase: 3,
    tagline: "Achieve Financial Freedom",
    icon: Gem,
    entryFee: "1 BTC",
    matrix: "14 Box Matrix",
    slots: "5 Slots",
    duration: "5 Months",
    earning: "Min. 500 BTC",
    guaranteeMonths: 5,
    unlock: "",
    milestoneMonths: 5,
  },
];

export const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Performance Based Ecosystem",
    desc: "Rewards follow real activity",
  },
  {
    icon: InfinityIcon,
    title: "Clubs Never Close",
    desc: "You can start & grow at your pace",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Transparent",
    desc: "Decentralized ecosystem on blockchain",
  },
  {
    icon: Bitcoin,
    title: "Powered by BTC (BEP-20)",
    desc: "Safe, secure & transparent",
  },
] as const;

export const DETAIL_ICONS = {
  entry: Wallet,
  matrix: Grid3x3,
  slots: Layers,
  duration: CalendarClock,
  earning: TrendingUp,
  guarantee: CalendarCheck,
} as const;

export const END_COPY =
  "Complete the journey. Unlock financial freedom & unlimited growth with LAE Club ecosystem.";

export const START_LABEL = "Start Here";
export const START_ICON = User;
export const END_ICON = TrendingUp;
export const TROPHY_ICON = Trophy;
