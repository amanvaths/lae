"use client";

import { Medal, Check, Lock } from "lucide-react";
import { PageHeading, Panel, Pill, Progress } from "@/components/dashboard/ui";
import { ranks, user, slots } from "@/lib/dashboard-data";

const tierColors: Record<string, string> = {
  Rising: "from-amber-500/30 to-amber-700/10 text-amber-300",
  Prime: "from-fuchsia-500/30 to-fuchsia-700/10 text-fuchsia-300",
  Royal: "from-brand-500/30 to-brand-700/10 text-brand-300",
  Legendary: "from-accent-500/30 to-accent-700/10 text-accent-300",
};

export default function RanksPage() {
  return (
    <div>
      <PageHeading
        icon={Medal}
        title="Ranks & Rewards"
        subtitle="It's not just a ranking — it's a partnership in a global network offering lifetime passive income. Each rank pays a 25% reward. No limits on rank-based rewards."
        action={<Pill tone="gold">Current: {user.rank}</Pill>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ranks.map((r) => {
          const progress = Math.min(
            100,
            (user.highestSlot / r.targetSlot) * 100
          );
          return (
            <div
              key={r.id}
              className={`glass relative overflow-hidden p-5 ${r.achieved ? "border-gold-400/30" : ""}`}
            >
              <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${tierColors[r.name].split(" ").slice(0, 2).join(" ")} to-transparent blur-2xl`} />
              <div className="relative flex items-center justify-between">
                <span className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${tierColors[r.name]}`}>
                  <Medal className="h-6 w-6" />
                </span>
                {r.achieved ? (
                  <Pill tone="emerald"><Check className="h-3 w-3" /> Achieved</Pill>
                ) : (
                  <Pill tone="slate"><Lock className="h-3 w-3" /> Locked</Pill>
                )}
              </div>
              <p className="relative mt-4 text-xs uppercase tracking-widest text-slate-500">
                Rank {r.id}
              </p>
              <h3 className="relative font-display text-xl font-bold text-white">{r.name}</h3>
              <p className="relative text-xs text-slate-500">{r.card}</p>

              <div className="relative mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-400">Target</span>
                <span className="font-mono font-semibold text-white">Slot {r.targetSlot}</span>
              </div>
              <div className="relative mt-1 flex items-center justify-between text-sm">
                <span className="text-slate-400">Reward</span>
                <span className="font-display font-bold text-gradient-gold">{r.reward}%</span>
              </div>

              <div className="relative mt-4">
                <Progress value={progress} tone={r.achieved ? "gold" : "brand"} />
                <p className="mt-2 text-xs text-slate-500">{r.requirement}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Panel className="mt-5" title="How ranks work" desc="Slide: Orichalcum Plate — first rank for rising leaders">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="mb-2 text-sm font-semibold text-white">Path to your next rank</p>
            <ol className="flex flex-col gap-2 text-sm text-slate-400">
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400" /> Refer 5 people directly</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400" /> Upgrade the same 5 members to Slot 5</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400" /> Advance to Slot 6 → unlock your second rank (Prime)</li>
            </ol>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-4">
            <p className="mb-3 text-sm font-semibold text-white">Rank milestones (slots)</p>
            <div className="flex flex-wrap gap-1.5">
              {slots.map((s) => {
                const isRank = ranks.find((r) => r.targetSlot === s.id);
                return (
                  <span
                    key={s.id}
                    className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold ${
                      isRank
                        ? "bg-gradient-to-br from-gold-400/30 to-accent-500/20 text-gold-300 ring-1 ring-gold-400/40"
                        : s.active
                        ? "bg-brand-500/15 text-white"
                        : "bg-white/[0.03] text-slate-500"
                    }`}
                    title={isRank ? isRank.name : `Slot ${s.id}`}
                  >
                    {s.id}
                  </span>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Highlighted slots (3, 6, 9, 12) unlock Rising, Prime, Royal &amp; Legendary.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
