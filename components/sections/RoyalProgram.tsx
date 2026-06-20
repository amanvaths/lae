"use client";

import { Crown } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TiltCard } from "@/components/ui/TiltCard";
import { cn } from "@/lib/utils";

const ranks = [
  {
    rank: 1,
    tier: "Bronze",
    level: 3,
    gradient: "from-amber-700/60 to-amber-900/30",
    border: "border-amber-600/30",
    glow: "shadow-[0_0_40px_rgba(180,83,9,0.1)]",
    accent: "text-amber-500",
    poolShare: "Royal Pool Tier 1",
  },
  {
    rank: 2,
    tier: "Silver",
    level: 6,
    gradient: "from-slate-400/40 to-slate-600/20",
    border: "border-slate-400/25",
    glow: "shadow-[0_0_40px_rgba(148,163,184,0.08)]",
    accent: "text-slate-300",
    poolShare: "Royal Pool Tier 2",
  },
  {
    rank: 3,
    tier: "Gold",
    level: 9,
    gradient: "from-brand-500/40 to-brand-700/20",
    border: "border-brand-500/30",
    glow: "shadow-[0_0_40px_rgba(255,195,26,0.12)]",
    accent: "text-brand-400",
    poolShare: "Royal Pool Tier 3",
  },
  {
    rank: 4,
    tier: "Diamond",
    level: 12,
    gradient: "from-cyan-400/30 to-blue-600/15",
    border: "border-cyan-400/25",
    glow: "shadow-[0_0_40px_rgba(34,211,238,0.1)]",
    accent: "text-cyan-400",
    poolShare: "Royal Pool Tier 4",
  },
];

export function RoyalProgram() {
  return (
    <section className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeading
          eyebrow="Royal Program"
          title={
            <>
              Earn your{" "}
              <span className="text-gradient-gold">Royal NFT</span>
            </>
          }
          description="Reach matrix level milestones to mint exclusive Royal Card NFTs. Each rank unlocks a share of the global Royal Pool."
        />

        <div className="mx-auto mt-16 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ranks.map((r, i) => (
            <Reveal key={r.rank} delay={i}>
              <TiltCard className="h-full">
                <div
                  className={cn(
                    "relative flex h-full flex-col items-center gap-4 overflow-hidden border bg-gradient-to-b p-6 text-center",
                    r.gradient,
                    r.border,
                    r.glow
                  )}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]" />
                  <div className="relative">
                    <Crown className={cn("h-10 w-10", r.accent)} />
                  </div>
                  <div className="relative">
                    <h3 className="font-display text-lg font-bold text-white">
                      Royal Rank {r.rank}
                    </h3>
                    <p className={cn("text-sm font-semibold", r.accent)}>
                      {r.tier}
                    </p>
                  </div>
                  <div className="relative flex flex-col gap-1.5 text-xs text-slate-400">
                    <span>
                      Required:{" "}
                      <span className="text-white">Level {r.level}</span>
                    </span>
                    <span>NFT Badge Minted</span>
                    <span className={r.accent}>{r.poolShare}</span>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
