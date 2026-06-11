"use client";

import { Network, Lock, Zap, TrendingUp } from "lucide-react";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { usePrefersReducedMotion } from "@/lib/useDeferredReady";

const features = [
  {
    num: "01",
    icon: Network,
    title: "Network-to-Earn",
    body: "Every connection pays you in $LAE automatically on every level of your referral tree.",
  },
  {
    num: "02",
    icon: Lock,
    title: "On-Chain Transparent",
    body: "No hidden back-office. Every reward and payout is a verifiable blockchain transaction.",
  },
  {
    num: "03",
    icon: Zap,
    title: "Instant Settlement",
    body: "Rewards land in your wallet the moment they're earned — no claims, no waiting.",
  },
  {
    num: "04",
    icon: TrendingUp,
    title: "Deflationary Design",
    body: "1.5% of every transaction is burned, tightening supply as activity grows.",
  },
];

export function Features() {
  const reduced = usePrefersReducedMotion();
  const Card = reduced ? "div" : TiltCard;

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,195,26,0.04),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(255,195,26,0.03),transparent_40%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
      <div className="container-edge relative">
        <Reveal className="mb-12 text-center">
          <span className="section-label">Features</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
            Built To <span className="text-shimmer">Last & Scale</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            LAE is engineered for production — transparent rewards, deflationary
            supply, and infrastructure that grows with the network.
          </p>
        </Reveal>

        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Reveal key={f.title}>
              <Card className={reduced ? "h-full" : "h-full [perspective:800px]"}>
                <div className="feature-box h-full">
                  <span className="pointer-events-none absolute right-5 top-5 font-display text-4xl font-bold text-white/[0.04]">
                    {f.num}
                  </span>
                  <div className="mb-5 grid h-14 w-14 place-items-center border border-brand-500/20 bg-brand-500/10 text-brand-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-500/20">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">{f.body}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
