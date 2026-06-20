"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Coins, Crown, Lock } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { withBasePath } from "@/lib/paths";
import { LAE_COIN_TOKENOMICS, ROYAL_NFT_MILESTONES } from "@/lib/lae-club/constants";
import { useLaeCoinStats } from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";

export default function CoinLandingPage() {
  const stats = useLaeCoinStats();

  return (
    <main className="min-h-screen bg-ink-950 text-white">
      <header className="border-b border-white/5 bg-ink-950/80 backdrop-blur">
        <div className="container-edge flex items-center justify-between py-4">
          <Link href={withBasePath("/")} className="flex items-center gap-2">
            <BrandLogo variant="coin" size={44} />
            <span className="font-display text-lg font-bold">LAE Coin</span>
          </Link>
          <div className="flex gap-2">
            <Link href={withBasePath("/login")} className="btn-ghost !px-4 !py-2 !text-xs">
              Login
            </Link>
            <Link href={withBasePath("/register")} className="btn-primary !px-4 !py-2 !text-xs">
              Register
            </Link>
          </div>
        </div>
      </header>

      <section className="container-edge grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}>
          <span className="chip mb-4">BEP-20 · BNB Chain</span>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            LAE Coin
            <br />
            <span className="text-shimmer">Community Reward Token</span>
          </h1>
          <p className="mt-4 max-w-lg text-slate-400">
            The foundation of the LAE Club ecosystem. Stake, earn, and participate in
            decentralized governance — all on-chain.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={withBasePath("/dashboard")} className="btn-primary group">
              Enter Dashboard
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1" />
            </Link>
            <Link href={withBasePath("/")} className="btn-ghost">
              LAE Club Home
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center"
        >
          <BrandLogo variant="coin" size={320} className="!rounded-full drop-shadow-[0_0_80px_rgba(255,195,26,0.25)]" />
        </motion.div>
      </section>

      <section className="border-t border-white/5 bg-ink-900/50 py-16">
        <div className="container-edge">
          <h2 className="font-display text-2xl font-bold text-brand-300">Tokenomics</h2>
          <p className="mt-1 text-sm text-slate-400">Live on-chain supply data</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total Supply",
                value: stats.maxSupply ? fmtEther(stats.maxSupply) : String(LAE_COIN_TOKENOMICS.totalSupply),
              },
              {
                label: "Circulating",
                value: stats.circulating ? fmtEther(stats.circulating) : stats.totalSupply ? fmtEther(stats.totalSupply) : "—",
              },
              {
                label: "Burned",
                value: stats.totalBurned ? fmtEther(stats.totalBurned) : "0",
              },
              {
                label: "Launch Price",
                value: `$${LAE_COIN_TOKENOMICS.launchPrice}`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-brand-500/20 bg-white/[0.03] p-5"
              >
                <p className="text-xs uppercase tracking-widest text-slate-500">{item.label}</p>
                <p className="mt-2 font-mono text-2xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Shield, label: "Treasury Wallet", addr: stats.treasuryWallet },
              { icon: Coins, label: "Matrix (Reward Pool)", addr: stats.matrixContract },
              { icon: Lock, label: "Liquidity Wallet", addr: stats.liquidityWallet },
            ].map(({ icon: Icon, label, addr }) => (
              <div key={label} className="rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-2 text-brand-300">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="mt-2 break-all font-mono text-xs text-slate-400">
                  {addr ?? "Set after deploy"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-edge py-16">
        <h2 className="font-display text-2xl font-bold">
          <Crown className="mr-2 inline h-6 w-6 text-brand-400" />
          Royal Rank NFTs
        </h2>
        <p className="mt-1 text-sm text-slate-400">Auto-minted at matrix milestones</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROYAL_NFT_MILESTONES.map((n) => (
            <div
              key={n.rank}
              className="rounded-xl border border-brand-500/20 bg-gradient-to-b from-brand-500/10 to-transparent p-5"
            >
              <p className="text-xs text-brand-300">Rank {n.rank}</p>
              <p className="mt-1 font-display text-lg font-bold">{n.label}</p>
              <p className="mt-2 text-sm text-slate-400">Unlock at Level {n.level}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <Link href={withBasePath("/")} className="text-brand-300 hover:text-brand-200">
          ← Back to LAE Club
        </Link>
      </footer>
    </main>
  );
}
