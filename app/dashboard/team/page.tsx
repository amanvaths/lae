"use client";

import { useState } from "react";
import { Users, Search } from "lucide-react";
import { PageHeading, Panel, Pill, StatCard } from "@/components/dashboard/ui";
import { teamMembers, teamStats, fmtBtc } from "@/lib/dashboard-data";

const legs = ["All", "Direct", "L1", "L2"] as const;

export default function TeamPage() {
  const [leg, setLeg] = useState<(typeof legs)[number]>("All");
  const [q, setQ] = useState("");

  const rows = teamMembers.filter(
    (m) =>
      (leg === "All" || m.leg === leg) &&
      m.username.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeading
        icon={Users}
        title="My Team"
        subtitle="Everyone in your network across all legs. Track slots, team size and earnings for each member."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <StatCard label="Total team" value={teamStats.total.toLocaleString()} accent="brand" />
        <StatCard label="Active" value={teamStats.active} accent="emerald" />
        <StatCard label="Idle" value={teamStats.idle} accent="gold" />
        <StatCard label="Joined today" value={teamStats.todayJoins} accent="violet" />
      </div>

      <Panel
        title="Members"
        action={
          <div className="flex items-center gap-1.5">
            {legs.map((l) => (
              <button
                key={l}
                onClick={() => setLeg(l)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  leg === l ? "bg-brand-500/20 text-brand-200" : "bg-white/[0.04] text-slate-400 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        }
      >
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search members…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-brand-500/50"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3">Member</th>
                <th className="py-3">ID</th>
                <th className="py-3">Leg</th>
                <th className="py-3">Slot</th>
                <th className="py-3">Team</th>
                <th className="py-3">Earned</th>
                <th className="py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
                        {m.username.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="font-medium text-white">@{m.username}</span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-xs text-slate-500">{m.id}</td>
                  <td className="py-3"><Pill tone={m.leg === "Direct" ? "brand" : "slate"}>{m.leg}</Pill></td>
                  <td className="py-3 font-mono text-slate-300">#{m.slot}</td>
                  <td className="py-3 text-slate-300">{m.team}</td>
                  <td className="py-3 font-mono font-semibold text-gradient">{fmtBtc(m.earned, 3)}</td>
                  <td className="py-3 text-right">
                    <Pill tone={m.status === "active" ? "emerald" : "gold"}>{m.status}</Pill>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
