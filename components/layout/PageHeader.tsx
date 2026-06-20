"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { withBasePath } from "@/lib/paths";

export function PageHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
      <nav className="flex w-full max-w-6xl items-center justify-between gap-2 rounded-full border border-white/10 bg-ink-900/70 px-3 py-2 backdrop-blur-xl sm:px-4 sm:py-2.5">
        <Link href={withBasePath("/")} className="flex min-w-0 items-center gap-2 pl-0.5 sm:gap-2.5 sm:pl-1">
          <BrandLogo size={32} className="sm:hidden" />
          <BrandLogo size={36} className="hidden sm:block" />
          <span className="font-display text-base font-bold tracking-tight text-white sm:text-lg">
            LAE
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
