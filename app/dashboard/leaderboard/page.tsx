"use client";

import { Trophy, Crown } from "lucide-react";
import { PageHeading, Panel, Pill } from "@/components/dashboard/ui";
import { leaderboard, fmtBtc } from "@/lib/dashboard-data";

const tierTone: Record<string, "gold" | "violet" | "brand" | "emerald"> = {
  Legendary: "gold",
  Royal: "brand",
  Prime: "violet",
  Rising: "emerald",
};

export default function LeaderboardPage() {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const order = [1, 0, 2]; // center the #1

  return (
    <div>
      <PageHeading
        icon={Trophy}
        title="Leaderboard"
        subtitle="Top earners across the global B-Titan network this season. Climb the slots and grow your team to rise."
      />

      {/* Podium */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {order.map((idx) => {
          const p = top3[idx];
          const place = idx + 1;
          const heights = ["pt-4", "pt-0", "pt-8"];
          return (
            <div key={p.username} className={heights[idx]}>
              <div
                className={`glass flex flex-col items-center p-5 ${
                  place === 1 ? "border-gold-400/40" : ""
                }`}
              >
                <span
                  className={`grid h-14 w-14 place-items-center rounded-full text-lg font-bold text-white ${
                    place === 1
                      ? "bg-gradient-to-br from-gold-300 to-gold-500 shadow-glow"
                      : "bg-gradient-to-br from-brand-400 to-accent-600"
                  }`}
                >
                  {place === 1 ? <Crown className="h-7 w-7" /> : p.username.slice(0, 1).toUpperCase()}
                </span>
                <p className="mt-3 font-display text-sm font-bold text-white">@{p.username}</p>
                <Pill tone={tierTone[p.tier]} className="mt-1.5">{p.tier}</Pill>
                <p className="mt-3 font-mono text-lg font-bold text-gradient-gold">{fmtBtc(p.earned, 2)}</p>
                <p className="text-xs text-slate-500">#{place} · {p.team.toLocaleString()} team</p>
              </div>
            </div>
          );
        })}
      </div>

      <Panel title="Full rankings">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pl-2">#</th>
                <th className="py-3">Member</th>
                <th className="py-3">Tier</th>
                <th className="py-3">Highest slot</th>
                <th className="py-3">Team</th>
                <th className="py-3 pr-2 text-right">Earned</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((p) => (
                <tr
                  key={p.username}
                  className={`border-b border-white/5 ${p.username === "you" ? "bg-brand-500/[0.06]" : ""}`}
                >
                  <td className="py-3 pl-2 font-display font-bold text-white">{p.rank}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
                        {p.username.slice(0, 1).toUpperCase()}
                      </span>
                      <span className={`font-medium ${p.username === "you" ? "text-brand-200" : "text-white"}`}>
                        @{p.username}{p.username === "you" && " (you)"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3"><Pill tone={tierTone[p.tier]}>{p.tier}</Pill></td>
                  <td className="py-3 font-mono text-slate-300">#{p.slot}</td>
                  <td className="py-3 text-slate-300">{p.team.toLocaleString()}</td>
                  <td className="py-3 pr-2 text-right font-mono font-semibold text-gradient">{fmtBtc(p.earned, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
