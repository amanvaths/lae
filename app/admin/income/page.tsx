"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { QueryError, QueryLoading } from "@/components/dashboard/QueryState";
import { fetchLaeAdminIncome } from "@/lib/lae-club/admin-api";
import { fmtEther } from "@/lib/contracts/format";

type IncomeRow = {
  receiverUserId: number;
  fromUserId: number | null;
  level: number;
  amount: string;
  incomeKind: string;
  txHash: string;
};

export default function AdminIncomePage() {
  const [matrix, setMatrix] = useState<IncomeRow[]>([]);
  const [royal, setRoyal] = useState<IncomeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let matrixResult = await fetchLaeAdminIncome("matrix");
    let royalResult = await fetchLaeAdminIncome("royal");
    if (!matrixResult.ok || !royalResult.ok) {
      await new Promise((r) => setTimeout(r, 400));
      matrixResult = await fetchLaeAdminIncome("matrix");
      royalResult = await fetchLaeAdminIncome("royal");
    }
    if (!matrixResult.ok || !royalResult.ok) {
      setError(
        !matrixResult.ok
          ? matrixResult.error
          : !royalResult.ok
            ? royalResult.error
            : "Failed to load income"
      );
      setMatrix([]);
      setRoyal([]);
    } else {
      setMatrix(matrixResult.data.incomes as IncomeRow[]);
      setRoyal(royalResult.data.incomes as IncomeRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell title="Income">
      <h1 className="font-display text-2xl font-bold">Income</h1>
      <p className="mt-1 text-sm text-slate-400">
        TokenReceived (matrix) and ClubPoolPayment (royal) from indexer
      </p>

      {error && (
        <div className="mt-4">
          <QueryError message={error} onRetry={() => void load()} />
        </div>
      )}

      {loading ? (
        <QueryLoading label="Loading income data…" />
      ) : (
        <>
      <Panel className="mt-6" title="Matrix income (TokenReceived)">
        {matrix.length === 0 ? (
          <p className="text-sm text-slate-500">No indexed matrix income</p>
        ) : (
          matrix.map((r, i) => (
            <div key={`${r.txHash}-${r.receiverUserId}-${i}`} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2 text-sm">
              <span>
                #{r.receiverUserId} · L{r.level} · from #{r.fromUserId ?? "—"}
              </span>
              <span className="text-emerald-400">+{fmtEther(BigInt(r.amount))}</span>
            </div>
          ))
        )}
      </Panel>

      <Panel className="mt-4" title="Royal income (ClubPoolPayment)">
        {royal.length === 0 ? (
          <p className="text-sm text-slate-500">No indexed royal income</p>
        ) : (
          royal.map((r, i) => (
            <div key={`${r.txHash}-${r.receiverUserId}-${i}`} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2 text-sm">
              <span>#{r.receiverUserId} · L{r.level}</span>
              <span className="text-brand-300">+{fmtEther(BigInt(r.amount))}</span>
            </div>
          ))
        )}
      </Panel>
        </>
      )}
    </AdminShell>
  );
}
