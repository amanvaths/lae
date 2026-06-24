"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { QueryError, QueryLoading } from "@/components/dashboard/QueryState";
import { fetchLaeAdminMatrix } from "@/lib/lae-club/admin-api";
import { truncateAddress } from "@/lib/format";
import { useAdminFetch } from "@/hooks/useAdminFetch";

export default function AdminMatrixPage() {
  const { data, error, loading, retry } = useAdminFetch("admin-matrix", fetchLaeAdminMatrix);
  const placements = data?.placements ?? [];

  return (
    <AdminShell title="Matrix">
      <h1 className="font-display text-2xl font-bold">Matrix Placements</h1>
      <p className="mt-1 text-sm text-slate-400">
        PositionFilled events · cycle-based · 14 positions per cycle
      </p>

      <Panel className="mt-6" title="Recent placements">
        {error ? (
          <QueryError message={error} onRetry={() => void retry()} />
        ) : loading && !data ? (
          <QueryLoading label="Loading placements…" />
        ) : placements.length === 0 ? (
          <p className="text-sm text-slate-500">No indexed placements yet</p>
        ) : (
          <div className="table-scroll">
            <table className="text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2">User</th>
                  <th className="pb-2">Referrer</th>
                  <th className="pb-2">Level</th>
                  <th className="pb-2">Cycle</th>
                  <th className="pb-2">Spot</th>
                  <th className="pb-2">Tx</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((p) => (
                  <tr key={`${p.txHash}-${p.spot}`} className="border-t border-white/5">
                    <td className="py-2">{p.userId}</td>
                    <td className="py-2">{p.referrerId}</td>
                    <td className="py-2">L{p.level}</td>
                    <td className="py-2">{p.cycle}</td>
                    <td className="py-2">{p.spot}</td>
                    <td className="py-2 font-mono text-xs text-brand-300">
                      {truncateAddress(p.txHash)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
