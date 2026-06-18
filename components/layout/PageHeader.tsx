"use client";

import Link from "next/link";
import { Hexagon, ArrowLeft } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { withBasePath } from "@/lib/paths";

export function PageHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav className="flex w-full max-w-6xl items-center justify-between rounded-full border border-white/10 bg-ink-900/70 px-4 py-2.5 backdrop-blur-xl">
        <Link href={withBasePath("/")} className="flex items-center gap-2.5 pl-1">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-600 shadow-glow">
            <Hexagon className="h-5 w-5 text-white" strokeWidth={2.4} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            LAE
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={withBasePath("/")}
            className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <ConnectWallet />
        </div>
      </nav>
    </header>
  );
}
