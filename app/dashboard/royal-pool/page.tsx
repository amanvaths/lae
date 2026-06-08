"use client";

import { Crown, Droplets, Medal, Clock } from "lucide-react";
import { PageHeading, Panel, Pill, StatCard, Progress } from "@/components/dashboard/ui";
import { royalPool, fmtBtc, btcToUsd } from "@/lib/dashboard-data";

export default function RoyalPoolPage() {
  return (
    <div>
      <PageHeading
        icon={Crown}
        title="Royal Pool"
        subtitle="Every 4th position from each slot after the first cycle flows into the Royal Pool — fueling NFT liquidity and rank-based passive income."
        action={<Pill tone="gold"><Clock className="h-3.5 w-3.5" /> Next: {royalPool.nextDistribution}</Pill>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <StatCard label="Global pool" value={fmtBtc(royalPool.totalPool, 2)} sub={btcToUsd(royalPool.totalPool)} icon={Crown} accent="gold" />
        <StatCard label="My pool income" value={fmtBtc(royalPool.myEarned, 4)} icon={Medal} accent="brand" />
        <StatCard label="My positions" value={royalPool.myPositions} sub="every 4th position" accent="violet" />
        <StatCard label="To NFT liquidity" value={`${royalPool.nftLiquidityShare * 100}%`} icon={Droplets} accent="emerald" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pool composition" desc="How the Royal Pool fund is split">
          <div className="flex items-center gap-6">
            <div className="relative h-36 w-36 shrink-0">
              <svg viewBox="0 0 36 36" className="h-36 w-36 -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="50 50" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#1e9bff" strokeWidth="4" strokeDasharray="50 50" strokeDashoffset="-50" />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Royal<br/>Pool</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-[#1e9bff]" />
                <div>
                  <p className="text-sm font-medium text-white">NFT Liquidity — 50%</p>
                  <p className="text-xs text-slate-500">Raises the Welcome Pass NFT floor price</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-[#8b5cf6]" />
                <div>
                  <p className="text-sm font-medium text-white">Ranks &amp; Rewards — 50%</p>
                  <p className="text-xs text-slate-500">Monthly passive income to ranked members</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="My Royal Pool positions" desc="Qualifying 4th positions per slot">
          <div className="flex flex-col gap-2.5">
            {[
              { slot: 1, pos: 3 },
              { slot: 2, pos: 2 },
              { slot: 3, pos: 1 },
              { slot: 4, pos: 1 },
            ].map((r) => (
              <div key={r.slot} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5">
                <span className="text-sm text-white">Slot {r.slot}</span>
                <div className="flex items-center gap-2">
                  <Pill tone="violet">{r.pos} positions</Pill>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-slate-400">Next distribution in</span>
              <span className="text-white">{royalPool.nextDistribution}</span>
            </div>
            <Progress value={68} tone="gold" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
