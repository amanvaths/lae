"use client";

import { useMemo, useState } from "react";
import { Search, Download, Loader2, ReceiptText, TrendingUp, LayoutGrid, RefreshCw } from "lucide-react";
import { Panel, StatCard } from "@/components/dashboard/ui";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useLaeUser, useLaeUserEvents } from "@/lib/lae-club/hooks";
import { sortEventsNewestFirst } from "@/lib/lae-club/event-utils";
import {
  describeMatrixEvent,
  CATEGORY_STYLE,
  type EventCategory,
} from "@/lib/lae-club/event-format";
import { fmtEther } from "@/lib/contracts/format";
import { formatEther } from "viem";
import { cn } from "@/lib/utils";

type FilterKey = "all" | EventCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "placement", label: "Placements" },
  { key: "recycle", label: "Recycles" },
  { key: "upgrade", label: "Upgrades" },
  { key: "treasury", label: "Treasury" },
  { key: "registration", label: "Registration" },
  { key: "missed", label: "Missed" },
];

function toCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => escape(r[h])).join(","));
  return lines.join("\n");
}

export default function TransactionsPage() {
  const user = useLaeUser();
  const events = useLaeUserEvents();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");

  const all = useMemo(
    () => sortEventsNewestFirst(events.data ?? []).map((e) => ({ raw: e, view: describeMatrixEvent(e) })),
    [events.data]
  );

  const summary = useMemo(() => {
    let income = 0n;
    let placements = 0;
    let recycles = 0;
    const counts: Record<string, number> = {};
    for (const { view } of all) {
      counts[view.category] = (counts[view.category] ?? 0) + 1;
      if (view.isCredit && view.amount) income += view.amount;
      if (view.category === "placement") placements += 1;
      if (view.category === "recycle") recycles += 1;
    }
    return { income, placements, recycles, counts };
  }, [all]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter(({ view }) => {
      if (filter !== "all" && view.category !== filter) return false;
      if (!needle) return true;
      const hay = [
        view.label,
        view.description,
        view.txHash,
        view.chips.join(" "),
        view.fromId != null ? `#${view.fromId}` : "",
        view.toId != null ? `#${view.toId}` : "",
        view.boardOwnerId != null ? `#${view.boardOwnerId}` : "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [all, filter, q]);

  function exportCsv() {
    const rows = filtered.map(({ view }) => ({
      Event: view.label,
      Category: view.category,
      Level: view.level != null ? String(view.level) : "",
      Cycle: view.cycle != null ? String(view.cycle) : "",
      Slot: view.slot != null ? String(view.slot) : "",
      From: view.fromId != null ? String(view.fromId) : "",
      Receiver: view.toId != null ? String(view.toId) : "",
      Board: view.boardOwnerId != null ? String(view.boardOwnerId) : "",
      Amount: view.amount != null ? formatEther(view.amount) : "",
      Block: view.blockNumber != null ? view.blockNumber.toString() : "",
      TxHash: view.txHash,
    }));
    const csv = toCsv(rows);
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lae-transactions-user-${String(user.userId ?? "x")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (user.isLoading) {
    return <QueryLoading label="Loading profile…" />;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Transactions</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            User #{String(user.userId ?? "—")} ·{" "}
            <span className="font-semibold text-[#D4AF37]">{all.length}</span> on-chain events
            {events.isFetching && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                syncing…
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2.5 text-sm font-semibold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Events" value={all.length} icon={ReceiptText} accent="brand" />
        <StatCard
          label="Income Received"
          value={<span className="text-emerald-400">{fmtEther(summary.income)}</span>}
          sub="credited to this user"
          icon={TrendingUp}
          accent="emerald"
        />
        <StatCard label="Placements" value={summary.placements} icon={LayoutGrid} accent="gold" />
        <StatCard label="Recycles" value={summary.recycles} icon={RefreshCw} accent="brand" />
      </div>

      {/* Controls */}
      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? all.length : summary.counts[f.key] ?? 0;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37]"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    active ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-white/5 text-slate-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tx, user #, level…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-[#D4AF37]/40"
          />
        </div>
      </div>

      <Panel className="mt-4 border-[#D4AF37]/15" title="Event log">
        {events.isFetching && all.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching matrix events…
          </p>
        ) : (
          <ActivityFeed
            events={filtered.map((f) => f.raw)}
            emptyLabel={q || filter !== "all" ? "No events match your filters" : "No events yet"}
          />
        )}
      </Panel>
    </div>
  );
}
