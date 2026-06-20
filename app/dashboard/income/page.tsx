"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useLaeIncomeEvents, useLaeUser } from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { txUrl } from "@/lib/lae-club/contracts";
import { truncateAddress } from "@/lib/format";

type IncomeEventRow = {
  transactionHash: string;
  args: { level?: unknown; fromId?: unknown; amount?: bigint };
};

export default function IncomePage() {
  const user = useLaeUser();
  const income = useLaeIncomeEvents();

  if (user.isLoading) {
    return <QueryLoading label="Loading income from chain…" />;
  }

  if (user.isError) {
    return (
      <Panel title="Income">
        <p className="text-sm text-red-300">
          Could not read your on-chain profile — check wallet connection and BSC Testnet.
        </p>
      </Panel>
    );
  }

  if (!user.registered) {
    return (
      <Panel title="Income">
        <p className="text-sm text-slate-400">User not registered on LAE Club Matrix.</p>
      </Panel>
    );
  }

  const total = user.totalIncome ?? income.totalMatrixIncome ?? 0n;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Income</h1>
      <p className="mt-1 text-sm text-slate-400">
        User #{String(user.userId ?? "—")} · On-chain total {fmtEther(total)} · Royal{" "}
        {fmtEther(income.totalRoyalIncome)}
      </p>

      {income.isLoading && (
        <p className="mt-2 text-xs text-slate-500">Loading event history…</p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Panel title="Matrix income (on-chain total)">
          <p className="text-2xl font-bold text-emerald-400">{fmtEther(total)}</p>
          <p className="text-xs text-slate-500">
            {income.incomeEvents.length} TokenReceived events
            {income.incomeEvents.length === 0 && total > 0n ? " · total from getUserDetails" : ""}
          </p>
        </Panel>
        <Panel title="Club pool income">
          <p className="text-2xl font-bold text-brand-300">
            {fmtEther(income.totalRoyalIncome)}
          </p>
          <p className="text-xs text-slate-500">{income.royalEvents.length} ClubPoolPayment events</p>
        </Panel>
      </div>

      <Panel className="mt-6" title="Matrix income history">
        {income.incomeEvents.length === 0 ? (
          <p className="text-sm text-slate-500">
            {total > 0n
              ? "Income is recorded on-chain but event history is still syncing — total shown above is live from contract."
              : "No TokenReceived events yet"}
          </p>
        ) : (
          [...(income.incomeEvents as IncomeEventRow[])].reverse().map((e, i) => {
            const args = e.args;
            return (
              <div
                key={`${e.transactionHash}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-3 text-sm"
              >
                <div>
                  <span className="text-slate-300">L{String(args.level)}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    from #{String(args.fromId ?? "—")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">+{fmtEther(args.amount ?? 0n)}</span>
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
            );
          })
        )}
      </Panel>
    </div>
  );
}
