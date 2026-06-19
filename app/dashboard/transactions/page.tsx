"use client";

import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useAnalyticsTransactions } from "@/lib/hooks/useAnalytics";
import { useUserEventsOnChain } from "@/lib/contracts/hooks";
import { txUrl } from "@/lib/contracts/addresses";
import { truncateAddress } from "@/lib/format";

export default function TransactionsPage() {
  const analytics = useAnalyticsTransactions();
  const chain = useUserEventsOnChain();

  const useApi = analytics.isSuccess && analytics.data;
  const loading = useApi ? analytics.isLoading : chain.isLoading;

  if (loading) return <QueryLoading label="Loading transactions…" />;

  const apiRows = analytics.data ?? [];
  const chainRows = chain.data ?? [];
  const rows = useApi ? apiRows : chainRows;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Transactions</h1>
      <p className="mt-1 text-sm text-slate-400">
        {rows.length} events {useApi ? "from indexer" : "from chain"}
      </p>

      <Panel className="mt-6" title="Event log">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No events yet</p>
        ) : useApi ? (
          <div className="divide-y divide-white/5">
            {apiRows.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Pill tone="brand">{e.eventName}</Pill>
                  <a
                    href={txUrl(e.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block font-mono text-xs text-brand-300 hover:underline"
                  >
                    {truncateAddress(e.txHash)}
                  </a>
                </div>
                <span className="text-xs text-slate-500">block {String(e.blockNumber)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {chainRows.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Pill tone="brand">{e.eventName}</Pill>
                  <a
                    href={txUrl(e.transactionHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block font-mono text-xs text-brand-300 hover:underline"
                  >
                    {truncateAddress(e.transactionHash)}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
