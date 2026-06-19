"use client";

import Link from "next/link";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useAnalyticsLeaderboard } from "@/lib/hooks/useAnalytics";
import { useWalletOnChain } from "@/lib/contracts/hooks";
import { truncateAddress } from "@/lib/format";
import { fmtEther } from "@/lib/contracts/format";

export default function LeaderboardPage() {
  const board = useAnalyticsLeaderboard(50);
  const wallet = useWalletOnChain();

  if (board.isLoading || wallet.isLoading) {
    return <QueryLoading label="Loading leaderboard…" />;
  }

  const unavailable = board.isError;
  const rows = board.data ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Leaderboard</h1>
      <p className="mt-1 text-sm text-slate-400">
        Global rankings from indexed IncomePaid events
      </p>

      {unavailable && (
        <Panel className="mt-6 border-amber-500/20 bg-amber-500/5" title="Indexer unavailable">
          <p className="text-sm text-amber-200/90">
            The analytics backend is not reachable. Global rankings require a running indexer.
            Your personal earnings are shown below from on-chain data.
          </p>
          <Link href="/dashboard/income" className="mt-3 inline-block text-sm text-brand-300 hover:underline">
            View income history →
          </Link>
        </Panel>
      )}

      {!unavailable && (
        <Panel className="mt-6" title="Top earners">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">
              No indexed income yet — sync indexer after on-chain activity
            </p>
          ) : (
            rows.map((row) => (
              <div
                key={row.wallet}
                className="flex items-center justify-between border-b border-white/5 py-3 text-sm"
              >
                <span className="text-slate-400">#{row.rank}</span>
                <span className="font-mono text-white">{truncateAddress(row.wallet)}</span>
                <span className="text-emerald-400">
                  {fmtEther(BigInt(row.totalIncome.split(".")[0] ?? "0"))} mDAI
                </span>
              </div>
            ))
          )}
        </Panel>
      )}

      <Panel className="mt-4" title="Your earnings (on-chain)">
        <p className="text-2xl font-bold text-emerald-400">
          {fmtEther(wallet.data?.totalEarnings ?? 0n)} mDAI
        </p>
        <p className="mt-1 text-xs text-slate-500">Live total from LAELimitless contract</p>
      </Panel>
    </div>
  );
}
