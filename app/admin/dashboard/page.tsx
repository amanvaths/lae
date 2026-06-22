"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { QueryError, QueryLoading } from "@/components/dashboard/QueryState";
import { fetchLaeAdminStats } from "@/lib/lae-club/admin-api";
import { useLaeCoinStats, useLaeProtocolStats, useLaeRoyalPoolBalance } from "@/lib/lae-club/hooks";
import { LAE_CONTRACTS, addressUrl } from "@/lib/lae-club/contracts";
import { fmtEther } from "@/lib/contracts/format";
import { useAdminFetch } from "@/hooks/useAdminFetch";

export default function AdminDashboardPage() {
  const { data: stats, error, loading, retry } = useAdminFetch("admin-stats", fetchLaeAdminStats);
  const protocol = useLaeProtocolStats();
  const coin = useLaeCoinStats();
  const pool = useLaeRoyalPoolBalance();

  return (
    <AdminShell title="Dashboard">
      <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-400">
        Indexed analytics + live on-chain protocol reads
      </p>

      {error && (
        <div className="mt-4">
          <QueryError message={error} onRetry={() => void retry()} />
        </div>
      )}

      {loading && !stats ? (
        <QueryLoading label="Loading admin stats…" />
      ) : (
        <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel title="Total Users">
          <p className="text-3xl font-bold">{stats?.totalUsers ?? protocol.totalUsers ?? "—"}</p>
          <p className="text-xs text-slate-500">
            On-chain lastUserId: {String(protocol.lastUserId ?? "—")}
            {stats && protocol.lastUserId != null && stats.totalUsers === 0 && (
              <span className="ml-1 text-amber-400">
                — indexer empty, go to Settings → Sync indexer
              </span>
            )}
          </p>
        </Panel>
        <Panel title="Today's Registrations">
          <p className="text-3xl font-bold">{stats?.todayRegistrations ?? "—"}</p>
        </Panel>
        <Panel title="Royal Pool (indexed paid)">
          <p className="text-3xl font-bold">
            {stats?.royalPool?.totalPaid ? fmtEther(BigInt(stats.royalPool.totalPaid)) : "—"}
          </p>
          <p className="text-xs text-slate-500">
            Pool balance: {fmtEther(pool.balance)}
          </p>
        </Panel>
        <Panel title="Chain events indexed">
          <p className="text-3xl font-bold">{stats?.chainEvents ?? "—"}</p>
          <p className="text-xs text-slate-500">Block {stats?.indexer?.lastBlock ?? "—"}</p>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Panel title="Token Stats (live)">
          <p className="text-sm text-slate-400">
            Supply: {coin.totalSupply ? fmtEther(coin.totalSupply, 0) : "—"} LAE
          </p>
          <p className="text-sm text-slate-400">
            Burned: {coin.totalBurned ? fmtEther(coin.totalBurned, 0) : "—"} LAE
          </p>
          <p className="text-sm text-slate-400">
            Circulating: {coin.circulating ? fmtEther(coin.circulating, 0) : "—"} LAE
          </p>
        </Panel>
        <Panel title="Staking Stats">
          <p className="text-sm text-slate-400">
            Indexed TVL: {stats?.staking?.totalStaked ? fmtEther(BigInt(stats.staking.totalStaked), 0) : "—"}
          </p>
          <p className="text-sm text-slate-400">
            Active stakes: {stats?.staking?.activeStakes ?? "—"}
          </p>
        </Panel>
        <Panel title="Matrix contract">
          <a
            href={addressUrl(LAE_CONTRACTS.matrix)}
            target="_blank"
            rel="noreferrer"
            className="break-all font-mono text-xs text-brand-300"
          >
            {LAE_CONTRACTS.matrix}
          </a>
        </Panel>
      </div>

      <Panel className="mt-4" title="Level sales (indexed TokenReceived by level)">
        {(stats?.levelSales ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">No indexed level sales yet — run indexer sync</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {stats!.levelSales.map((l) => (
              <div key={l.level} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
                <span className="text-slate-500">L{l.level}</span>
                <span className="ml-2 text-white">{l.count} events</span>
                <span className="ml-2 font-mono text-brand-300">
                  {fmtEther(BigInt(l.volume))}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
        </>
      )}
    </AdminShell>
  );
}
