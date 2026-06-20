"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Coins, TrendingUp } from "lucide-react";
import { useLaeCoinStats } from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { withBasePath } from "@/lib/paths";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function CoinShowcase() {
  const coin = useLaeCoinStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative mb-4 overflow-hidden p-4 sm:mb-5 sm:p-6 md:p-7"
    >
      <div className="flex items-center gap-4">
        <BrandLogo variant="coin" size={56} />
        <div>
          <h3 className="font-display text-lg font-bold text-white">LAE Coin</h3>
          <p className="text-xs text-slate-400">Reward token · BEP-20</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Coins className="h-3 w-3" /> Total Supply
          </div>
          <p className="mt-1 font-mono text-sm font-semibold text-white">
            {coin.totalSupply ? fmtEther(coin.totalSupply, 0) : "500,000"}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <TrendingUp className="h-3 w-3" /> Reward Pool
          </div>
          <p className="mt-1 font-mono text-sm font-semibold text-brand-300">
            400,000 LAE
          </p>
        </div>
        <div className="col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:col-span-1">
          <Link
            href={withBasePath("/p2p")}
            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
          >
            P2P Market <ArrowUpRight className="h-3 w-3" />
          </Link>
          <p className="mt-1 text-xs text-slate-500">Trade LAE rewards</p>
        </div>
      </div>
    </motion.div>
  );
}
