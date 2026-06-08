"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

const LaeCoin = dynamic(() => import("@/components/three/LaeCoin"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <div className="h-40 w-40 animate-pulse-glow rounded-full bg-gold-400/20 blur-3xl" />
    </div>
  ),
});

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-36 pb-20 sm:pt-44">
      {/* background grid + glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-lines bg-[size:64px_64px] [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute right-10 top-40 h-72 w-72 rounded-full bg-accent-500/10 blur-[100px]" />
      </div>

      <div className="container-edge grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left copy */}
        <div className="flex flex-col items-start gap-7">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="chip"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold-400" />
            Live on-chain · Audited contract
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease }}
            className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl xl:text-7xl"
          >
            Your network,
            <br />
            <span className="text-gradient">now an asset.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease }}
            className="max-w-xl text-lg leading-relaxed text-slate-400"
          >
            <span className="font-semibold text-slate-200">$LAE</span> turns the
            power of networking into a transparent, on-chain rewards economy.
            Build your network, earn instantly, and truly own your growth — no
            middlemen, no hidden ledgers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.28, ease }}
            className="flex flex-wrap items-center gap-3"
          >
            <a href="#cta" className="btn-primary">
              Get $LAE <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#network" className="btn-ghost">
              Explore the plan
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap items-center gap-x-7 gap-y-3 pt-2 text-sm text-slate-400"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-400" /> KYC + Audit
              verified
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-emerald-400" />
              12,480 holders online
            </span>
          </motion.div>
        </div>

        {/* Right 3D */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease }}
          className="relative mx-auto aspect-square w-full max-w-[560px]"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gold-400/20 via-brand-500/15 to-accent-500/20 blur-3xl" />
          <LaeCoin />
          {/* floating price card */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-2 top-10 glass px-4 py-3 sm:left-6"
          >
            <p className="text-xs text-slate-400">$LAE Price</p>
            <p className="font-mono text-lg font-semibold text-white">$0.842</p>
            <p className="text-xs font-medium text-emerald-400">+18.4% 24h</p>
          </motion.div>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-1 bottom-12 glass px-4 py-3 sm:right-4"
          >
            <p className="text-xs text-slate-400">Network rewards paid</p>
            <p className="font-mono text-lg font-semibold text-gradient-gold">
              $4.2M
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* marquee trust strip */}
      <div className="container-edge mt-16">
        <div className="glass overflow-hidden py-4">
          <div className="flex w-max animate-marquee items-center gap-12 px-6 text-sm font-medium uppercase tracking-widest text-slate-500">
            {[...Array(2)].map((_, k) => (
              <div key={k} className="flex items-center gap-12">
                <span>Ethereum</span>
                <span>·</span>
                <span>BNB Chain</span>
                <span>·</span>
                <span>Polygon</span>
                <span>·</span>
                <span>Arbitrum</span>
                <span>·</span>
                <span>CertiK Audited</span>
                <span>·</span>
                <span>Chainlink Oracles</span>
                <span>·</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
