"use client";

import { useState } from "react";
import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { MatrixVisualizer } from "@/components/lae-club/MatrixVisualizer";
import { LAE_LEVELS } from "@/lib/lae-club/constants";
import { useLaeLevelPrices, useLaeMatrixLevel, useLaeUser } from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";

export default function MatrixPage() {
  const [level, setLevel] = useState(1);
  const user = useLaeUser();
  const prices = useLaeLevelPrices();
  const matrix = useLaeMatrixLevel(level);

  if (user.isLoading) {
    return <QueryLoading label="Loading LAE Club matrix…" />;
  }

  const price = prices.prices?.find((p) => p.level === level);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">LAE Club Matrix</h1>
      <p className="mt-1 text-sm text-slate-400">
        15 levels · 14 spots · live on-chain · User ID #{String(user.userId ?? "—")}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: LAE_LEVELS }, (_, i) => i + 1).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              l === level
                ? "bg-brand-500 text-ink-950"
                : "border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            L{l}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title={`Level ${level} stats`}>
          <div className="space-y-2 text-sm">
            <p className="text-slate-400">
              Price: <span className="text-white">{price?.priceFormatted ?? "—"}</span>
            </p>
            <p className="text-slate-400">
              Filled spots:{" "}
              <span className="text-emerald-400">{matrix.filledSpots}/14</span>
            </p>
            <p className="text-slate-400">
              Team in matrix: <span className="text-white">{String(matrix.totalTeamSize)}</span>
            </p>
            <p className="text-slate-400">
              Recycles: <span className="text-white">{String(matrix.reinvestCount)}</span>
            </p>
            <p className="text-slate-400">
              Earnings:{" "}
              <span className="text-brand-300">
                {matrix.totalEarning ? fmtEther(matrix.totalEarning) : "0"}
              </span>
            </p>
            {matrix.heldForUpgrade > 0n && (
              <Pill tone="gold">Upgrade hold: {fmtEther(matrix.heldForUpgrade)}</Pill>
            )}
          </div>
        </Panel>

        <Panel title="Matrix tree" className="lg:col-span-2">
          {matrix.isLoading ? (
            <QueryLoading label="Loading level data…" />
          ) : (
            <MatrixVisualizer
              referrals={matrix.referrals}
              level={level}
              reinvestCount={matrix.reinvestCount}
              totalEarning={matrix.totalEarning}
            />
          )}
        </Panel>
      </div>

      <Panel className="mt-4" title="All level prices (on-chain)">
        {prices.isLoading ? (
          <QueryLoading label="Loading prices…" />
        ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(prices.prices ?? []).map((p) => (
            <div
              key={p.level}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm"
            >
              <span className="text-slate-500">L{p.level}</span>
              <span className="ml-2 font-mono text-white">{p.priceFormatted}</span>
            </div>
          ))}
        </div>
        )}
      </Panel>
    </div>
  );
}
