import {
  LayoutDashboard,
  LayoutGrid,
  Gauge,
  RefreshCw,
  Users,
  UserPlus,
  Share2,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  ReceiptText,
  Sparkles,
  Lock,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon; badge?: string };
export type NavGroup = { title: string; items: NavItem[] };

const base = "/dashboard";

/** Sidebar — only routes backed by deployed LAE smart contracts. */
export const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: `${base}`, icon: LayoutDashboard }],
  },
  {
    title: "Matrices",
    items: [
      { label: "My Slots", href: `${base}/slots`, icon: LayoutGrid },
      { label: "Slot Engine", href: `${base}/slot-engine`, icon: Gauge },
      { label: "Recycle History", href: `${base}/recycle`, icon: RefreshCw },
    ],
  },
  {
    title: "Network",
    items: [
      { label: "My Team", href: `${base}/team`, icon: Users },
      { label: "Direct Referrals", href: `${base}/referrals`, icon: UserPlus },
      { label: "Referral Link", href: `${base}/share`, icon: Share2 },
    ],
  },
  {
    title: "Earnings",
    items: [{ label: "Income", href: `${base}/income`, icon: TrendingUp }],
  },
  {
    title: "Finance",
    items: [
      { label: "Deposit & Activate", href: `${base}/deposit`, icon: ArrowDownToLine },
      { label: "Withdraw", href: `${base}/withdraw`, icon: ArrowUpFromLine },
      { label: "Transactions", href: `${base}/transactions`, icon: ReceiptText },
    ],
  },
  {
    title: "Rewards",
    items: [
      { label: "Spin & Win", href: `${base}/spin`, icon: Sparkles },
      { label: "LAE Staking", href: `${base}/staking`, icon: Lock },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
