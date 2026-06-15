"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Coins, TrendingUp } from "lucide-react";

const LaeCoin = dynamic(() => import("@/components/three/LaeCoin"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <div className="h-28 w-28 animate-pulse-glow rounded-full bg-gold-400/25 blur-2xl" />
    </div>
  ),
});

export function CoinShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative mb-4 overflow-hidden p-4 sm:mb-5 sm:p-6 md:p-7"
    >
      {/* glow accents */}
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-gold-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-brand-500/15 blur-3xl" />

      <div className="relative grid items-center gap-5 sm:grid-cols-[1fr_auto] sm:gap-4">
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <span className="chip w-fit">
            <Coins className="h-3.5 w-3.5 text-gold-400" /> $LAE Token
          </span>

          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Your $LAE holdings
              </p>
              <p className="font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                48,250{" "}
                <span className="text-gradient-gold">LAE</span>
              </p>
              <p className="mt-1 text-sm text-slate-400">≈ $40,626.50</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5">
              <p className="text-xs text-slate-500">Price</p>
              <p className="font-mono text-lg font-semibold text-white">$0.842</p>
              <p className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <TrendingUp className="h-3 w-3" /> +18.4%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/deposit" className="btn-primary w-full justify-center !px-5 !py-2.5 sm:w-auto">
              Buy $LAE
            </Link>
            <Link
              href="/dashboard/slots"
              className="btn-ghost w-full justify-center !px-5 !py-2.5 sm:w-auto"
            >
              Stake <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* 3D coin — hidden on very small screens for performance */}
        <div className="relative mx-auto hidden h-40 w-40 shrink-0 min-[400px]:block sm:h-44 sm:w-44 md:h-52 md:w-52">
          <div className="absolute inset-0 rounded-full bg-gold-400/10 blur-2xl" />
          <LaeCoin radius={2.1} />
        </div>
      </div>
    </motion.div>
  );
}
