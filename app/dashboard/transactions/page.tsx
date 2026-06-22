"use client";

import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useLaeUser, useLaeUserEvents } from "@/lib/lae-club/hooks";
import { sortEventsNewestFirst } from "@/lib/lae-club/event-utils";
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

  const rows = sortEventsNewestFirst(events.data ?? []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Transactions</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        User #{String(user.userId ?? "—")} ·{" "}
        <span className="font-semibold text-[#D4AF37]">{rows.length}</span> matrix events
      </p>

      {events.isFetching && (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          {rows.length === 0 ? "Loading events…" : "Syncing latest events…"}
        </p>
      )}

      <Panel className="mt-6 border-[#D4AF37]/15" title="Event log">
        {events.isFetching && rows.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching matrix events…
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No events yet</p>
        ) : (
          <div className="divide-y divide-[#D4AF37]/10">
            {rows.map((e, i) => {
              const args = e.args as Record<string, unknown>;
              const amount = args.amount;
              return (
                <div
                  key={`${e.transactionHash}-${e.logIndex ?? i}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3.5 text-sm transition-colors hover:bg-[#D4AF37]/[0.03]"
                >
                  <div className="min-w-0">
                    <span className="inline-flex items-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-medium text-[#D4AF37]">
                      {e.eventName}
                    </span>
                    <a
                      href={txUrl(e.transactionHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate font-mono text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors hover:underline"
                    >
                      {truncateAddress(e.transactionHash)}
                    </a>
                  </div>
                  {typeof amount === "bigint" && (
                    <span className="font-semibold text-emerald-400">+{fmtEther(amount)}</span>
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
