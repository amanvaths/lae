"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { TokenomicsDonut, type Slice } from "@/components/charts/TokenomicsDonut";

const slices: Slice[] = [
  { label: "Network rewards", value: 40, color: "#1e9bff" },
  { label: "Staking & liquidity", value: 22, color: "#8b5cf6" },
  { label: "Treasury", value: 15, color: "#48bcff" },
  { label: "Team (vested)", value: 12, color: "#a78bfa" },
  { label: "Ecosystem fund", value: 8, color: "#f5c33b" },
  { label: "Public sale", value: 3, color: "#34d399" },
];

export function Tokenomics() {
  return (
    <section id="tokenomics" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/5 blur-[120px]" />
      <div className="container-edge">
        <SectionHeading
          eyebrow="Tokenomics"
          title={
            <>
              A supply engineered to{" "}
              <span className="text-gradient">reward the network</span>
            </>
          }
          description="1,000,000,000 $LAE, fixed forever. The largest allocation flows straight back to the people who grow the protocol."
        />

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="glass p-8">
              <TokenomicsDonut data={slices} />
            </div>
          </Reveal>

          <div className="flex flex-col gap-3">
            {slices.map((s, i) => (
              <Reveal key={s.label} delay={i}>
                <div className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 transition-colors hover:bg-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: s.color, boxShadow: `0 0 12px ${s.color}` }}
                    />
                    <span className="text-sm font-medium text-slate-200">
                      {s.label}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-white">
                    {s.value}%
                  </span>
                </div>
              </Reveal>
            ))}
            <Reveal delay={6}>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="glass px-5 py-4">
                  <p className="text-xs text-slate-400">Transaction burn</p>
                  <p className="font-display text-xl font-bold text-gradient-gold">
                    1.5%
                  </p>
                </div>
                <div className="glass px-5 py-4">
                  <p className="text-xs text-slate-400">Team vesting</p>
                  <p className="font-display text-xl font-bold text-white">
                    36 mo
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
