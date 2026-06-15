"use client";

import { Droplets, TrendingUp } from "lucide-react";
import { PageHeading, Panel, Pill, StatCard, Sparkline } from "@/components/dashboard/ui";
import { royalPool, nft, fmtBtc, btcToUsd } from "@/lib/dashboard-data";

const liquidity = royalPool.totalPool * royalPool.nftLiquidityShare;
const priceSeries = [0.001, 0.0021, 0.0035, 0.0052, 0.0078, 0.0101, 0.0134, 0.0162, 0.0186];

export default function LiquidityPage() {
  return (
    <div>
      <PageHeading
        icon={Droplets}
        title="NFT Liquidity Pool"
        subtitle="Every 4th position after the first cycle sends 50% of its funds into the NFT Liquidity Pool, continuously raising the Welcome Pass NFT floor price."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <StatCard label="Pool liquidity" value={fmtBtc(liquidity, 2)} sub={btcToUsd(liquidity)} icon={Droplets} accent="brand" />
        <StatCard label="NFT floor" value={fmtBtc(nft.currentPrice, 4)} icon={TrendingUp} accent="emerald" trend={{ value: "+1760%", up: true }} />
        <StatCard label="Pool share" value="50%" sub="of Royal Pool" accent="violet" />
        <StatCard label="Target floor" value={fmtBtc(nft.targetPrice, 0)} accent="gold" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="NFT floor price growth" desc="Driven by continuous liquidity inflow">
          <Sparkline data={priceSeries} height={150} stroke="#34d399" />
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>mint</span>
            <span>now · {nft.currentPrice} BTC</span>
          </div>
        </Panel>

        <Panel title="How it works">
          <ul className="flex flex-col gap-3 text-sm text-slate-400">
            {[
              "Every 4th slot position after cycle 1 routes into the Royal Pool.",
              "50% of that flows directly to the NFT Liquidity Pool.",
              "Liquidity continuously raises the Welcome Pass NFT floor.",
              "Holders benefit from NFT appreciation — sell anytime at market rate.",
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-200">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ul>
          <Pill tone="emerald" className="mt-4">Self-sustaining reward cycle</Pill>
        </Panel>
      </div>
    </div>
  );
}
