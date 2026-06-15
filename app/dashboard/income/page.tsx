"use client";

import { TrendingUp } from "lucide-react";
import { PageHeading, Panel, StatCard, Sparkline } from "@/components/dashboard/ui";
import {
  incomeTypes,
  totalEarned,
  earningsSeries,
  btcToUsd,
  fmtBtc,
} from "@/lib/dashboard-data";

const COLORS = ["#1e9bff", "#8b5cf6", "#48bcff", "#a78bfa", "#f5c33b", "#34d399"];

export default function IncomePage() {
  let acc = 0;
  const segments = incomeTypes.map((it, i) => {
    const pct = (it.earned / totalEarned) * 100;
    const seg = { ...it, pct, offset: acc, color: COLORS[i % COLORS.length] };
    acc += pct;
    return seg;
  });

  return (
    <div>
      <PageHeading
        icon={TrendingUp}
        title="Income & Earnings"
        subtitle="A full breakdown of your Bitcoin income. B-Titan pays on every level — downline, upline, recycle, spillover, Royal Pool and rank rewards."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total earned" value={fmtBtc(totalEarned, 4)} sub={btcToUsd(totalEarned)} accent="gold" trend={{ value: "+12.4% wk", up: true }} />
        <StatCard label="This week" value={fmtBtc(earningsSeries.reduce((a, b) => a + b, 0), 4)} accent="brand" />
        <StatCard label="Income streams" value={incomeTypes.length} sub="all active" accent="emerald" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Distribution" desc="By income type">
          <div className="flex flex-col items-center">
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 36 36" className="h-44 w-44 -rotate-90">
                {segments.map((s) => (
                  <circle
                    key={s.key}
                    cx="18" cy="18" r="15.9155" fill="none"
                    stroke={s.color} strokeWidth="3.4"
                    strokeDasharray={`${s.pct} ${100 - s.pct}`}
                    strokeDashoffset={`${-s.offset}`}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="font-display text-lg font-bold text-white">{fmtBtc(totalEarned, 3)}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">total</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Income streams">
          <div className="flex flex-col gap-3">
            {segments.map((s) => (
              <div key={s.key} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{s.label}</p>
                  <p className="truncate text-xs text-slate-500">{s.desc}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-white">{s.earned.toFixed(4)}</p>
                  <p className="text-xs text-slate-500">{s.pct.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-4" title="Earnings trend — 14 days">
        <Sparkline data={earningsSeries} height={140} stroke="#48bcff" />
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>14d ago</span>
          <span>today</span>
        </div>
      </Panel>
    </div>
  );
}
