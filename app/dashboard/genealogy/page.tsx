"use client";

import { Workflow, ChevronDown } from "lucide-react";
import { useState } from "react";
import { PageHeading, Panel, Pill, StatCard } from "@/components/dashboard/ui";
import { directReferrals, teamMembers, teamStats, user } from "@/lib/dashboard-data";

function MemberNode({
  name,
  slot,
  team,
  depth = 0,
  children,
}: {
  name: string;
  slot: number;
  team: number;
  depth?: number;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(depth < 1);
  return (
    <div className={depth > 0 ? "ml-5 border-l border-white/10 pl-5" : ""}>
      <div className="relative flex items-center gap-3 py-2">
        {depth > 0 && (
          <span className="absolute -left-5 top-1/2 h-px w-5 bg-white/10" />
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex flex-1 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
            depth === 0
              ? "border-brand-500/40 bg-brand-500/10"
              : "border-white/8 bg-white/[0.03] hover:border-white/15"
          }`}
        >
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
              depth === 0
                ? "bg-gradient-to-br from-brand-400 to-accent-600"
                : "bg-white/10"
            }`}
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">@{name}</p>
            <p className="text-xs text-slate-500">
              Slot {slot} · {team} team
            </p>
          </div>
          {children && (
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
            />
          )}
        </button>
      </div>
      {open && children}
    </div>
  );
}

export default function GenealogyPage() {
  return (
    <div>
      <PageHeading
        icon={Workflow}
        title="Genealogy"
        subtitle="Your complete downline tree. Expand any member to drill into their network — value flows up through every level to you."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Network" value={teamStats.total.toLocaleString()} accent="brand" />
        <StatCard label="Direct (L1)" value={teamStats.directs} accent="violet" />
        <StatCard label="Active" value={teamStats.active} accent="emerald" />
        <StatCard label="Depth reached" value="7 levels" accent="gold" />
      </div>

      <Panel title="Network tree" desc={`@${user.username} · ${teamStats.total} members`}>
        <MemberNode name={user.username} slot={user.highestSlot} team={teamStats.total}>
          {directReferrals.map((d) => (
            <MemberNode
              key={d.id}
              name={d.username}
              slot={d.slot}
              team={d.team}
              depth={1}
            >
              {teamMembers
                .filter((m) => m.leg !== "Direct")
                .slice(0, 2)
                .map((g) => (
                  <MemberNode
                    key={g.id + d.id}
                    name={g.username}
                    slot={g.slot}
                    team={g.team}
                    depth={2}
                  />
                ))}
            </MemberNode>
          ))}
        </MemberNode>
      </Panel>

      <Panel className="mt-4" title="Members per level">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[120, 84, 56, 31, 17, 8, 2].map((c, i) => (
            <div key={i} className="rounded-xl bg-white/[0.03] p-4 text-center">
              <p className="font-display text-xl font-bold text-white">{c}</p>
              <Pill tone={i === 0 ? "brand" : "slate"} className="mt-1.5">
                Level {i + 1}
              </Pill>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
