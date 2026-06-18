"use client";

import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { useWalletOnChain } from "@/lib/contracts/hooks";
import { fmtEther } from "@/lib/contracts/format";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const wallet = useWalletOnChain();

  return (
    <header className="sticky top-0 z-30 flex h-14 min-h-14 items-center gap-2 border-b border-white/5 bg-ink-950/70 px-3 backdrop-blur-xl sm:h-16 sm:gap-3 sm:px-5 md:px-6">
      <button
        onClick={onMenuClick}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-white sm:h-10 sm:w-10 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <Link
          href="/dashboard/wallet"
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs transition-colors hover:border-white/20 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm"
        >
          <span className="max-w-[5rem] truncate font-mono font-semibold text-white sm:max-w-none">
            {wallet.isLoading ? (
              "…"
            ) : (
              `${fmtEther(wallet.data?.daiInternal ?? 0n, 2)} mDAI`
            )}
          </span>
        </Link>

        <Link
          href="/dashboard/announcements"
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-slate-300 transition-colors hover:border-white/20 hover:text-white sm:h-10 sm:w-10"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
        </Link>

        <div className="shrink-0">
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
