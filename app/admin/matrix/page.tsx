"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { QueryError, QueryLoading } from "@/components/dashboard/QueryState";
import { fetchLaeAdminMatrix } from "@/lib/lae-club/admin-api";
import { truncateAddress } from "@/lib/format";
import { txUrl } from "@/lib/lae-club/contracts";
import { useAdminFetch } from "@/hooks/useAdminFetch";

export default function AdminMatrixPage() {
  const { data, error, loading, retry } = useAdminFetch("admin-matrix", () =>
    fetchLaeAdminMatrix(200)
  );
  const placements = data?.placements ?? [];

  return (
    <AdminShell title="Matrix">
      <h1 className="font-display text-2xl font-bold text-white">Matrix Placements</h1>
      <p className="mt-1 text-sm text-slate-400">
        Newest <span className="font-semibold text-[#D4AF37]">{placements.length}</span> board
        placements · sponsor-based · 14 slots per cycle
      </p>

      <Panel className="mt-6" title="Recent placements">
        {error ? (
          <QueryError message={error} onRetry={() => void retry()} />
        ) : loading && !data ? (
          <QueryLoading label="Loading placements…" />
        ) : placements.length === 0 ? (
          <p className="text-sm text-slate-500">No indexed placements yet</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr className="border-b border-white/10">
                  <th className="py-2.5 pr-3">Occupant</th>
                  <th className="py-2.5 pr-3">Board owner</th>
                  <th className="py-2.5 pr-3">Level</th>
                  <th className="py-2.5 pr-3">Cycle</th>
                  <th className="py-2.5 pr-3">Slot</th>
                  <th className="py-2.5 pr-3">Block</th>
                  <th className="py-2.5 text-right">Tx</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="py-2.5 pr-3 font-semibold text-white">#{p.occupantId}</td>
                    <td className="py-2.5 pr-3 text-slate-300">#{p.matrixOwnerId}</td>
                    <td className="py-2.5 pr-3">
                      <span className="rounded-md border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-1.5 py-0.5 text-xs font-medium text-[#D4AF37]">
                        L{p.level}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-300">{p.cycleId}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-300">{p.position}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-500">{p.blockNumber}</td>
                    <td className="py-2.5 text-right">
                      <a
                        href={txUrl(p.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-[#D4AF37]/80 hover:text-[#D4AF37] hover:underline"
                      >
                        {truncateAddress(p.txHash)}
                      </a>
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
