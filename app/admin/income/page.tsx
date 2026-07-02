"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { QueryError, QueryLoading } from "@/components/dashboard/QueryState";
import { fetchLaeAdminIncome, type LaeIndexedIncome } from "@/lib/lae-club/admin-api";
import { fmtEther, incomeStringToWei } from "@/lib/contracts/format";
import { txUrl } from "@/lib/lae-club/contracts";
import { truncateAddress } from "@/lib/format";

/** Where the money that funded a payout came from (closed-loop model). */
function fundingSource(level: number | null): string {
  if (level == null) return "—";
  if (level <= 1) return "Registration fee";
  return `Level ${level - 1} · slot 4 + 5 carry`;
}

function IncomeList({ rows, tone }: { rows: LaeIndexedIncome[]; tone: "emerald" | "violet" }) {
  const amountClass = tone === "emerald" ? "text-emerald-400" : "text-violet-300";
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No indexed income yet</p>;
  }
  return (
    <div className="divide-y divide-white/[0.06]">
      {rows.map((r, i) => {
        const level = r.level ?? r.boardLevel;
        return (
          <div key={`${r.txHash}-${r.logIndex ?? i}`} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm text-white">
                {r.toUserId != null ? `#${r.toUserId}` : "Pool"}
                {r.fromUserId != null && (
                  <span className="text-slate-500"> ← from #{r.fromUserId}</span>
                )}
                {level != null && (
                  <span className="ml-2 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-300">
                    L{level}
                    {r.cycleId != null ? ` · C${r.cycleId}` : ""}
                    {r.position != null ? ` · S${r.position}` : ""}
                  </span>
                )}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                Funded by: {fundingSource(level)} ·{" "}
                <a
                  href={txUrl(r.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-slate-500 hover:text-[#D4AF37]"
                >
                  {truncateAddress(r.txHash)}
                </a>
              </p>
            </div>
            <span className={`shrink-0 font-display text-sm font-bold tabular-nums ${amountClass}`}>
              +{fmtEther(incomeStringToWei(r.amount))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminIncomePage() {
  const [matrix, setMatrix] = useState<LaeIndexedIncome[]>([]);
  const [treasury, setTreasury] = useState<LaeIndexedIncome[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [matrixResult, treasuryResult] = await Promise.all([
      fetchLaeAdminIncome("matrix", 200),
      fetchLaeAdminIncome("treasury", 200),
    ]);
    if (!matrixResult.ok || !treasuryResult.ok) {
      setError(
        !matrixResult.ok
          ? matrixResult.error
          : !treasuryResult.ok
            ? treasuryResult.error
            : "Failed to load income"
      );
      setMatrix([]);
      setTreasury([]);
    } else {
      setMatrix(matrixResult.data.incomes);
      setTreasury(treasuryResult.data.incomes);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const sum = (rows: LaeIndexedIncome[]) =>
      rows.reduce((s, r) => s + incomeStringToWei(r.amount), 0n);
    return { matrix: sum(matrix), treasury: sum(treasury) };
  }, [matrix, treasury]);

  return (
    <AdminShell title="Income">
      <h1 className="font-display text-2xl font-bold text-white">Income</h1>
      <p className="mt-1 text-sm text-slate-400">
        Matrix payouts (TokenReceived) and treasury/liquidity (ClubPoolPayment) with funding source
      </p>

      {error && (
        <div className="mt-4">
          <QueryError message={error} onRetry={() => void load()} />
        </div>
      )}

      {loading ? (
        <div className="mt-6">
          <QueryLoading label="Loading income data…" />
        </div>
      ) : (
        <>
          <Panel
            className="mt-6"
            title="Matrix income (TokenReceived)"
            desc={`Total distributed: ${fmtEther(totals.matrix)}`}
          >
            <IncomeList rows={matrix} tone="emerald" />
          </Panel>

          <Panel
            className="mt-4"
            title="Treasury / liquidity (ClubPoolPayment)"
            desc={`Total collected: ${fmtEther(totals.treasury)}`}
          >
            <IncomeList rows={treasury} tone="violet" />
          </Panel>
        </>
      )}
    </AdminShell>
  );
}
