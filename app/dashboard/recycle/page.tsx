"use client";

import { RefreshCw, Repeat } from "lucide-react";
import { PageHeading, Panel, Pill, StatCard } from "@/components/dashboard/ui";
import { slots, fmtBtc, btcToUsd } from "@/lib/dashboard-data";

const totalRecycles = slots.reduce((a, s) => a + s.cycles, 0);
const recycleEarnings = slots.reduce((a, s) => a + s.income * s.cycles, 0);

// Build a flat recycle log from slot cycle counts
const log = slots
  .filter((s) => s.cycles > 0)
  .flatMap((s) =>
    Array.from({ length: Math.min(s.cycles, 4) }, (_, c) => ({
      slot: s.id,
      cycle: s.cycles - c,
      payout: s.income,
      date: `2026-06-0${(s.id + c) % 8 + 1} ${10 + c}:0${s.id % 6}`,
    }))
  )
  .sort((a, b) => b.date.localeCompare(a.date));

export default function RecyclePage() {
  return (
    <div>
      <PageHeading
        icon={RefreshCw}
        title="Recycle History"
        subtitle="Every slot supports unlimited recycles. Each completed cycle pays out automatically and re-enters you for the next."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Recycles" value={totalRecycles} icon={Repeat} accent="brand" />
        <StatCard label="Recycle Earnings" value={fmtBtc(recycleEarnings, 4)} sub={btcToUsd(recycleEarnings)} icon={RefreshCw} accent="gold" />
        <StatCard label="Recycle Policy" value="Unlimited" sub="No expiry · no freeze" accent="emerald" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-1" title="Recycles per slot">
          <div className="flex flex-col gap-2.5">
            {slots.filter((s) => s.active).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5">
                <span className="text-sm font-medium text-white">Slot {s.id}</span>
                <div className="flex items-center gap-2">
                  <Pill tone="brand">×{s.cycles}</Pill>
                  <span className="font-mono text-xs text-slate-400">
                    {fmtBtc(s.income * s.cycles, 4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Recent recycle payouts">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2.5">Slot</th>
                  <th className="py-2.5">Cycle #</th>
                  <th className="py-2.5">Payout</th>
                  <th className="py-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {log.map((r, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2.5 font-display font-bold text-white">#{r.slot}</td>
                    <td className="py-2.5 text-slate-400">Cycle {r.cycle}</td>
                    <td className="py-2.5 font-mono font-semibold text-emerald-400">
                      +{r.payout.toFixed(4)}
                    </td>
                    <td className="py-2.5 text-right text-xs text-slate-500">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
