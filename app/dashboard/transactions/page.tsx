"use client";

import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useLaeUserEvents } from "@/lib/lae-club/hooks";
import { txUrl } from "@/lib/lae-club/contracts";
import { truncateAddress } from "@/lib/format";

export default function TransactionsPage() {
  const events = useLaeUserEvents();

  if (events.isLoading) {
    return <QueryLoading label="Loading matrix events from chain…" />;
  }

  const rows = [...(events.data ?? [])].reverse();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Transactions</h1>
      <p className="mt-1 text-sm text-slate-400">
        {rows.length} BTitan matrix events for your User ID (live getContractEvents)
      </p>

      <Panel className="mt-6" title="Event log">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No events yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((e, i) => {
              const args = e.args as Record<string, unknown>;
              const amount = args.amount;
              return (
              <div
                key={`${e.transactionHash}-${e.logIndex ?? i}`}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
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
                {typeof amount === "bigint" && (
                  <span className="text-emerald-400">{String(amount)} wei</span>
                )}
              </div>
            );})}
          </div>
        )}
      </Panel>
    </div>
  );
}
