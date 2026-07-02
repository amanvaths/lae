"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Vault,
  TrendingUp,
  Landmark,
  RefreshCw,
  Boxes,
  Search,
  ArrowUpRight,
  Coins,
  Blocks,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel, StatCard, Pill } from "@/components/dashboard/ui";
import { QueryError, QueryLoading } from "@/components/dashboard/QueryState";
import { fetchLaeAdminStats } from "@/lib/lae-club/admin-api";
import {
  useLaeCoinStats,
  useLaeProtocolStats,
  useLaeRoyalPoolBalance,
} from "@/lib/lae-club/hooks";
import { LAE_CONTRACTS, addressUrl } from "@/lib/lae-club/contracts";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { withBasePath } from "@/lib/paths";
import { useAdminFetch } from "@/hooks/useAdminFetch";

function GlobalUserSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function go() {
    const raw = value.trim();
    if (!raw) return;
    const id = Number(raw.replace(/^#/, ""));
    if (Number.isInteger(id) && id > 0) {
      router.push(withBasePath(`/view?viewUserId=${id}`));
      return;
    }
    setErr("Enter a valid numeric User ID (e.g. 25)");
  }

  return (
    <div className="w-full sm:w-96">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setErr(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Search User ID → open analytics (e.g. 25)"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-24 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-[#D4AF37]/40"
        />
        <button
          type="button"
          onClick={go}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-semibold text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/25"
        >
          Open
        </button>
      </div>
      {err && <p className="mt-1.5 text-xs text-red-400">{err}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, error, loading, retry } = useAdminFetch("admin-stats", fetchLaeAdminStats);
  const protocol = useLaeProtocolStats();
  const coin = useLaeCoinStats();
  const contractBal = useLaeRoyalPoolBalance(LAE_CONTRACTS.matrix);
  const treasuryBal = useLaeRoyalPoolBalance(coin.treasuryWallet);
  const liquidityBal = useLaeRoyalPoolBalance(coin.liquidityWallet);

  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  useEffect(() => {
    if (stats) setUpdatedAt(new Date().toLocaleTimeString());
  }, [stats]);

  const slotSales = useMemo(() => {
    const rows = (stats?.positionSales ?? []).filter((r) => r.position != null);
    return [...rows].sort((a, b) => a.position - b.position);
  }, [stats]);
  const maxSlotVolume = useMemo(
    () => slotSales.reduce((m, r) => (BigInt(r.volume) > m ? BigInt(r.volume) : m), 0n),
    [slotSales]
  );

  return (
    <AdminShell title="Dashboard">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            Live on-chain reads + indexed analytics
            {updatedAt && (
              <Pill tone="emerald" className="gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Updated {updatedAt}
              </Pill>
            )}
          </p>
        </div>
        <GlobalUserSearch />
      </div>

      {error && (
        <div className="mt-4">
          <QueryError message={error} onRetry={() => void retry()} />
        </div>
      )}

      {loading && !stats ? (
        <div className="mt-6">
          <QueryLoading label="Loading admin stats…" />
        </div>
      ) : (
        <>
          {/* ── Top summary cards ── */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Treasury Balance"
              accent="violet"
              icon={Vault}
              value={<span className="text-violet-300">{fmtEther(treasuryBal.balance)}</span>}
              sub={`Liquidity ${fmtEther(liquidityBal.balance)} · Contract ${fmtEther(contractBal.balance)}`}
            />
            <StatCard
              label="Total System Users"
              accent="emerald"
              icon={Users}
              value={<span className="text-emerald-400">{stats?.totalUsers ?? protocol.totalUsers ?? "—"}</span>}
              sub={`+${stats?.todayRegistrations ?? 0} today · on-chain #${String(protocol.lastUserId ?? "—")}`}
            />
            <StatCard
              label="Matrix Income Distributed"
              accent="gold"
              icon={TrendingUp}
              value={
                <span className="text-gradient-gold">
                  {stats?.matrixIncome ? fmtEther(BigInt(stats.matrixIncome.totalPaid)) : "—"}
                </span>
              }
              sub={`${stats?.matrixIncome?.eventCount ?? 0} payout events`}
            />
            <StatCard
              label="Treasury Income"
              accent="violet"
              icon={Landmark}
              value={stats?.treasuryPool ? fmtEther(BigInt(stats.treasuryPool.totalPaid)) : "—"}
              sub={`${stats?.treasuryPool?.eventCount ?? 0} pool payments`}
            />
            <StatCard
              label="Boards & Recycles"
              accent="brand"
              icon={RefreshCw}
              value={String(stats?.recycles ?? 0)}
              sub={`${stats?.positions ?? 0} filled slots (boards)`}
            />
            <StatCard
              label="Chain Events Indexed"
              accent="brand"
              icon={Boxes}
              value={String(stats?.chainEvents ?? "—")}
              sub={`Block ${stats?.indexer?.lastBlock ?? "—"} · chain ${stats?.indexer?.chainId ?? "—"}`}
            />
          </div>

          {/* ── Contract + token ── */}
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <Panel title="Contract information" className="lg:col-span-2">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Matrix contract</dt>
                  <dd className="mt-1">
                    <a
                      href={addressUrl(LAE_CONTRACTS.matrix)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 break-all font-mono text-xs text-[#D4AF37] hover:underline"
                    >
                      {LAE_CONTRACTS.matrix}
                      <ArrowUpRight className="h-3 w-3 shrink-0" />
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Payment token</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-slate-300">
                    {contractBal.paymentToken ? truncateAddress(contractBal.paymentToken, 10, 8) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Current block</dt>
                  <dd className="mt-1 font-mono text-sm text-white">{stats?.indexer?.lastBlock ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Total transactions</dt>
                  <dd className="mt-1 font-mono text-sm text-white">{stats?.chainEvents ?? "—"}</dd>
                </div>
              </dl>
            </Panel>

            <Panel title="LAE Token (live)">
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Coins className="h-4 w-4 text-[#D4AF37]" /> Supply
                  </span>
                  <span className="font-mono text-white">
                    {coin.totalSupply ? fmtEther(coin.totalSupply, 0) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Circulating</span>
                  <span className="font-mono text-white">
                    {coin.circulating ? fmtEther(coin.circulating, 0) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Burned</span>
                  <span className="font-mono text-red-300">
                    {coin.totalBurned ? fmtEther(coin.totalBurned, 0) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                  <span className="text-slate-400">Staking TVL</span>
                  <span className="font-mono text-emerald-300">
                    {stats?.staking?.totalStaked ? fmtEther(BigInt(stats.staking.totalStaked), 0) : "—"}
                  </span>
                </div>
              </div>
            </Panel>
          </div>

          {/* ── Payouts by slot position ── */}
          <Panel
            className="mt-4"
            title="Payouts by slot position"
            desc="Indexed matrix income grouped by the 14 board slots"
          >
            {slotSales.length === 0 ? (
              <p className="text-sm text-slate-500">
                No indexed payouts yet — go to Settings → Sync indexer.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {slotSales.map((s) => {
                  const vol = BigInt(s.volume);
                  const pct = maxSlotVolume > 0n ? Number((vol * 100n) / maxSlotVolume) : 0;
                  return (
                    <div
                      key={s.position}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Blocks className="h-3.5 w-3.5 text-[#D4AF37]" />
                          <span className="font-medium text-white">Slot {s.position}</span>
                          <span className="text-xs text-slate-500">{s.count} events</span>
                        </span>
                        <span className="font-mono text-xs text-[#D4AF37]">{fmtEther(vol)}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B]"
                          style={{ width: `${Math.max(3, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </>
      )}
    </AdminShell>
  );
}
