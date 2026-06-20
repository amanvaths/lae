"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import {
  useLaeIncomeEvents,
  useLaeRoyalPoolBalance,
  useLaeUser,
} from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { addressUrl, txUrl } from "@/lib/lae-club/contracts";
import { truncateAddress } from "@/lib/format";

export default function RoyalPoolPage() {
  const user = useLaeUser();
  const pool = useLaeRoyalPoolBalance();
  const income = useLaeIncomeEvents();

  if (user.isLoading || pool.isLoading || income.isLoading) {
    return <QueryLoading label="Loading royal pool data…" />;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Royal Pool</h1>
      <p className="mt-1 text-sm text-slate-400">
        TreasuryPool events · pool balance from live ERC20 read
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Panel title="Your royal income">
          <p className="text-2xl font-bold text-brand-300">
            {fmtEther(income.totalRoyalIncome)}
          </p>
          <p className="text-xs text-slate-500">{income.royalEvents.length} TreasuryPool events</p>
        </Panel>
        <Panel title="Pool contract balance">
          <p className="text-2xl font-bold text-white">{fmtEther(pool.balance)}</p>
          {pool.poolAddress && pool.poolAddress !== "0x0000000000000000000000000000000000000000" ? (
            <a
              href={addressUrl(pool.poolAddress)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all font-mono text-xs text-brand-300 hover:underline"
            >
              {truncateAddress(pool.poolAddress)}
            </a>
          ) : (
            <p className="text-xs text-slate-500">Pool address from matrix contract</p>
          )}
        </Panel>
        <Panel title="Matrix income (comparison)">
          <p className="text-2xl font-bold text-emerald-400">
            {fmtEther(income.totalMatrixIncome || user.totalIncome || 0n)}
          </p>
        </Panel>
      </div>

      <Panel className="mt-6" title="Your TreasuryPool history">
        {income.royalEvents.length === 0 ? (
          <p className="text-sm text-slate-500">No royal pool income yet</p>
        ) : (
          [...income.royalEvents].reverse().map((e, i) => (
            <div
              key={`${e.transactionHash}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-3 text-sm"
            >
              <span className="text-slate-300">
                L{String(e.args.level)} · user #{String(e.args.userId ?? "—")}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-brand-300">
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
