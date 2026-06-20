"use client";

import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useLaeIncomeEvents, useLaeUserEvents } from "@/lib/lae-club/hooks";
import { txUrl } from "@/lib/lae-club/contracts";
import { truncateAddress } from "@/lib/format";

export default function RecyclePage() {
  const events = useLaeUserEvents();
  const income = useLaeIncomeEvents();

  if (events.isLoading) {
    return <QueryLoading label="Loading Reinvest events from chain…" />;
  }

  const reinvests = income.reinvestEvents;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Recycle / Reinvest</h1>
      <p className="mt-1 text-sm text-slate-400">
        {reinvests.length} on-chain Reinvest events (BTitan matrix recycles)
      </p>

      <Panel className="mt-6" title="Reinvest history">
        {reinvests.length === 0 ? (
          <p className="text-sm text-slate-500">No reinvests yet</p>
        ) : (
          [...reinvests].reverse().map((e, i) => (
            <div key={`${e.transactionHash}-${i}`} className="border-b border-white/5 py-3 text-sm">
              <Pill tone="violet">Reinvest</Pill>
              <p className="mt-1 text-white">
                Level {String(e.args.level)} · new referrer #{String(e.args.newReferrerId ?? "—")}
              </p>
              <a
                href={txUrl(e.transactionHash)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-300 hover:underline"
              >
                {truncateAddress(e.transactionHash)}
              </a>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}
