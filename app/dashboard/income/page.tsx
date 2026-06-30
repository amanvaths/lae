"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import {
  useLaeIncomeEvents,
  useLaeUser,
  useLaeAddressesForIds,
} from "@/lib/lae-club/hooks";
import { fetchLaeUserIncomeFromApi, type LaeIncomeRecord } from "@/lib/lae-club/user-api";
import { fmtEther } from "@/lib/contracts/format";
import { txUrl, addressUrl } from "@/lib/lae-club/contracts";
import { truncateAddress } from "@/lib/format";

function sumIncomeRecords(records: LaeIncomeRecord[]): bigint {
  return records.reduce((sum, r) => {
    const amountRaw = r.amount.includes(".") ? r.amount.split(".")[0] : r.amount;
    return sum + BigInt(amountRaw || "0");
  }, 0n);
}

export default function IncomePage() {
  const user = useLaeUser();
  const income = useLaeIncomeEvents();

  const enriched = useQuery({
    queryKey: ["lae-income-enriched", user.userAddress, user.userId?.toString()],
    enabled: !!user.userAddress && user.registered,
    staleTime: 60_000,
    queryFn: async () => {
      const data = await fetchLaeUserIncomeFromApi(user.userAddress!, undefined, 300);
      return data?.records ?? [];
    },
  });

  const matrixRecords = useMemo(
    () => (enriched.data ?? []).filter((r) => r.kind === "matrix"),
    [enriched.data]
  );
  const lapseRecords = useMemo(
    () => (enriched.data ?? []).filter((r) => r.kind === "lapse"),
    [enriched.data]
  );
  const clubRecords = useMemo(
    () => (enriched.data ?? []).filter((r) => r.kind === "club" || r.kind === "treasury"),
    [enriched.data]
  );

  const counterpartyIds = [
    ...matrixRecords.map((r) => r.fromUserId),
    ...lapseRecords.map((r) => r.fromUserId),
    ...clubRecords.map((r) => r.fromUserId ?? r.matrixOwnerId),
    ...matrixRecords.map((r) => r.matrixOwnerId),
    ...lapseRecords.map((r) => r.matrixOwnerId),
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

  const directMatrixFromRecords = useMemo(
    () => sumIncomeRecords(matrixRecords),
    [matrixRecords]
  );
  const lapseTotalFromRecords = useMemo(
    () => sumIncomeRecords(lapseRecords),
    [lapseRecords]
  );
  const clubTotalFromRecords = useMemo(
    () => sumIncomeRecords(clubRecords),
    [clubRecords]
  );

  const directMatrix =
    directMatrixFromRecords > 0n
      ? directMatrixFromRecords
      : user.totalIncome ?? income.totalMatrixIncome;
  const lapseTotal =
    lapseTotalFromRecords > 0n ? lapseTotalFromRecords : income.totalLapseIncome;
  const clubTotal =
    clubTotalFromRecords > 0n ? clubTotalFromRecords : income.totalRoyalIncome;
  const totalOnChain = user.totalIncome ?? directMatrix + lapseTotal + clubTotal;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Income</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        User #{String(user.userId ?? "—")} · On-chain total{" "}
        <span className="font-semibold text-[#D4AF37]">{fmtEther(totalOnChain)}</span> · Club pool{" "}
        <span className="font-semibold text-emerald-400">{fmtEther(clubTotal)}</span>
      </p>

      {(income.isLoading || enriched.isLoading) && (
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
            {matrixRecords.length || income.incomeEvents.length} direct payments
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
            {lapseRecords.length || income.lapseEvents.length} lapse events
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] sm:col-span-2 sm:p-6 lg:col-span-1">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-white sm:text-base">
            Club pool income
          </h2>
          <p className="relative mt-3 text-2xl font-bold text-emerald-400 sm:text-3xl">
            {fmtEther(clubTotal)}
          </p>
          <p className="relative mt-1 text-xs text-slate-500">{clubRecords.length} club pool events</p>
        </div>
      </div>

      <Panel className="mt-6 border-[#D4AF37]/15" title="Direct matrix income history">
        <p className="mb-3 text-xs text-slate-500">
          Each row shows board owner, level, cycle, spot, payer user ID, wallet, and amount.
        </p>
        {matrixRecords.length === 0 ? (
          <p className="text-sm text-slate-500">
            {directMatrix > 0n
              ? "Direct income is on-chain but event history is still syncing."
              : "No direct matrix income yet"}
          </p>
        ) : (
          <div className="-mt-1">
            {matrixRecords.map((row) => (
              <IncomeReportRow
                key={`tr-${row.txHash}-${row.logIndex}`}
                record={row}
                fromAddress={
                  row.fromUserId != null ? addressById.get(row.fromUserId) : undefined
                }
                boardOwnerAddress={
                  row.matrixOwnerId != null ? addressById.get(row.matrixOwnerId) : undefined
                }
                tone="gold"
                label="Direct"
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel className="mt-4 border-violet-500/20" title="Lapse income history">
        {lapseRecords.length === 0 ? (
          <p className="text-sm text-slate-500">
            No lapse income yet — credited when a downline was ineligible (need 2 directs).
          </p>
        ) : (
          <div className="-mt-1">
            {lapseRecords.map((row) => (
              <IncomeReportRow
                key={`lp-${row.txHash}-${row.logIndex}`}
                record={row}
                fromAddress={
                  row.fromUserId != null ? addressById.get(row.fromUserId) : undefined
                }
                boardOwnerAddress={
                  row.matrixOwnerId != null ? addressById.get(row.matrixOwnerId) : undefined
                }
                tone="violet"
                label="Lapse"
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel className="mt-4 border-emerald-500/15" title="Club pool income history">
        {clubRecords.length === 0 ? (
          <p className="text-sm text-slate-500">No club pool events yet</p>
        ) : (
          <div className="-mt-1">
            {clubRecords.map((row) => (
              <IncomeReportRow
                key={`cp-${row.txHash}-${row.logIndex}`}
                record={row}
                fromAddress={
                  row.fromUserId != null
                    ? addressById.get(row.fromUserId)
                    : row.matrixOwnerId != null
                      ? addressById.get(row.matrixOwnerId)
                      : undefined
                }
                boardOwnerAddress={
                  row.matrixOwnerId != null ? addressById.get(row.matrixOwnerId) : undefined
                }
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

function spotPaymentLabel(spot: number | null | undefined, cycleId: number | null | undefined): string | null {
  if (spot == null) return null;
  if (spot === 14) return "Slot 14 · Recycle → upline next cycle";
  if (spot === 5 && cycleId === 1) return "Slot 5 · 2× upgrade release";
  if (spot === 4 && cycleId === 1) return "Slot 4 · Upgrade hold (½)";
  if (spot === 5) return "Slot 5 · Board owner";
  return `Slot ${spot}`;
}

function IncomeReportRow({
  record,
  fromAddress,
  boardOwnerAddress,
  tone,
  label,
}: {
  record: LaeIncomeRecord;
  fromAddress?: string;
  boardOwnerAddress?: string;
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

  const amountRaw = record.amount.includes(".") ? record.amount.split(".")[0] : record.amount;
  const amount = BigInt(amountRaw || "0");

  const hasBoard =
    record.matrixOwnerId != null &&
    record.boardLevel != null &&
    record.cycleId != null &&
    record.position != null;

  const spotLabel = spotPaymentLabel(record.position, record.cycleId);

  return (
    <div className="flex flex-col gap-2 border-b border-white/[0.06] py-3.5 text-sm transition-colors hover:bg-white/[0.02] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge}`}
          >
            {label}
          </span>
          {record.boardLevel != null && (
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge}`}
            >
              Board L{record.boardLevel}
            </span>
          )}
          {spotLabel && (
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge}`}
            >
              {spotLabel}
            </span>
          )}
        </div>

        {hasBoard ? (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Board</p>
            <p className="font-semibold text-white">
              Owner{" "}
              <span className={accent}>#{record.matrixOwnerId}</span>
              {" · "}
              L{record.boardLevel}
              {" · "}
              Cycle {record.cycleId}
              {" · "}
              Spot {record.position}
            </p>
            {boardOwnerAddress ? (
              <a
                href={addressUrl(boardOwnerAddress)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-slate-400 hover:text-[#D4AF37] hover:underline"
                title={boardOwnerAddress}
              >
                {truncateAddress(boardOwnerAddress, 6, 4)}
              </a>
            ) : (
              <p className="font-mono text-[11px] text-slate-600">board wallet resolving…</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Board context syncing…</p>
        )}

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">From user</p>
          <p className="font-semibold text-white">
            ID <span className={accent}>#{record.fromUserId ?? "—"}</span>
          </p>
          {fromAddress ? (
            <a
              href={addressUrl(fromAddress)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-slate-400 hover:text-[#D4AF37] hover:underline"
              title={fromAddress}
            >
              {truncateAddress(fromAddress, 6, 4)}
            </a>
          ) : (
            <p className="font-mono text-[11px] text-slate-600">wallet resolving…</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
        <span
          className={`font-semibold ${
            tone === "gold"
              ? "text-gradient-gold"
              : tone === "violet"
                ? "text-violet-300"
                : "text-emerald-400"
          }`}
        >
          +{fmtEther(amount)}
        </span>
        <a
          href={txUrl(record.txHash)}
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
