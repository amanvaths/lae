"use client";

import { motion } from "framer-motion";
import { LayoutGrid, Lock, Check, Zap, RefreshCw } from "lucide-react";
import { PageHeading, Panel, Pill, StatCard } from "@/components/dashboard/ui";
import { slots, user, btcToUsd, fmtBtc } from "@/lib/dashboard-data";

const activeCount = slots.filter((s) => s.active).length;
const invested = slots.filter((s) => s.active).reduce((a, s) => a + s.price, 0);
const earned = slots.filter((s) => s.active).reduce((a, s) => a + s.income * s.cycles, 0);

export default function SlotsPage() {
  return (
    <div>
      <PageHeading
        icon={LayoutGrid}
        title="My Slots"
        subtitle="The 12-Slot Power System. Each slot doubles the entry and unlocks higher earning capacity with unlimited recycling."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active Slots" value={`${activeCount} / 12`} icon={Check} accent="brand" />
        <StatCard label="Total Invested" value={fmtBtc(invested, 3)} sub={btcToUsd(invested)} icon={Zap} accent="violet" />
        <StatCard label="Earned from slots" value={fmtBtc(earned, 4)} sub={btcToUsd(earned)} icon={RefreshCw} accent="gold" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((s, i) => {
          const next = !s.active && s.id === user.highestSlot + 1;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass relative overflow-hidden p-5 ${
                s.active ? "border-brand-500/30" : "opacity-95"
              }`}
            >
              {s.active && (
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-500/20 blur-2xl" />
              )}
              <div className="relative flex items-center justify-between">
                <span className="font-display text-lg font-bold text-white">
                  Slot {s.id}
                </span>
                {s.active ? (
                  <Pill tone="emerald">
                    <Check className="h-3 w-3" /> Active
                  </Pill>
                ) : (
                  <Pill tone="slate">
                    <Lock className="h-3 w-3" /> Locked
                  </Pill>
                )}
              </div>

              <div className="relative mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-500">Entry price</p>
                  <p className="font-mono text-2xl font-bold text-white">{s.price}</p>
                  <p className="text-xs text-slate-500">BTC · {btcToUsd(s.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Income / cycle</p>
                  <p className="font-mono text-lg font-bold text-gradient">{s.income}</p>
                  <p className="text-xs text-slate-500">BTC</p>
                </div>
              </div>

              <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white/[0.03] py-2">
                  <p className="font-mono text-sm font-semibold text-white">{s.cycles}</p>
                  <p className="text-[10px] text-slate-500">Recycles</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] py-2">
                  <p className="font-mono text-sm font-semibold text-white">{s.members}/14</p>
                  <p className="text-[10px] text-slate-500">Members</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] py-2">
                  <p className="font-mono text-sm font-semibold text-white">{s.multiplier}×</p>
                  <p className="text-[10px] text-slate-500">Potential</p>
                </div>
              </div>

              <div className="relative mt-4">
                {s.active ? (
                  <button className="btn-ghost w-full justify-center !py-2 text-sm">
                    Auto-recycling
                  </button>
                ) : next ? (
                  <button className="btn-primary w-full justify-center !py-2 text-sm">
                    <Zap className="h-4 w-4" /> Activate · {s.price} BTC
                  </button>
                ) : (
                  <button disabled className="w-full cursor-not-allowed rounded-full border border-white/8 py-2 text-sm text-slate-600">
                    Unlock Slot {s.id - 1} first
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <Panel className="mt-5" title="How slots work">
        <ul className="grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
          {[
            "Start with just 0.001 BTC and the engine auto-upgrades your position slot by slot.",
            "Each slot pays 7× its price per completed cycle (Slot 12 pays 9×).",
            "Every slot supports unlimited recycles — income never stops.",
            "Slot upgrades and recycles are funded automatically from your matrix flow.",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              {t}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
