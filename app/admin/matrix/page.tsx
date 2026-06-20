"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { fetchLaeAdminMatrix } from "@/lib/lae-club/admin-api";
import { truncateAddress } from "@/lib/format";

type Placement = {
  userId: number;
  referrerId: number;
  level: number;
  cycle: number;
  spot: number;
  txHash: string;
  blockNumber: string;
};

export default function AdminMatrixPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);

  useEffect(() => {
    fetchLaeAdminMatrix().then((d) => setPlacements((d?.placements as Placement[]) ?? []));
  }, []);

  return (
    <AdminShell title="Matrix">
      <h1 className="font-display text-2xl font-bold">Matrix Placements</h1>
      <p className="mt-1 text-sm text-slate-400">
        NewUserPlace events · 12 levels · 14 spots per cycle
      </p>

      <Panel className="mt-6" title="Recent placements">
        {placements.length === 0 ? (
          <p className="text-sm text-slate-500">No indexed placements yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
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
