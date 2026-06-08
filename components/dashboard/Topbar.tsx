"use client";

import Link from "next/link";
import { Menu, Bell, Search, Bitcoin } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { wallet, user, btcToUsd } from "@/lib/dashboard-data";
import { Pill } from "./ui";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/5 bg-ink-950/70 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onMenuClick}
        className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          placeholder="Search slots, members, transactions…"
          className="w-full rounded-full border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-brand-500/50 focus:bg-white/[0.05]"
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <Link
          href="/dashboard/wallet"
          className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm transition-colors hover:border-white/20 sm:flex"
        >
          <Bitcoin className="h-4 w-4 text-gold-400" />
          <span className="font-mono font-semibold text-white">
            {wallet.available.toFixed(4)}
          </span>
          <span className="text-xs text-slate-500">{btcToUsd(wallet.available)}</span>
        </Link>

        <Pill tone="gold" className="hidden sm:inline-flex">
          {user.rank}
        </Pill>

        <Link
          href="/dashboard/announcements"
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-300 transition-colors hover:border-white/20 hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-400 ring-2 ring-ink-950" />
        </Link>

        <div className="hidden sm:block">
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
