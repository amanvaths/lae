"use client";

import { Gauge, ArrowRight } from "lucide-react";
import { PageHeading, Panel, Pill } from "@/components/dashboard/ui";
import { slots, user, fmtBtc, btcToUsd, TOTAL_MATRIX_POTENTIAL } from "@/lib/dashboard-data";

export default function SlotEnginePage() {
  return (
    <div>
      <PageHeading
        icon={Gauge}
        title="Bitcoin Slot Engine"
        subtitle="A smart upgrade system designed to multiply your Bitcoin potential. Each slot unlocks higher earning capacity in a structured growth cycle."
        action={<Pill tone="gold">Total potential {fmtBtc(TOTAL_MATRIX_POTENTIAL)}</Pill>}
      />

      <Panel title="Income per slot" desc="Price → income per cycle → recycle multiplier → total potential">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pl-2">Slot</th>
                <th className="py-3">Price (BTC)</th>
                <th className="py-3">Income / cycle</th>
                <th className="py-3">Recycle ×</th>
                <th className="py-3">Total potential</th>
                <th className="py-3 pr-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-white/5 ${s.active ? "" : "opacity-60"}`}
                >
                  <td className="py-3 pl-2 font-display font-bold text-white">#{s.id}</td>
                  <td className="py-3 font-mono text-slate-300">{s.price}</td>
                  <td className="py-3 font-mono font-semibold text-gradient">{s.income}</td>
                  <td className="py-3 font-mono text-slate-400">{s.multiplier}×</td>
                  <td className="py-3 font-mono font-semibold text-white">{s.totalIncome}</td>
                  <td className="py-3 pr-2 text-right">
                    {s.active ? (
                      <Pill tone="emerald">Active</Pill>
                    ) : s.id === user.highestSlot + 1 ? (
                      <Pill tone="brand">Next</Pill>
                    ) : (
                      <Pill tone="slate">Locked</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="py-3 pl-2 text-right text-sm font-medium text-slate-400">
                  Total matrix potential (12 slots recycling)
                </td>
                <td className="py-3 font-display font-bold text-gradient-gold">
                  {TOTAL_MATRIX_POTENTIAL}
                </td>
                <td className="py-3 pr-2 text-right text-xs text-slate-500">
                  {btcToUsd(TOTAL_MATRIX_POTENTIAL)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Automated upgrade model">
          <p className="text-sm leading-relaxed text-slate-400">
            Start with just <span className="font-semibold text-white">0.001 BTC</span>{" "}
            and activate a powerful 12-slot engine that automatically upgrades
            your position. Each completed slot funds the next, moving you forward
            in a structured Bitcoin growth cycle — no manual top-ups required.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {slots.map((s) => (
              <div key={s.id} className="flex items-center gap-1">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-lg border text-xs font-bold ${
                    s.active
                      ? "border-brand-500/40 bg-brand-500/15 text-white"
                      : "border-white/8 bg-white/[0.02] text-slate-500"
                  }`}
                >
                  {s.id}
                </span>
                {s.id < 12 && <ArrowRight className="h-3 w-3 text-slate-600" />}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Matrix recycling — 12 slots">
          <p className="mb-3 text-sm text-slate-400">
            After the 12th recycle the income multiplier compounds across every
            slot, building toward the full {fmtBtc(TOTAL_MATRIX_POTENTIAL)} potential.
          </p>
          <div className="flex flex-col gap-1.5">
            {slots.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-xs text-slate-500">Slot {s.id}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-500"
                    style={{ width: `${(s.totalIncome / TOTAL_MATRIX_POTENTIAL) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs text-white">
                  {s.totalIncome}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
