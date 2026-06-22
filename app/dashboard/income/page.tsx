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
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Income</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        User #{String(user.userId ?? "—")} · On-chain total{" "}
        <span className="font-semibold text-[#D4AF37]">{fmtEther(total)}</span> · Royal{" "}
        <span className="font-semibold text-[#D4AF37]">{fmtEther(income.totalRoyalIncome)}</span>
      </p>

      {income.isLoading && (
        <p className="mt-2 text-xs text-slate-500">Loading event history…</p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-[#D4AF37]/40 hover:shadow-glow-gold sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#D4AF37]/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-white sm:text-base">Matrix income (on-chain total)</h2>
          <p className="relative mt-3 text-2xl font-bold text-gradient-gold sm:text-3xl">{fmtEther(total)}</p>
          <p className="relative mt-1 text-xs text-slate-500">
            {income.incomeEvents.length} TokenReceived events
            {income.incomeEvents.length === 0 && total > 0n ? " · total from getUserDetails" : ""}
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-white sm:text-base">Club pool income</h2>
          <p className="relative mt-3 text-2xl font-bold text-emerald-400 sm:text-3xl">
            {fmtEther(income.totalRoyalIncome)}
          </p>
          <p className="relative mt-1 text-xs text-slate-500">{income.royalEvents.length} ClubPoolPayment events</p>
        </div>
      </div>

      <Panel className="mt-6 border-[#D4AF37]/15" title="Matrix income history">
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
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4AF37]/10 py-3.5 text-sm transition-colors hover:bg-[#D4AF37]/[0.03]"
              >
                <div>
                  <span className="inline-flex items-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-medium text-[#D4AF37]">
                    L{String(args.level)}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    from #{String(args.fromId ?? "—")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gradient-gold">+{fmtEther(args.amount ?? 0n)}</span>
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
            );
          })
        )}
      </Panel>
    </div>
  );
}
