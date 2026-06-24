"use client";

import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { useLaeUser } from "@/lib/lae-club/hooks";
import { withBasePath } from "@/lib/paths";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useLaeUser();

  return (
    <header className="sticky top-0 z-30 flex h-14 min-h-14 items-center gap-2 border-b border-[#D4AF37]/10 bg-[#050505]/80 px-3 backdrop-blur-xl sm:h-16 sm:gap-3 sm:px-5 md:px-6">
      <button
        onClick={onMenuClick}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#D4AF37]/15 text-white transition-colors hover:border-[#D4AF37]/30 sm:h-10 sm:w-10 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <Link
          href={withBasePath("/dashboard/income")}
          className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/[0.1] to-[#D4AF37]/[0.03] px-2.5 py-1.5 text-xs shadow-[inset_0_1px_0_0_rgba(212,175,55,0.1)] transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:from-[#D4AF37]/[0.16] sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm"
        >
          <span className="max-w-[5rem] truncate font-mono font-semibold text-[#D4AF37] sm:max-w-none">
            {user.isLoading ? "…" : user.registered ? `ID #${String(user.userId)}` : "—"}
          </span>
        </Link>

        <Link
          href={withBasePath("/dashboard/transactions")}
          className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.02] text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/[0.06] sm:h-10 sm:w-10"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 sm:h-[1.1rem] sm:w-[1.1rem]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
        </Link>

        <ConnectWallet />
      </div>
    </header>
  );
}
