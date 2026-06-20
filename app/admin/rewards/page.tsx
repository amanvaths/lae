"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { QueryError, QueryLoading } from "@/components/dashboard/QueryState";
import { fetchLaeAdminRewards } from "@/lib/lae-club/admin-api";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { useAdminFetch } from "@/hooks/useAdminFetch";

function payloadAmount(payload: unknown, key: string): string {
  if (!payload || typeof payload !== "object") return "0";
  const v = (payload as Record<string, unknown>)[key];
  try {
    return fmtEther(BigInt(String(v ?? 0)));
  } catch {
    return "0";
  }
}

export default function AdminRewardsPage() {
  const { data, error, loading, retry } = useAdminFetch("admin-rewards", fetchLaeAdminRewards);

  return (
    <AdminShell title="Rewards">
      <h1 className="font-display text-2xl font-bold">LAE Rewards Analytics</h1>
      <p className="mt-1 text-sm text-slate-400">
        Indexed LaeRewardAllocated and LaeRewardClaimed events from LAEClubMatrix
      </p>

      {error && (
        <div className="mt-4">
          <QueryError message={error} onRetry={() => void retry()} />
        </div>
      )}

      {loading && !data ? (
        <QueryLoading label="Loading rewards analytics…" />
      ) : (
        <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel title="Allocations indexed">
          <p className="text-3xl font-bold">{data?.allocatedCount ?? "—"}</p>
        </Panel>
        <Panel title="Claims indexed">
          <p className="text-3xl font-bold">{data?.claimedCount ?? "—"}</p>
        </Panel>
        <Panel title="Recent alloc. sample total">
          <p className="text-3xl font-bold">
            {data ? fmtEther(BigInt(data.sampleAllocatedTotal), 0) : "—"} LAE
          </p>
        </Panel>
        <Panel title="Recent claims sample total">
          <p className="text-3xl font-bold">
            {data ? fmtEther(BigInt(data.sampleClaimedTotal), 0) : "—"} LAE
          </p>
        </Panel>
      </div>

      <Panel className="mt-6" title="Recent LaeRewardAllocated">
        {!data?.recentAllocated.length ? (
          <p className="text-sm text-slate-500">No indexed LAE reward allocations yet</p>
        ) : (
          data.recentAllocated.map((row) => (
            <div
              key={`${row.txHash}-alloc`}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2 text-sm"
            >
              <span className="font-mono text-slate-400">
                {row.walletAddress ? truncateAddress(row.walletAddress) : "—"}
              </span>
              <span className="text-brand-300">
                +{payloadAmount(row.payload, "laeAmount")} LAE · L
                {String((row.payload as Record<string, unknown>)?.level ?? "—")}
              </span>
            </div>
          ))
        )}
      </Panel>

      <Panel className="mt-4" title="Recent LaeRewardClaimed">
        {!data?.recentClaimed.length ? (
          <p className="text-sm text-slate-500">No indexed LAE reward claims yet</p>
        ) : (
          data.recentClaimed.map((row) => (
            <div
              key={`${row.txHash}-claim`}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2 text-sm"
            >
              <span className="font-mono text-slate-400">
                {row.walletAddress ? truncateAddress(row.walletAddress) : "—"}
              </span>
              <span className="text-emerald-400">
                +{payloadAmount(row.payload, "amount")} LAE claimed
              </span>
            </div>
          ))
        )}
      </Panel>
        </>
      )}
    </AdminShell>
  );
}
