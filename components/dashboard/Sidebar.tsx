"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useWalletSession } from "@/providers/WalletSessionProvider";
import { LogOut, ChevronRight, Eye } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { navGroups } from "./nav";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/paths";
import { truncateAddress } from "@/lib/format";
import { motion } from "framer-motion";
import {
  clearDashboardViewUserId,
  useDashboardViewUserId,
  useIsDashboardViewMode,
  withDashboardHref,
} from "@/lib/lae-club/dashboard-view-context";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link href={href} onClick={onNavigate} className="block">
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
          active
            ? "bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent text-white shadow-[0_0_20px_rgba(212,175,55,0.08)]"
            : "text-slate-400 hover:bg-[#D4AF37]/[0.04] hover:text-white"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
        )}
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors duration-300",
            active ? "text-[#D4AF37]" : "text-slate-500 group-hover:text-[#D4AF37]/60"
          )}
        />
        <span className="truncate">{label}</span>
        {active && <ChevronRight className="ml-auto h-4 w-4 text-[#D4AF37]/70" />}
      </motion.div>
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { address } = useAccount();
  const { isReady, disconnectWallet } = useWalletSession();
  const viewUserId = useDashboardViewUserId();
  const isViewMode = useIsDashboardViewMode();
  const dashboardRoot = withBasePath("/dashboard");

  const isActive = (href: string) =>
    href === dashboardRoot || href === `${dashboardRoot}/`
      ? pathname === href || pathname === `${href}/`
      : pathname.startsWith(href);

  const display = isViewMode
    ? `User #${viewUserId}`
    : isReady && address
      ? truncateAddress(address, 6, 4)
      : "Not connected";
  const initial = isViewMode ? "V" : isReady && address ? address.slice(2, 3).toUpperCase() : "?";

  function exitView() {
    clearDashboardViewUserId();
    router.push(withBasePath("/login"));
    onNavigate?.();
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-[#D4AF37]/15 px-5">
        <Link href={withBasePath("/")} className="group flex items-center gap-2.5">
          <span className="transition-transform duration-300 ease-premium group-hover:scale-105">
            <BrandLogo size={36} />
          </span>
          <div className="leading-tight">
            <span className="block font-display text-base font-bold tracking-tight text-white">
              LAE
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-[#D4AF37]/80">
              Club
            </span>
          </div>
        </Link>
      </div>

      {/* Gold underline accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />

      {/* Navigation */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/50">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((it) => (
                <NavLink
                  key={it.href}
                  href={withDashboardHref(it.href, viewUserId)}
                  label={it.label}
                  icon={it.icon}
                  active={isActive(it.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="mb-2 border-t border-[#D4AF37]/10 pt-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/50">
            Account
          </p>
        </div>
      </nav>

      {/* Wallet card */}
      <div className="border-t border-[#D4AF37]/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-2xl border border-[#D4AF37]/15 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-3 shadow-[inset_0_1px_0_0_rgba(212,175,55,0.08)] backdrop-blur-sm">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f5d760] via-[#D4AF37] to-[#B8860B] text-sm font-bold text-black shadow-[0_2px_8px_-2px_rgba(212,175,55,0.5)]">
            {initial}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate font-mono text-sm font-semibold text-white">{display}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
              {isViewMode ? (
                <>
                  <Eye className="h-3 w-3 text-[#D4AF37]/70" />
                  Read-only view
                </>
              ) : (
                <>
                  <span className="relative inline-flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  BSC Testnet
                </>
              )}
            </p>
          </div>
        </div>
        {isViewMode ? (
          <button
            type="button"
            onClick={exitView}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-slate-400 transition-all duration-300 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Exit view
          </button>
        ) : (
          <button
            type="button"
            onClick={disconnectWallet}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-slate-400 transition-all duration-300 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Disconnect Wallet
          </button>
        )}
      </div>
    </div>
  );
}
