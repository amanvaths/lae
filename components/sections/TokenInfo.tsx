"use client";

import dynamic from "next/dynamic";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CoinFallback } from "@/components/three/CoinFallback";
import { LAE_COIN_TOKENOMICS } from "@/lib/lae-club/constants";

const LaeCoin = dynamic(() => import("@/components/three/LaeCoin"), { ssr: false });

const items = [
  {
    label: "Total Supply",
    value: LAE_COIN_TOKENOMICS.totalSupply.toLocaleString(),
    extra: "LAE",
  },
  {
    label: "Reward Pool",
    value: LAE_COIN_TOKENOMICS.rewardPool.toLocaleString(),
    extra: "80%",
  },
  {
    label: "Operations & Liquidity",
    value: LAE_COIN_TOKENOMICS.residualSupply.toLocaleString(),
    extra: "20%",
  },
  {
    label: "Vesting Release",
    value: `${LAE_COIN_TOKENOMICS.vestingMonths} Months`,
    extra: "5% / month",
  },
];

export function TokenInfo() {
  return (
    <section id="tokenomics" className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeading
          eyebrow="LAE Token"
          title={
            <>
              Reward-driven{" "}
              <span className="text-gradient-gold">economy</span>
            </>
          }
          description="LAE is a utility token earned through matrix participation — not speculation. Fixed supply, transparent vesting, community-first."
        />

        <div className="mx-auto mt-14 max-w-5xl grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="relative mx-auto aspect-square w-full max-w-sm">
              <div className="absolute inset-0 animate-pulse-glow rounded-full bg-brand-500/10 blur-3xl" />
              <div className="absolute inset-0 animate-spin-slow rounded-full border border-brand-500/25" />
              <div
                className="absolute inset-4 rounded-full border border-dashed border-brand-500/15"
                style={{ animation: "orbit 25s linear infinite reverse" }}
              />
              <LaeCoin className="absolute inset-0" />
            </div>
          </Reveal>

          <Reveal delay={1}>
            <div className="glass relative overflow-hidden p-8 sm:p-10">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-brand-500/[0.04] blur-3xl" />

              <div className="relative">
                <h3 className="font-display text-xl font-bold text-white">
                  LAE Coin
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  BNB Chain · BEP-20 · Fixed Supply
                </p>
              </div>

              <div className="relative mt-8 grid gap-4 sm:grid-cols-2">
                {items.map((item, i) => (
                  <Reveal key={item.label} delay={i + 1}>
                    <div className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                      <span className="text-[0.6rem] uppercase tracking-wider text-slate-600">
                        {item.label}
                      </span>
                      <span className="font-display text-lg font-bold text-white">
                        {item.value}
                      </span>
                      <span className="text-xs text-brand-400">
                        {item.extra}
                      </span>
                    </div>
                  </Reveal>
                ))}
              </div>

              <p className="relative mt-6 text-center text-xs text-slate-500">
                Reward-Driven Economy — not speculation. Tokens are earned
                through active matrix participation and released over 20 months.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
