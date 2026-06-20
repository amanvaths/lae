"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { fetchLaeAdminIncome } from "@/lib/lae-club/admin-api";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";

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

  useEffect(() => {
    fetchLaeAdminIncome("matrix").then((d) => setMatrix((d?.incomes as IncomeRow[]) ?? []));
    fetchLaeAdminIncome("royal").then((d) => setRoyal((d?.incomes as IncomeRow[]) ?? []));
  }, []);

  return (
    <AdminShell title="Income">
      <h1 className="font-display text-2xl font-bold">Income</h1>
      <p className="mt-1 text-sm text-slate-400">
        TokenReceived (matrix) and TreasuryPool (royal) from indexer
      </p>

      <Panel className="mt-6" title="Matrix income (TokenReceived)">
        {matrix.length === 0 ? (
          <p className="text-sm text-slate-500">No indexed matrix income</p>
        ) : (
          matrix.map((r) => (
            <div key={r.txHash} className="flex justify-between border-b border-white/5 py-2 text-sm">
              <span>
                #{r.receiverUserId} · L{r.level} · from #{r.fromUserId ?? "—"}
              </span>
              <span className="text-emerald-400">+{fmtEther(BigInt(r.amount))}</span>
            </div>
          ))
        )}
      </Panel>

      <Panel className="mt-4" title="Royal income (TreasuryPool)">
        {royal.length === 0 ? (
          <p className="text-sm text-slate-500">No indexed royal income</p>
        ) : (
          royal.map((r) => (
            <div key={r.txHash} className="flex justify-between border-b border-white/5 py-2 text-sm">
              <span>#{r.receiverUserId} · L{r.level}</span>
              <span className="text-brand-300">+{fmtEther(BigInt(r.amount))}</span>
            </div>
          ))
        )}
      </Panel>
    </AdminShell>
  );
}
