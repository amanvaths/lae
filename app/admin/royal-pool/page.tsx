"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { QueryError } from "@/components/dashboard/QueryState";
import { fetchLaeAdminIncome, fetchLaeAdminStats } from "@/lib/lae-club/admin-api";
import { useLaeRoyalPoolBalance } from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { addressUrl } from "@/lib/lae-club/contracts";
import { truncateAddress } from "@/lib/format";

type IncomeRow = {
  receiverUserId: number;
  level: number;
  amount: string;
  txHash: string;
};

export default function AdminRoyalPoolPage() {
  const pool = useLaeRoyalPoolBalance();
  const [stats, setStats] = useState<{ totalPaid: string; eventCount: number } | null>(null);
  const [rows, setRows] = useState<IncomeRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchLaeAdminStats(), fetchLaeAdminIncome("royal")]).then(
      ([statsResult, incomeResult]) => {
        if (!statsResult.ok) {
          setError(statsResult.error);
          return;
        }
        if (!incomeResult.ok) {
          setError(incomeResult.error);
          return;
        }
        setStats(statsResult.data.royalPool ?? null);
        setRows(incomeResult.data.incomes as IncomeRow[]);
        setError(null);
      }
    );
  }, []);

  return (
    <AdminShell title="Royal Pool">
      <h1 className="font-display text-2xl font-bold">Royal Pool</h1>

      {error && (
        <div className="mt-4">
          <QueryError message={error} />
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Panel title="Pool balance (live ERC20)">
          <p className="text-2xl font-bold">{fmtEther(pool.balance)}</p>
          {pool.poolAddress && (
            <a
              href={addressUrl(pool.poolAddress)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-300 hover:underline"
            >
              {truncateAddress(pool.poolAddress)}
            </a>
          )}
        </Panel>
        <Panel title="Total paid (indexed)">
          <p className="text-2xl font-bold">
            {stats?.totalPaid ? fmtEther(BigInt(stats.totalPaid)) : "—"}
          </p>
        </Panel>
        <Panel title="TreasuryPool events">
          <p className="text-2xl font-bold">{stats?.eventCount ?? "—"}</p>
        </Panel>
      </div>

      <Panel className="mt-4" title="Recent TreasuryPool payouts">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No indexed royal payouts</p>
        ) : (
          rows.map((r, i) => (
            <div key={`${r.txHash}-${i}`} className="flex justify-between border-b border-white/5 py-2 text-sm">
              <span>User #{r.receiverUserId} · L{r.level}</span>
              <span className="text-brand-300">+{fmtEther(BigInt(r.amount))}</span>
            </div>
          ))
        )}
      </Panel>
    </AdminShell>
  );
}
