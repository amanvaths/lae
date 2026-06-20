"use client";

import { ArrowRight, Droplets, Lock, CalendarClock, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function BusinessModel() {
  return (
    <section className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeading
          eyebrow="Business Model"
          title={
            <>
              Where every{" "}
              <span className="text-gradient-gold">0.001 BTC</span> goes
            </>
          }
          description="A registration fee is split transparently between direct matrix rewards and long-term LAE token rewards."
        />

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* 90 % card */}
          <Reveal>
            <div className="glass relative overflow-hidden p-8">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500/[0.06] blur-2xl" />
              <span className="font-display text-5xl font-bold text-brand-400">
                90%
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold text-white">
                Matrix Distribution
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Routed directly to matrix participants through the 14-spot smart
                contract. Upline income, auto-upgrades, and recycle events — all
                settled instantly on-chain.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Instant BTC payouts to participants
              </div>
            </div>
          </Reveal>

          {/* 10 % card */}
          <Reveal delay={1}>
            <div className="glass relative overflow-hidden p-8">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/[0.06] blur-2xl" />
              <span className="font-display text-5xl font-bold text-blue-400">
                10%
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold text-white">
                Liquidity Pool → LAE Rewards
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Funds the LAE token reward pool. Tokens are locked for 20 months
                and released monthly — 5% per month — with direct qualification
                requirements.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Step icon={Droplets} text="Feeds liquidity pool" />
                <Step icon={Lock} text="LAE rewards locked 20 months" />
                <Step icon={CalendarClock} text="5% monthly release" />
                <Step icon={CheckCircle2} text="Direct qualification required" />
              </div>
            </div>
          </Reveal>
        </div>

        {/* flow arrow strip */}
        <Reveal delay={2}>
          <div className="mx-auto mt-8 flex max-w-4xl items-center justify-center gap-3 text-xs text-slate-500">
            <span className="rounded border border-white/10 bg-white/[0.03] px-3 py-1.5">
              Registration Fee
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-brand-500" />
            <span className="rounded border border-brand-500/20 bg-brand-500/5 px-3 py-1.5 text-brand-400">
              90% Matrix
            </span>
            <span className="text-slate-600">+</span>
            <span className="rounded border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-blue-400">
              10% Liquidity
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-brand-500" />
            <span className="rounded border border-white/10 bg-white/[0.03] px-3 py-1.5">
              LAE Rewards (Vested)
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Step({ icon: Icon, text }: { icon: typeof Droplets; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <Icon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
      {text}
    </div>
  );
}
