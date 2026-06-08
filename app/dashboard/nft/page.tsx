"use client";

import { Gem, Clock, TrendingUp, Flame } from "lucide-react";
import { PageHeading, Panel, Pill, StatCard, Progress } from "@/components/dashboard/ui";
import { nft, fmtBtc, btcToUsd } from "@/lib/dashboard-data";

const appreciation = ((nft.currentPrice - nft.startPrice) / nft.startPrice) * 100;
const toTarget = (nft.currentPrice / nft.targetPrice) * 100;
const lockProgress = (nft.daysHeld / nft.lockDays) * 100;
const unlocked = nft.daysHeld >= nft.lockDays;

export default function NftPage() {
  return (
    <div>
      <PageHeading
        icon={Gem}
        title="Welcome Pass NFT"
        subtitle="Your unique entry-pass NFT, minted on joining. It can appreciate up to 1 BTC — an extra earning layer on top of your matrix income. Sellable anytime at the live market rate after the lock period."
      />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* NFT card */}
        <div className="glass relative overflow-hidden p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/15 via-transparent to-accent-500/15" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <Pill tone="violet">Exclusive NFT</Pill>
              <Pill tone={unlocked ? "emerald" : "gold"}>
                {unlocked ? "Unlocked" : "Locked"}
              </Pill>
            </div>
            <div className="relative mx-auto flex aspect-[3/4] max-w-[220px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-ink-800 to-ink-900 p-6 text-center shadow-glow">
              <span className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-accent-600">
                <Gem className="h-10 w-10 text-white" />
              </span>
              <p className="mt-4 font-display text-lg font-bold text-white">Registration Pass</p>
              <p className="text-xs text-slate-400">{nft.name}</p>
              <p className="mt-4 font-mono text-2xl font-bold text-gradient">{nft.currentPrice}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">BTC floor</p>
            </div>
            <button
              disabled={!unlocked}
              className={`mt-5 w-full justify-center ${unlocked ? "btn-primary" : "cursor-not-allowed rounded-full border border-white/8 py-3 text-sm text-slate-600"}`}
            >
              {unlocked ? "Sell at market price" : `Unlocks in ${nft.lockDays - nft.daysHeld} days`}
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Current floor" value={fmtBtc(nft.currentPrice, 4)} sub={btcToUsd(nft.currentPrice)} icon={Gem} accent="brand" />
            <StatCard label="Appreciation" value={`+${appreciation.toFixed(0)}%`} sub={`from ${nft.startPrice} BTC`} icon={TrendingUp} accent="emerald" />
            <StatCard label="Target price" value={fmtBtc(nft.targetPrice, 0)} sub={btcToUsd(nft.targetPrice)} icon={Flame} accent="gold" />
          </div>

          <Panel title="Progress to target">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-slate-400">{nft.currentPrice} BTC of {nft.targetPrice} BTC</span>
              <span className="text-white">{toTarget.toFixed(1)}%</span>
            </div>
            <Progress value={toTarget} tone="gold" />
          </Panel>

          <Panel title="Lock period">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-slate-400"><Clock className="h-4 w-4" /> {nft.daysHeld} of {nft.lockDays} days held</span>
              <span className="text-white">{lockProgress.toFixed(0)}%</span>
            </div>
            <Progress value={lockProgress} />
            <p className="mt-3 text-xs text-slate-500">
              Minted {nft.minted}. With just 0.001 BTC you unlock both a business
              model (earning up to 61 BTC) and this NFT — held free. On exit, the
              NFT is automatically burned.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
