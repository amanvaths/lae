"use client";

import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useLaeUser, useLaeUserEvents } from "@/lib/lae-club/hooks";
import { txUrl } from "@/lib/lae-club/contracts";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { Loader2 } from "lucide-react";

export default function TransactionsPage() {
  const user = useLaeUser();
  const events = useLaeUserEvents();

  if (user.isLoading) {
    return <QueryLoading label="Loading profile…" />;
  }

  const rows = [...(events.data ?? [])].reverse();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Transactions</h1>
      <p className="mt-1 text-sm text-slate-400">
        User #{String(user.userId ?? "—")} · {rows.length} matrix events
      </p>

      {events.isFetching && (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          {rows.length === 0 ? "Loading events…" : "Syncing latest events…"}
        </p>
      )}

      <Panel className="mt-6" title="Event log">
        {events.isFetching && rows.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching matrix events…
          </p>
        ) : rows.length === 0 ? (
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
                  <div className="min-w-0">
                    <Pill tone="brand">{e.eventName}</Pill>
                    <a
                      href={txUrl(e.transactionHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate font-mono text-xs text-brand-300 hover:underline"
                    >
                      {truncateAddress(e.transactionHash)}
                    </a>
                  </div>
                  {typeof amount === "bigint" && (
                    <span className="text-emerald-400">+{fmtEther(amount)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
