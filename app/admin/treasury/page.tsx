"use client";

import { useEffect, useMemo, useState } from "react";
import { Vault, Landmark, Droplets, TrendingUp, Coins, Download, ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel, StatCard, Pill } from "@/components/dashboard/ui";
import { QueryError, QueryLoading } from "@/components/dashboard/QueryState";
import {
  fetchLaeAdminIncome,
  fetchLaeAdminSettings,
  type LaeIndexedIncome,
} from "@/lib/lae-club/admin-api";
import { fmtEther, incomeStringToWei } from "@/lib/contracts/format";
import { formatEther } from "viem";
import { useLaeCoinStats, useLaeRoyalPoolBalance } from "@/lib/lae-club/hooks";
import { LAE_CONTRACTS, addressUrl, txUrl } from "@/lib/lae-club/contracts";
import { truncateAddress, formatDate } from "@/lib/format";

function sinceMs(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function toCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export default function AdminTreasuryPage() {
  const coin = useLaeCoinStats();
  const treasuryBal = useLaeRoyalPoolBalance(coin.treasuryWallet);
  const liquidityBal = useLaeRoyalPoolBalance(coin.liquidityWallet);
  const contractBal = useLaeRoyalPoolBalance(LAE_CONTRACTS.matrix);

  const [rows, setRows] = useState<LaeIndexedIncome[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<string | null>(null);
  const [settings, setSettings] = useState<{
    treasury?: string;
    liquidity?: string;
    contract?: string;
  }>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [incomeRes, settingsRes] = await Promise.all([
        fetchLaeAdminIncome("treasury", 500),
        fetchLaeAdminSettings(),
      ]);
      if (cancelled) return;
      if (!incomeRes.ok) {
        setError(incomeRes.error);
        setRows([]);
      } else {
        setRows(incomeRes.data.incomes);
        setError(null);
      }
      if (settingsRes.ok) {
        const c = settingsRes.data.contracts as Record<string, string>;
        setSettings({
          treasury: c.laeCoinTreasury ?? c.treasuryWallet ?? c.owner,
          liquidity: c.liquidityWallet ?? c.laeLiquidity,
          contract: c.matrixCore ?? LAE_CONTRACTS.matrix,
        });
      }
      setUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const d1 = sinceMs(1);
    const d7 = sinceMs(7);
    const d30 = sinceMs(30);
    let total = 0n;
    let daily = 0n;
    let weekly = 0n;
    let monthly = 0n;
    for (const r of rows) {
      const w = incomeStringToWei(r.amount);
      total += w;
      const ts = r.createdAt ? new Date(r.createdAt).getTime() : 0;
      if (ts >= d1) daily += w;
      if (ts >= d7) weekly += w;
      if (ts >= d30) monthly += w;
      void now;
    }
    return { total, daily, weekly, monthly };
  }, [rows]);

  // Group by day for a lightweight chart
  const byDay = useMemo(() => {
    const map = new Map<string, bigint>();
    for (const r of rows) {
      const key = r.createdAt ? r.createdAt.slice(0, 10) : "unknown";
      const prev = map.get(key) ?? 0n;
      map.set(key, prev + incomeStringToWei(r.amount));
    }
    const entries = Array.from(map.entries())
      .filter(([k]) => k !== "unknown")
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 14);
    const max = entries.reduce((m, [, v]) => (v > m ? v : m), 0n);
    return { entries, max };
  }, [rows]);

  function exportCsv() {
    const data = rows.map((r) => ({
      Date: r.createdAt ? formatDate(r.createdAt) : "",
      Level: r.level ?? r.boardLevel ?? "",
      Board: r.matrixOwnerId ?? "",
      Amount: formatEther(incomeStringToWei(r.amount)),
      TxHash: r.txHash,
      Block: r.blockNumber,
    }));
    const csv = toCsv(data as Record<string, string>[]);
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lae-treasury.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell title="Treasury">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Treasury & Liquidity</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            Live wallet balances + indexed lapse / overflow income
            {updated && (
              <Pill tone="emerald" className="gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Updated {updated}
              </Pill>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2.5 text-sm font-semibold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <QueryError message={error} />
        </div>
      )}

      {/* ── Balances ── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Treasury Wallet (live)"
          accent="violet"
          icon={Vault}
          value={<span className="text-violet-300">{fmtEther(treasuryBal.balance)}</span>}
          sub={coin.treasuryWallet ? truncateAddress(coin.treasuryWallet, 8, 6) : "—"}
        />
        <StatCard
          label="Liquidity Wallet (live)"
          accent="emerald"
          icon={Droplets}
          value={<span className="text-emerald-300">{fmtEther(liquidityBal.balance)}</span>}
          sub={coin.liquidityWallet ? truncateAddress(coin.liquidityWallet, 8, 6) : "—"}
        />
        <StatCard
          label="Contract Balance"
          accent="brand"
          icon={Coins}
          value={fmtEther(contractBal.balance)}
          sub="Held in LAEClubMatrix"
        />
      </div>

      {/* ── Totals ── */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Treasury Income"
          accent="gold"
          icon={Landmark}
          value={<span className="text-gradient-gold">{fmtEther(stats.total)}</span>}
          sub={`${rows.length} indexed payouts`}
        />
        <StatCard label="Today" value={fmtEther(stats.daily)} icon={TrendingUp} accent="emerald" />
        <StatCard label="Last 7 days" value={fmtEther(stats.weekly)} accent="brand" />
        <StatCard label="Last 30 days" value={fmtEther(stats.monthly)} accent="violet" />
      </div>

      {/* ── Wallet directory ── */}
      <Panel className="mt-4" title="Wallet directory">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Treasury wallet", addr: coin.treasuryWallet ?? settings.treasury },
            { label: "Liquidity wallet", addr: coin.liquidityWallet ?? settings.liquidity },
            { label: "Matrix contract", addr: settings.contract ?? LAE_CONTRACTS.matrix },
          ].map((w) => (
            <div
              key={w.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{w.label}</p>
              {w.addr ? (
                <a
                  href={addressUrl(w.addr)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 break-all font-mono text-xs text-[#D4AF37] hover:underline"
                >
                  {w.addr}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <p className="mt-1 text-sm text-slate-500">—</p>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Daily chart ── */}
      <Panel className="mt-4" title="Daily treasury inflow" desc="Last 14 days of indexed treasury payouts">
        {byDay.entries.length === 0 ? (
          <p className="text-sm text-slate-500">No treasury payouts indexed yet.</p>
        ) : (
          <div className="space-y-1.5">
            {byDay.entries.map(([day, val]) => {
              const pct = byDay.max > 0n ? Number((val * 100n) / byDay.max) : 0;
              return (
                <div key={day} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-xs text-slate-500">{day}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B]"
                      style={{ width: `${Math.max(3, pct)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right font-mono tabular-nums text-[#D4AF37]">
                    {fmtEther(val)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* ── Transactions ── */}
      <Panel
        className="mt-4"
        title="Treasury transactions"
        desc="ClubPoolPayment — payouts routed to treasury when no eligible upline exists (lapse) or slot 13/14 fallback"
      >
        {loading ? (
          <QueryLoading label="Loading treasury payouts…" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No treasury payouts yet.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr className="border-b border-white/10">
                  <th className="py-2.5 pr-3">Date</th>
                  <th className="py-2.5 pr-3">Level</th>
                  <th className="py-2.5 pr-3">Board owner</th>
                  <th className="py-2.5 pr-3">From user</th>
                  <th className="py-2.5 pr-3 text-right">Amount</th>
                  <th className="py-2.5 text-right">Tx</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r, i) => (
                  <tr
                    key={`${r.txHash}-${r.logIndex ?? i}`}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="py-2.5 pr-3 text-xs text-slate-400">
                      {r.createdAt ? formatDate(r.createdAt) : "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="rounded-md border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-1.5 py-0.5 text-xs font-medium text-[#D4AF37]">
                        L{r.level ?? r.boardLevel ?? "—"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300">
                      {r.matrixOwnerId != null ? `#${r.matrixOwnerId}` : "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300">
                      {r.fromUserId != null ? `#${r.fromUserId}` : "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-violet-300">
                      +{fmtEther(incomeStringToWei(r.amount))}
                    </td>
                    <td className="py-2.5 text-right">
                      <a
                        href={txUrl(r.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-[#D4AF37]/80 hover:text-[#D4AF37] hover:underline"
                      >
                        {truncateAddress(r.txHash)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 200 && (
              <p className="mt-2 text-xs text-slate-500">
                Showing latest 200 of {rows.length} events — export CSV for the full log.
              </p>
            )}
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
