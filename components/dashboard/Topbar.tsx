"use client";

import Link from "next/link";
import { Menu, Bell, Search, Bitcoin } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { wallet, user, btcToUsd } from "@/lib/dashboard-data";
import { Pill } from "./ui";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 min-h-14 items-center gap-2 border-b border-white/5 bg-ink-950/70 px-3 backdrop-blur-xl sm:h-16 sm:gap-3 sm:px-5 md:px-6">
      <button
        onClick={onMenuClick}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-white sm:h-10 sm:w-10 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative hidden min-w-0 max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          placeholder="Search slots, members, transactions…"
          className="w-full rounded-full border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-brand-500/50 focus:bg-white/[0.05]"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <Link
          href="/dashboard/wallet"
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs transition-colors hover:border-white/20 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm"
        >
          <Bitcoin className="h-3.5 w-3.5 shrink-0 text-gold-400 sm:h-4 sm:w-4" />
          <span className="max-w-[4.5rem] truncate font-mono font-semibold text-white sm:max-w-none">
            {wallet.available.toFixed(4)}
          </span>
          <span className="hidden text-xs text-slate-500 sm:inline">
            {btcToUsd(wallet.available)}
          </span>
        </Link>

        <Pill tone="gold" className="hidden sm:inline-flex">
          {user.rank}
        </Pill>

        <Link
          href="/dashboard/announcements"
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-slate-300 transition-colors hover:border-white/20 hover:text-white sm:h-10 sm:w-10"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-400 ring-2 ring-ink-950 sm:right-2.5 sm:top-2.5" />
        </Link>

        <div className="hidden sm:block">
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
