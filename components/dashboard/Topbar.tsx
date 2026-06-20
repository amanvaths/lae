"use client";

import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { useLaeUser } from "@/lib/lae-club/hooks";
import { withBasePath } from "@/lib/paths";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useLaeUser();

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
          href={withBasePath("/dashboard/income")}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs transition-colors hover:border-white/20 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm"
        >
          <span className="max-w-[5rem] truncate font-mono font-semibold text-white sm:max-w-none">
            {user.isLoading ? "…" : user.registered ? `ID #${String(user.userId)}` : "—"}
          </span>
        </Link>

        <Link
          href={withBasePath("/dashboard/transactions")}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white transition-colors hover:border-white/20 sm:h-10 sm:w-10"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 sm:h-[1.1rem] sm:w-[1.1rem]" />
        </Link>

        <ConnectWallet />
      </div>
    </header>
  );
}
