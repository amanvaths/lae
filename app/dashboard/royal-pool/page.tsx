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
import { Crown, Loader2 } from "lucide-react";

export default function RoyalPoolPage() {
  const user = useLaeUser();
  const pool = useLaeRoyalPoolBalance();
  const income = useLaeIncomeEvents();

  if (user.isLoading || pool.isLoading) {
    return <QueryLoading label="Loading royal pool…" />;
  }

  const royalTotal =
    income.totalRoyalIncome > 0n
      ? income.totalRoyalIncome
      : 0n;
  const matrixTotal = user.totalIncome ?? income.totalMatrixIncome ?? 0n;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_20px_-4px_rgba(212,175,55,0.4)]">
          <Crown className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Royal Pool</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            TreasuryPool events · pool balance from live ERC20 read
          </p>
        </div>
      </div>

      {income.isFetching && (
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Syncing event history…
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-[#D4AF37]/40 hover:shadow-glow-gold sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#D4AF37]/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-[#D4AF37]/70 uppercase tracking-wider">Your royal income</h2>
          <p className="relative mt-3 text-2xl font-bold text-gradient-gold sm:text-3xl">{fmtEther(royalTotal)}</p>
          <p className="relative mt-1 text-xs text-slate-500">
            {income.royalEvents.length} TreasuryPool events
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[#C0C0C0]/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-[#C0C0C0]/40 hover:shadow-[0_0_40px_-10px_rgba(192,192,192,0.2)] sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#C0C0C0]/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-[#C0C0C0]/70 uppercase tracking-wider">Pool contract balance</h2>
          <p className="relative mt-3 text-2xl font-bold text-white sm:text-3xl">{fmtEther(pool.balance)}</p>
          {pool.poolAddress && pool.poolAddress !== "0x0000000000000000000000000000000000000000" ? (
            <a
              href={addressUrl(pool.poolAddress)}
              target="_blank"
              rel="noreferrer"
              className="relative mt-1 block break-all font-mono text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors hover:underline"
            >
              {truncateAddress(pool.poolAddress)}
            </a>
          ) : (
            <p className="relative text-xs text-slate-500">Pool address from matrix contract</p>
          )}
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-emerald-400/70 uppercase tracking-wider">Matrix income</h2>
          <p className="relative mt-3 text-2xl font-bold text-emerald-400 sm:text-3xl">{fmtEther(matrixTotal)}</p>
          <p className="relative mt-1 text-xs text-slate-500">On-chain total from getUserDetails</p>
        </div>
      </div>

      <Panel className="mt-6 border-[#D4AF37]/15" title="Your TreasuryPool history">
        {income.isFetching && income.royalEvents.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading events…
          </p>
        ) : income.royalEvents.length === 0 ? (
          <p className="text-sm text-slate-500">No royal pool income yet</p>
        ) : (
          [...income.royalEvents].reverse().map((e, i) => (
            <div
              key={`${e.transactionHash}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4AF37]/10 py-3.5 text-sm transition-colors hover:bg-[#D4AF37]/[0.03]"
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-medium text-[#D4AF37]">
                  L{String(e.args.level)}
                </span>
                <span className="text-xs text-slate-500">user #{String(e.args.userId ?? "—")}</span>
              </span>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gradient-gold">
                  +{fmtEther((e.args.amount as bigint) ?? 0n)}
                </span>
                <a
                  href={txUrl(e.transactionHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors hover:underline"
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
