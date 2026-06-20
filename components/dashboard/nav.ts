import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  UserPlus,
  TrendingUp,
  Crown,
  Gift,
  ArrowLeftRight,
  ReceiptText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { withBasePath } from "@/lib/paths";

export type NavItem = { label: string; href: string; icon: LucideIcon; badge?: string };
export type NavGroup = { title: string; items: NavItem[] };

const base = withBasePath("/dashboard");

/** Sidebar — LAE Club matrix-first navigation */
export const navGroups: NavGroup[] = [
  {
    title: "Club",
    items: [
      { label: "Dashboard", href: base, icon: LayoutDashboard },
      { label: "Matrix", href: `${base}/matrix`, icon: LayoutGrid },
      { label: "Team", href: `${base}/team`, icon: Users },
      { label: "Referrals", href: `${base}/referrals`, icon: UserPlus },
      { label: "Income", href: `${base}/income`, icon: TrendingUp },
      { label: "Royal Pool", href: `${base}/royal-pool`, icon: Crown },
      { label: "Rewards", href: `${base}/rewards`, icon: Gift },
      { label: "P2P", href: withBasePath("/p2p"), icon: ArrowLeftRight },
      { label: "Transactions", href: `${base}/transactions`, icon: ReceiptText },
      { label: "Settings", href: `${base}/settings`, icon: Settings },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
