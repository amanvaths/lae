"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading, QueryError } from "@/components/dashboard/QueryState";
import { useAnalyticsIncome } from "@/lib/hooks/useAnalytics";
import { useUserEventsOnChain, useWalletOnChain } from "@/lib/contracts/hooks";
import { fmtEther, parseApiWei } from "@/lib/contracts/format";
import { txUrl } from "@/lib/contracts/addresses";
import { truncateAddress } from "@/lib/format";

const INCOME_TYPES: Record<number, string> = {
  0: "Direct",
  1: "Cycle",
  2: "Rebirth",
  3: "Upgrade",
  4: "Pilot Incentive",
  5: "Sponsor Payment",
  6: "First Line Bonus",
  7: "Token Welcome",
  8: "Token Direct",
  9: "Withdraw",
};

export default function IncomePage() {
  const analytics = useAnalyticsIncome();
  const events = useUserEventsOnChain();
  const wallet = useWalletOnChain();

  const useApi = analytics.isSuccess && analytics.data;
  const loading = useApi ? analytics.isLoading : events.isLoading || wallet.isLoading;

  if (loading) return <QueryLoading label="Loading income…" />;

  if (analytics.isError && events.isError) {
    return (
      <QueryError
        message="Could not load income (API or chain)"
        onRetry={() => {
          analytics.refetch();
          events.refetch();
        }}
      />
    );
  }

  const total = useApi
    ? analytics.data!.reduce((s, r) => s + parseApiWei(r.amount), 0n)
    : wallet.data?.totalEarnings ?? 0n;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Income</h1>
      <p className="mt-1 text-sm text-slate-400">
        Total DAI earned: {fmtEther(total)}
        {useApi && <span className="ml-2 text-xs text-brand-300">· indexed</span>}
      </p>

      <Panel className="mt-6" title="Income history">
        {useApi ? (
          analytics.data!.length === 0 ? (
            <p className="text-sm text-slate-500">No income yet</p>
          ) : (
            analytics.data!.map((row) => (
              <div key={row.id} className="flex justify-between border-b border-white/5 py-3 text-sm">
                <span className="text-slate-300">
                  {INCOME_TYPES[row.incomeType] ?? `Type ${row.incomeType}`} · L{row.level}
                </span>
                <span className="text-emerald-400">+{fmtEther(parseApiWei(row.amount))}</span>
              </div>
            ))
          )
        ) : (
          (events.data ?? [])
            .filter((e) => e.eventName === "IncomePaid")
            .map((e) => (
              <div key={e.id} className="flex justify-between border-b border-white/5 py-3 text-sm">
                <span className="text-slate-300">
                  {INCOME_TYPES[Number(e.args.incomeType)] ?? `Type ${e.args.incomeType}`} · L
                  {String(e.args.level)}
                </span>
                <span className="text-emerald-400">
                  +{fmtEther(BigInt(String(e.args.amount ?? 0)))}
                </span>
              </div>
            ))
        )}
      </Panel>

      {!useApi && (
        <Panel className="mt-4" title="LAE TokenReward (live chain)">
          {(events.data ?? []).filter((e) => e.eventName === "TokenReward").length === 0 ? (
            <p className="text-sm text-slate-500">No LAE rewards yet</p>
          ) : (
            (events.data ?? [])
              .filter((e) => e.eventName === "TokenReward")
              .map((e) => (
                <div key={e.id} className="flex justify-between border-b border-white/5 py-3 text-sm">
                  <a href={txUrl(e.transactionHash)} className="text-brand-300 hover:underline">
                    {truncateAddress(e.transactionHash)}
                  </a>
                  <span className="text-brand-200">
                    +{fmtEther(BigInt(String(e.args.laeAmount ?? e.args.sltAmount ?? 0)), 0)} LAE
                  </span>
                </div>
              ))
          )}
        </Panel>
      )}
    </div>
  );
}
