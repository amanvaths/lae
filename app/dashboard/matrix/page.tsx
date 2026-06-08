"use client";

import { useState } from "react";
import { Network, Info } from "lucide-react";
import { PageHeading, Panel, Pill, StatCard } from "@/components/dashboard/ui";
import { slots, fmtBtc } from "@/lib/dashboard-data";

type Node = { n: number; label: string; tone: string };

// Co-matrix layout per cycle (slide 7): 14 members, 2 uplines, downlines, recycle
const positions: Node[] = [
  { n: 1, label: "Upline 1", tone: "from-brand-500 to-brand-700" },
  { n: 2, label: "Upline 2", tone: "from-brand-500 to-brand-700" },
  { n: 3, label: "Your", tone: "from-accent-500 to-accent-700" },
  { n: 4, label: "Next Slot", tone: "from-gold-400 to-gold-500" },
  { n: 5, label: "Next Slot", tone: "from-gold-400 to-gold-500" },
  { n: 6, label: "Your", tone: "from-accent-500 to-accent-700" },
  { n: 7, label: "Downline 1", tone: "from-emerald-500 to-emerald-700" },
  { n: 8, label: "Your", tone: "from-accent-500 to-accent-700" },
  { n: 9, label: "Your", tone: "from-accent-500 to-accent-700" },
  { n: 10, label: "Downline 1", tone: "from-emerald-500 to-emerald-700" },
  { n: 11, label: "Your", tone: "from-accent-500 to-accent-700" },
  { n: 12, label: "Your", tone: "from-accent-500 to-accent-700" },
  { n: 13, label: "Downline 2", tone: "from-emerald-500 to-emerald-700" },
  { n: 14, label: "Recycle", tone: "from-fuchsia-500 to-fuchsia-700" },
];

const flow = [
  ["14", "Recycle / Sponsor"],
  ["2", "2nd Upline"],
  ["1", "1st Upline"],
  ["—", "YOU"],
  ["7", "1st Downline"],
  ["10", "1st Downline"],
  ["13", "2nd Downline"],
];

export default function MatrixPage() {
  const [slot, setSlot] = useState(1);
  const active = slots.filter((s) => s.active);
  const cur = slots.find((s) => s.id === slot)!;

  return (
    <div>
      <PageHeading
        icon={Network}
        title="Co-Matrix"
        subtitle="The world's first single-leg, co-matrix plan. Each cycle fills 14 positions across your two uplines and downlines — fully automated with auto-spillover."
        action={
          <div className="flex flex-wrap gap-1.5">
            {active.map((s) => (
              <button
                key={s.id}
                onClick={() => setSlot(s.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  slot === s.id
                    ? "bg-brand-500/20 text-brand-200"
                    : "bg-white/[0.04] text-slate-400 hover:text-white"
                }`}
              >
                Slot {s.id}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <StatCard label="Slot" value={`#${cur.id}`} sub={`${cur.price} BTC entry`} accent="brand" />
        <StatCard label="Cycle members" value={`${cur.members}/14`} accent="violet" />
        <StatCard label="Recycles done" value={`×${cur.cycles}`} accent="gold" />
        <StatCard label="Auto-spillover" value="Active" accent="emerald" />
      </div>

      <Panel title={`Slot ${cur.id} · co-matrix cycle`} desc="Live position map (14 members per cycle)">
        {/* YOU */}
        <div className="flex flex-col items-center">
          <div className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-brand-500 px-8 py-3 font-display text-lg font-bold text-white shadow-glow">
            YOU
          </div>
          <div className="my-3 h-6 w-px bg-white/15" />
        </div>

        {/* Position grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-7">
          {positions.map((p) => {
            const filled = p.n <= cur.members;
            return (
              <div
                key={p.n}
                className={`relative overflow-hidden rounded-xl border p-3 text-center ${
                  filled ? "border-white/15" : "border-dashed border-white/10 opacity-50"
                }`}
              >
                <span
                  className={`absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br ${p.tone} text-[10px] font-bold text-white`}
                >
                  {p.n}
                </span>
                <p className="mt-3 text-[11px] font-semibold text-white">{p.label}</p>
                <p className="text-[10px] text-slate-500">
                  {filled ? "Filled" : "Open"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Your Income", fmtBtc(cur.income, 3), "text-gradient"],
            ["Next Slot", fmtBtc(cur.price * 2, 3), "text-gold-300"],
            ["Slot Recycle", fmtBtc(cur.price, 3), "text-emerald-300"],
            ["Total Team", "14 members", "text-white"],
          ].map(([k, v, c]) => (
            <div key={k} className="rounded-xl bg-white/[0.03] p-3 text-center">
              <p className="text-xs text-slate-500">{k}</p>
              <p className={`mt-1 font-display font-bold ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Earning flow structure" desc="How value propagates each cycle">
          <div className="flex flex-col gap-2">
            {flow.map(([num, label]) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                  label === "YOU"
                    ? "bg-gradient-to-r from-brand-500/20 to-accent-500/10"
                    : "bg-white/[0.03]"
                }`}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-200">
                  {num}
                </span>
                <span className={`text-sm ${label === "YOU" ? "font-bold text-white" : "text-slate-300"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Spillover system">
          <div className="flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-500/[0.06] p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
            <p className="text-sm leading-relaxed text-slate-300">
              Once the first 2 members join, the spillover system becomes active.
              From then on you enjoy free bonus benefits generated automatically
              from both your uplines and downlines — without any extra effort.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ["Your Income", fmtBtc(cur.income, 3)],
              ["Royal Pool", fmtBtc(cur.price, 3)],
              ["Spillover", "Active"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-white/[0.03] py-3">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="mt-1 font-mono text-sm font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>
          <Pill tone="emerald" className="mt-4">No withdraw charges · instant settlement</Pill>
        </Panel>
      </div>
    </div>
  );
}
