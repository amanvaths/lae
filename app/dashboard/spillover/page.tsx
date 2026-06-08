"use client";

import { Shuffle, ArrowDown, ArrowUp, Info } from "lucide-react";
import { PageHeading, Panel, Pill, StatCard } from "@/components/dashboard/ui";
import { fmtBtc, btcToUsd } from "@/lib/dashboard-data";

const spilloverLog = [
  { from: "Upline 1", dir: "down", member: "node_master", slot: 5, amount: 0.0042, date: "2026-06-08 08:12" },
  { from: "Downline 2", dir: "up", member: "spark_io", slot: 2, amount: 0.0018, date: "2026-06-07 19:40" },
  { from: "Upline 2", dir: "down", member: "ada_blue", slot: 4, amount: 0.0036, date: "2026-06-07 11:05" },
  { from: "Downline 1", dir: "up", member: "vault_77", slot: 1, amount: 0.0009, date: "2026-06-06 22:18" },
  { from: "Upline 1", dir: "down", member: "minerpro", slot: 3, amount: 0.0024, date: "2026-06-06 09:51" },
];

const totalSpill = spilloverLog.reduce((a, s) => a + s.amount, 0);

export default function SpilloverPage() {
  return (
    <div>
      <PageHeading
        icon={Shuffle}
        title="Auto-Spillover"
        subtitle="Once your first 2 members join, spillover activates. You earn free bonus income from members auto-placed by both your uplines and downlines."
        action={<Pill tone="emerald">System active</Pill>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Spillover income" value={fmtBtc(totalSpill, 4)} sub={btcToUsd(totalSpill)} icon={Shuffle} accent="brand" />
        <StatCard label="From uplines" value={spilloverLog.filter((s) => s.dir === "down").length} sub="placements received" icon={ArrowDown} accent="violet" />
        <StatCard label="From downlines" value={spilloverLog.filter((s) => s.dir === "up").length} sub="placements received" icon={ArrowUp} accent="gold" />
      </div>

      <Panel className="mb-4">
        <div className="flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-500/[0.06] p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
          <p className="text-sm leading-relaxed text-slate-300">
            B-Titan features the quickest spillover mechanism in the smart-contract
            arena. After the first 2 members join, you start enjoying free bonus
            benefits generated automatically from both your uplines and downlines —
            <span className="font-medium text-white"> without any additional effort.</span>
          </p>
        </div>
      </Panel>

      <Panel title="Spillover activity">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3">Source</th>
                <th className="py-3">Member</th>
                <th className="py-3">Slot</th>
                <th className="py-3">Amount</th>
                <th className="py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {spilloverLog.map((s, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {s.dir === "down" ? (
                        <ArrowDown className="h-4 w-4 text-brand-400" />
                      ) : (
                        <ArrowUp className="h-4 w-4 text-accent-400" />
                      )}
                      <span className="text-slate-300">{s.from}</span>
                    </span>
                  </td>
                  <td className="py-3 font-medium text-white">@{s.member}</td>
                  <td className="py-3 font-mono text-slate-400">#{s.slot}</td>
                  <td className="py-3 font-mono font-semibold text-emerald-400">+{s.amount.toFixed(4)}</td>
                  <td className="py-3 text-right text-xs text-slate-500">{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
