import {
  LayoutDashboard,
  LayoutGrid,
  Gauge,
  RefreshCw,
  Network,
  Workflow,
  Users,
  UserPlus,
  Shuffle,
  TrendingUp,
  Crown,
  Medal,
  Trophy,
  Gem,
  Droplets,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  ReceiptText,
  Share2,
  Megaphone,
  LifeBuoy,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon; badge?: string };
export type NavGroup = { title: string; items: NavItem[] };

const base = "/dashboard";

/** 20 primary menus (grouped) + 3 account utilities. Every entry has a page. */
export const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: `${base}`, icon: LayoutDashboard },
      { label: "My Slots", href: `${base}/slots`, icon: LayoutGrid },
      { label: "Slot Engine", href: `${base}/slot-engine`, icon: Gauge },
      { label: "Recycle History", href: `${base}/recycle`, icon: RefreshCw },
    ],
  },
  {
    title: "Network",
    items: [
      { label: "Co-Matrix", href: `${base}/matrix`, icon: Network },
      { label: "Genealogy", href: `${base}/genealogy`, icon: Workflow },
      { label: "My Team", href: `${base}/team`, icon: Users },
      { label: "Direct Referrals", href: `${base}/referrals`, icon: UserPlus },
      { label: "Spillover", href: `${base}/spillover`, icon: Shuffle },
    ],
  },
  {
    title: "Earnings",
    items: [
      { label: "Income", href: `${base}/income`, icon: TrendingUp },
      { label: "Royal Pool", href: `${base}/royal-pool`, icon: Crown },
      { label: "Ranks & Rewards", href: `${base}/ranks`, icon: Medal },
      { label: "Leaderboard", href: `${base}/leaderboard`, icon: Trophy },
    ],
  },
  {
    title: "Assets",
    items: [
      { label: "Welcome Pass NFT", href: `${base}/nft`, icon: Gem },
      { label: "NFT Liquidity", href: `${base}/liquidity`, icon: Droplets },
      { label: "Wallet", href: `${base}/wallet`, icon: Wallet },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Deposit & Activate", href: `${base}/deposit`, icon: ArrowDownToLine },
      { label: "Withdraw", href: `${base}/withdraw`, icon: ArrowUpFromLine },
      { label: "Transactions", href: `${base}/transactions`, icon: ReceiptText },
      { label: "Referral Link", href: `${base}/share`, icon: Share2 },
    ],
  },
];

export const utilityItems: NavItem[] = [
  { label: "Announcements", href: `${base}/announcements`, icon: Megaphone },
  { label: "Support", href: `${base}/support`, icon: LifeBuoy },
  { label: "Settings", href: `${base}/settings`, icon: Settings },
];

/** Flat list of every dashboard route — used by build-check + counts. */
export const allNavItems: NavItem[] = [
  ...navGroups.flatMap((g) => g.items),
  ...utilityItems,
];
