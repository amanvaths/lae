import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Footer } from "@/components/sections/Footer";
import { P2PMarket } from "@/components/p2p/P2PMarket";
import { Reveal } from "@/components/ui/Reveal";
import {
  ShieldCheck,
  Lock,
  Scale,
  Globe2,
  Zap,
  Users,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "P2P Marketplace — LAE Protocol",
  description:
    "Buy and sell $LAE peer-to-peer with on-chain smart-contract escrow. Non-custodial, global, zero spread — a decentralized P2P exchange for the LAE network.",
};

const stats = [
  { label: "24h P2P volume", value: "$8.4M" },
  { label: "Traders online", value: "3,920" },
  { label: "Avg. release time", value: "4.6 min" },
  { label: "Completion rate", value: "99.4%" },
];

const escrow = [
  {
    icon: Lock,
    title: "1 · Locked in escrow",
    body: "The seller's $LAE is locked in an audited escrow contract the moment an order opens. No custodian ever holds it.",
  },
  {
    icon: Zap,
    title: "2 · Pay off-chain",
    body: "You pay the seller through the agreed method — bank, Wise, UPI, on-chain — then mark the order as paid.",
  },
  {
    icon: ShieldCheck,
    title: "3 · Auto-release",
    body: "On confirmation, the contract releases $LAE straight to your wallet. Instant, trustless settlement.",
  },
  {
    icon: Scale,
    title: "4 · DAO arbitration",
    body: "If anything is disputed, staked community arbitrators review on-chain evidence and rule — no central support desk.",
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Non-custodial by design",
    body: "Your keys, your coins. LAE never touches your funds — escrow lives entirely in smart contracts.",
  },
  {
    icon: Globe2,
    title: "Global liquidity",
    body: "5 fiat currencies, 7+ payment rails and thousands of verified merchants across every timezone.",
  },
  {
    icon: Users,
    title: "Reputation on-chain",
    body: "Every order, rating and dispute is recorded on-chain — merchant trust you can actually verify.",
  },
];

export default function P2PPage() {
  return (
    <main className="relative min-h-screen">
      <PageHeader />

      {/* Hero band */}
      <section className="relative overflow-hidden px-5 pt-32 pb-10 sm:px-8 sm:pt-36">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px]" />
          <div className="absolute inset-0 bg-grid-lines bg-[size:64px_64px] [mask-image:radial-gradient(70%_45%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="mx-auto max-w-7xl">
          <Reveal>
            <span className="chip">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Decentralized · on-chain escrow · non-custodial
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
              The peer-to-peer market for{" "}
              <span className="text-gradient">$LAE</span>
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-4 max-w-2xl text-lg text-slate-400">
              Trade $LAE directly with people worldwide — your price, your
              payment method. Every order is protected by smart-contract escrow,
              so no one can run off with your money. Binance-grade experience,
              fully decentralized.
            </p>
          </Reveal>

          {/* Stats */}
          <Reveal delay={3}>
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-ink-900/60 px-5 py-4 text-center"
                >
                  <p className="font-display text-2xl font-bold text-white">
                    {s.value}
                  </p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Market */}
      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <P2PMarket />
          </Reveal>

          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5" />
            All trades are escrowed by the LAE settlement contract. Prices are
            set by independent merchants — do your own due diligence.
          </p>
        </div>
      </section>

      {/* How escrow works */}
      <section className="border-t border-white/5 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              How decentralized escrow works
            </h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              No back-office, no custodian, no &quot;trust us&quot;. The contract
              is the middleman — and it&apos;s auditable by anyone.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {escrow.map((s, i) => (
              <Reveal key={s.title} delay={i}>
                <div className="glass glass-hover h-full p-6">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-300">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-display text-base font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust features */}
      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i}>
                <div className="glass h-full p-6">
                  <f.icon className="mb-4 h-6 w-6 text-brand-300" />
                  <h3 className="mb-2 font-display text-lg font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Merchant CTA */}
          <Reveal>
            <div className="glass mt-6 flex flex-col items-start justify-between gap-5 p-8 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  Become a verified merchant
                </h3>
                <p className="mt-1 max-w-xl text-sm text-slate-400">
                  Post your own buy/sell ads, set your spread and earn on every
                  trade. Stake $LAE to unlock the PRO merchant badge.
                </p>
              </div>
              <a href="#" className="btn-primary shrink-0">
                Apply to list ads <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
