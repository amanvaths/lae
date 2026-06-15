"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { TokenomicsDonut, type Slice } from "@/components/charts/TokenomicsDonut";
import { TokenSupplyGraphic } from "@/components/ui/TokenSupplyGraphic";
import { LAE_TOKENOMICS, fmtLae } from "@/lib/lae-content";

const { communityReward, liquidityPool } = LAE_TOKENOMICS;

const slices: Slice[] = [
  { label: communityReward.label, value: communityReward.pct, color: "#ffc31a" },
  { label: liquidityPool.label, value: liquidityPool.pct, color: "#ffd54f" },
];

const metrics = [
  {
    label: "Total supply",
    value: `${fmtLae(LAE_TOKENOMICS.totalSupply)} LAE`,
  },
  {
    label: "Community rewards",
    value: `${fmtLae(communityReward.amount)} LAE`,
    sub: `${communityReward.pct}%`,
  },
  {
    label: "Liquidity pool",
    value: `${fmtLae(liquidityPool.amount)} LAE`,
    sub: `${liquidityPool.pct}%`,
  },
  {
    label: "Launch price",
    value: LAE_TOKENOMICS.launchPriceLabel,
  },
  {
    label: "Future ecosystem target",
    value: LAE_TOKENOMICS.ecosystemTarget,
  },
];

export function Tokenomics() {
  return (
    <section id="tokenomics" className="relative scroll-mt-28 py-20 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/5 blur-[120px]" />
      <div className="container-edge">
        <SectionHeading
          eyebrow="Tokenomics"
          title={
            <>
              LAE token{" "}
              <span className="text-gradient-gold">supply structure</span>
            </>
          }
          description={`${fmtLae(LAE_TOKENOMICS.totalSupply)} $LAE fixed supply on ${LAE_TOKENOMICS.chain}. Community-first allocation with transparent on-chain distribution.`}
        />

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal>
            <div className="glass space-y-6 p-5 sm:space-y-8 sm:p-8">
              <TokenomicsDonut data={slices} />
              <div className="border-t border-white/5 pt-6 sm:pt-8">
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Allocation breakdown
                </p>
                <TokenSupplyGraphic />
              </div>
            </div>
          </Reveal>

          <div className="flex flex-col gap-3">
            {metrics.map((m, i) => (
              <Reveal key={m.label} delay={i}>
                <div className="flex items-center justify-between gap-4 border border-white/5 bg-white/[0.02] px-4 py-4 transition-colors hover:bg-white/[0.04] sm:px-5">
                  <span className="text-sm font-medium text-slate-300">{m.label}</span>
                  <div className="text-right">
                    <span className="font-mono text-sm font-semibold text-white sm:text-base">
                      {m.value}
                    </span>
                    {m.sub && (
                      <span className="ml-2 text-xs text-brand-400">{m.sub}</span>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}

          </div>
        </div>
      </div>
    </section>
  );
}
