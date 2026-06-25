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
  args: {
    level?: unknown;
    fromId?: unknown;
    receiverId?: unknown;
    userId?: unknown;
    amount?: bigint;
  };
};

export default function IncomePage() {
  const user = useLaeUser();
  const income = useLaeIncomeEvents();

  const matrixRows = [...(income.incomeEvents as IncomeRow[])].reverse();
  const lapseRows = [...(income.lapseEvents as IncomeRow[])].reverse();
  const royalRows = [...(income.royalEvents as IncomeRow[])].reverse();

  const counterpartyIds = [
    ...matrixRows.map((e) => e.args.fromId),
    ...lapseRows.map((e) => e.args.fromId),
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

  const totalOnChain = user.totalIncome ?? directMatrix + lapseTotal;
  const directMatrix = income.totalMatrixIncome;
  const lapseTotal = income.totalLapseIncome;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Income</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        User #{String(user.userId ?? "—")} · On-chain total{" "}
        <span className="font-semibold text-[#D4AF37]">{fmtEther(totalOnChain)}</span> · Club pool{" "}
        <span className="font-semibold text-emerald-400">{fmtEther(income.totalRoyalIncome)}</span>
      </p>

      {income.isLoading && (
        <p className="mt-2 text-xs text-slate-500">Loading event history…</p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-[#D4AF37]/40 hover:shadow-glow-gold sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#D4AF37]/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-white sm:text-base">
            Direct matrix income
          </h2>
          <p className="relative mt-3 text-2xl font-bold text-gradient-gold sm:text-3xl">
            {fmtEther(directMatrix)}
          </p>
          <p className="relative mt-1 text-xs text-slate-500">
            {matrixRows.length} direct TokenReceived events
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-violet-500/25 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-violet-500/45 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.35)] sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-white sm:text-base">
            Lapse income
          </h2>
          <p className="relative mt-3 text-2xl font-bold text-violet-300 sm:text-3xl">
            {fmtEther(lapseTotal)}
          </p>
          <p className="relative mt-1 text-xs text-slate-500">
            {lapseRows.length} lapse events · credited when downline was ineligible
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] sm:p-6 sm:col-span-2 lg:col-span-1">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-white sm:text-base">
            Club pool income
          </h2>
          <p className="relative mt-3 text-2xl font-bold text-emerald-400 sm:text-3xl">
            {fmtEther(income.totalRoyalIncome)}
          </p>
          <p className="relative mt-1 text-xs text-slate-500">{royalRows.length} TreasuryPool events</p>
        </div>
      </div>

      <Panel className="mt-6 border-[#D4AF37]/15" title="Direct matrix income history">
        {matrixRows.length === 0 ? (
          <p className="text-sm text-slate-500">
            {directMatrix > 0n
              ? "Direct income is on-chain but event history is still syncing."
              : "No direct matrix income yet"}
          </p>
        ) : (
          <div className="-mt-1">
            {matrixRows.map((e, i) => (
              <IncomeReportRow
                key={`tr-${e.transactionHash}-${i}`}
                level={e.args.level}
                fromId={e.args.fromId}
                fromAddress={
                  e.args.fromId != null ? addressById.get(Number(e.args.fromId)) : undefined
                }
                amount={e.args.amount}
                transactionHash={e.transactionHash}
                tone="gold"
                label="Direct"
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel className="mt-4 border-violet-500/20" title="Lapse income history">
        {lapseRows.length === 0 ? (
          <p className="text-sm text-slate-500">
            No lapse income yet — shown when a downline&apos;s payment lapses to you because they
            were not eligible (need 2 directs).
          </p>
        ) : (
          <div className="-mt-1">
            {lapseRows.map((e, i) => (
              <IncomeReportRow
                key={`lp-${e.transactionHash}-${i}`}
                level={e.args.level}
                fromId={e.args.fromId}
                fromAddress={
                  e.args.fromId != null ? addressById.get(Number(e.args.fromId)) : undefined
                }
                amount={e.args.amount}
                transactionHash={e.transactionHash}
                tone="violet"
                label="Lapse"
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel className="mt-4 border-emerald-500/15" title="Club pool income history">
        {royalRows.length === 0 ? (
          <p className="text-sm text-slate-500">No TreasuryPool events yet</p>
        ) : (
          <div className="-mt-1">
            {royalRows.map((e, i) => (
              <IncomeReportRow
                key={`cp-${e.transactionHash}-${i}`}
                level={e.args.level}
                fromId={e.args.userId}
                fromAddress={
                  e.args.userId != null ? addressById.get(Number(e.args.userId)) : undefined
                }
                amount={e.args.amount}
                transactionHash={e.transactionHash}
                tone="emerald"
                label="Club"
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
  label,
}: {
  level: unknown;
  fromId: unknown;
  fromAddress?: string;
  amount?: bigint;
  transactionHash: string;
  tone: "gold" | "violet" | "emerald";
  label: string;
}) {
  const accent =
    tone === "gold" ? "text-[#D4AF37]" : tone === "violet" ? "text-violet-300" : "text-emerald-400";
  const badge =
    tone === "gold"
      ? "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"
      : tone === "violet"
        ? "border-violet-500/25 bg-violet-500/10 text-violet-300"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] py-3.5 text-sm transition-colors hover:bg-white/[0.02]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge}`}>
          {label}
        </span>
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
        <span
          className={`font-semibold ${
            tone === "gold"
              ? "text-gradient-gold"
              : tone === "violet"
                ? "text-violet-300"
                : "text-emerald-400"
          }`}
        >
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
