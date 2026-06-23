"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import {
  useLaeIncomeEvents,
  useLaeUser,
  useLaeAddressesForIds,
} from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { txUrl, addressUrl } from "@/lib/lae-club/contracts";
import { truncateAddress } from "@/lib/format";

type IncomeRow = {
  transactionHash: string;
  blockNumber?: bigint;
  args: { level?: unknown; fromId?: unknown; userId?: unknown; amount?: bigint };
};

export default function IncomePage() {
  const user = useLaeUser();
  const income = useLaeIncomeEvents();

  const matrixRows = [...(income.incomeEvents as IncomeRow[])].reverse();
  const royalRows = [...(income.royalEvents as IncomeRow[])].reverse();

  // Resolve every counterparty id (TokenReceived.fromId, ClubPoolPayment.userId)
  // to its wallet address so each report shows both #id and the real wallet.
  const counterpartyIds = [
    ...matrixRows.map((e) => e.args.fromId),
    ...royalRows.map((e) => e.args.userId),
  ].map((v) => (v == null ? undefined : Number(v)));
  const { addressById } = useLaeAddressesForIds(counterpartyIds);

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
            {matrixRows.length} TokenReceived events
            {matrixRows.length === 0 && total > 0n ? " · total from getUserDetails" : ""}
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-white sm:text-base">Club pool income</h2>
          <p className="relative mt-3 text-2xl font-bold text-emerald-400 sm:text-3xl">
            {fmtEther(income.totalRoyalIncome)}
          </p>
          <p className="relative mt-1 text-xs text-slate-500">{royalRows.length} ClubPoolPayment events</p>
        </div>
      </div>

      <Panel className="mt-6 border-[#D4AF37]/15" title="Matrix income history">
        {matrixRows.length === 0 ? (
          <p className="text-sm text-slate-500">
            {total > 0n
              ? "Income is recorded on-chain but event history is still syncing — total shown above is live from contract."
              : "No TokenReceived events yet"}
          </p>
        ) : (
          <div className="-mt-1">
            {matrixRows.map((e, i) => (
              <IncomeReportRow
                key={`tr-${e.transactionHash}-${i}`}
                level={e.args.level}
                fromId={e.args.fromId}
                fromAddress={
                  e.args.fromId != null
                    ? addressById.get(Number(e.args.fromId))
                    : undefined
                }
                amount={e.args.amount}
                transactionHash={e.transactionHash}
                tone="gold"
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel className="mt-4 border-emerald-500/15" title="Club pool income history">
        {royalRows.length === 0 ? (
          <p className="text-sm text-slate-500">No ClubPoolPayment events yet</p>
        ) : (
          <div className="-mt-1">
            {royalRows.map((e, i) => (
              <IncomeReportRow
                key={`cp-${e.transactionHash}-${i}`}
                level={e.args.level}
                fromId={e.args.userId}
                fromAddress={
                  e.args.userId != null
                    ? addressById.get(Number(e.args.userId))
                    : undefined
                }
                amount={e.args.amount}
                transactionHash={e.transactionHash}
                tone="emerald"
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function IncomeReportRow({
  level,
  fromId,
  fromAddress,
  amount,
  transactionHash,
  tone,
}: {
  level: unknown;
  fromId: unknown;
  fromAddress?: string;
  amount?: bigint;
  transactionHash: string;
  tone: "gold" | "emerald";
}) {
  const accent = tone === "gold" ? "text-[#D4AF37]" : "text-emerald-400";
  const badge =
    tone === "gold"
      ? "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"
      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] py-3.5 text-sm transition-colors hover:bg-white/[0.02]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge}`}>
          L{String(level ?? "—")}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-white">
            from <span className={accent}>#{String(fromId ?? "—")}</span>
          </p>
          {fromAddress ? (
            <a
              href={addressUrl(fromAddress)}
              target="_blank"
              rel="noreferrer"
              className="block truncate font-mono text-[11px] text-slate-400 hover:text-[#D4AF37] hover:underline"
              title={fromAddress}
            >
              {truncateAddress(fromAddress, 6, 4)}
            </a>
          ) : (
            <p className="font-mono text-[11px] text-slate-600">resolving wallet…</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`font-semibold ${tone === "gold" ? "text-gradient-gold" : "text-emerald-400"}`}>
          +{fmtEther(amount ?? 0n)}
        </span>
        <a
          href={txUrl(transactionHash)}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-slate-400 transition-colors hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
          title="View transaction"
        >
          tx ↗
        </a>
      </div>
    </div>
  );
}
