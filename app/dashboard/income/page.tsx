"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useLaeIncomeEvents, useLaeUser } from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { txUrl } from "@/lib/lae-club/contracts";
import { truncateAddress } from "@/lib/format";

export default function IncomePage() {
  const user = useLaeUser();
  const income = useLaeIncomeEvents();

  if (user.isLoading || income.isLoading) {
    return <QueryLoading label="Loading income from chain…" />;
  }

  const total = income.totalMatrixIncome || user.totalIncome || 0n;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Income</h1>
      <p className="mt-1 text-sm text-slate-400">
        User #{String(user.userId ?? "—")} · Matrix income {fmtEther(total)} · Royal{" "}
        {fmtEther(income.totalRoyalIncome)}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Panel title="Matrix income (TokenReceived)">
          <p className="text-2xl font-bold text-emerald-400">
            {fmtEther(income.totalMatrixIncome || user.totalIncome || 0n)}
          </p>
          <p className="text-xs text-slate-500">{income.incomeEvents.length} events</p>
        </Panel>
        <Panel title="Royal income (TreasuryPool)">
          <p className="text-2xl font-bold text-brand-300">
            {fmtEther(income.totalRoyalIncome)}
          </p>
          <p className="text-xs text-slate-500">{income.royalEvents.length} events</p>
        </Panel>
      </div>

      <Panel className="mt-6" title="Matrix income history">
        {income.incomeEvents.length === 0 ? (
          <p className="text-sm text-slate-500">No TokenReceived events yet</p>
        ) : (
          [...income.incomeEvents].reverse().map((e, i) => (
            <div
              key={`${e.transactionHash}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-3 text-sm"
            >
              <div>
                <span className="text-slate-300">L{String(e.args.level)}</span>
                <span className="ml-2 text-xs text-slate-500">
                  from #{String(e.args.fromId ?? "—")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400">
                  +{fmtEther((e.args.amount as bigint) ?? 0n)}
                </span>
                <a
                  href={txUrl(e.transactionHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-300 hover:underline"
                >
                  {truncateAddress(e.transactionHash)}
                </a>
              </div>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}
