"use client";

import { Panel } from "@/components/dashboard/ui";
import { ChainQueryState } from "@/components/dashboard/ChainQueryState";
import { useClubPackagesOnChain, useClubMatricesOnChain } from "@/lib/contracts/hooks";

export default function RanksPage() {
  const packages = useClubPackagesOnChain();
  const matrices = useClubMatricesOnChain();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Rank Progress</h1>
      <p className="mt-1 text-sm text-slate-400">From on-chain club packages</p>

      <ChainQueryState query={packages} label="Loading packages…">
        {(data) => {
          const highest = Math.max(...data.map((p) => p.level), 0);
          return (
            <>
              <Panel className="mt-6" title="Current rank">
                <p className="text-2xl font-bold text-white">Club Level {highest || "—"}</p>
                <p className="mt-2 text-sm text-slate-400">
                  {(matrices.data ?? []).length} active matrices
                </p>
              </Panel>
              <Panel className="mt-4" title="Package levels owned">
                {data.length === 0 ? (
                  <p className="text-sm text-slate-500">No club packages yet</p>
                ) : (
                  data.map((p) => (
                    <div key={p.level} className="border-b border-white/5 py-2 text-sm text-white">
                      Club Level {p.level} · {p.cyclesCompleted} cycles ·{" "}
                      {p.isManual ? "Manual" : "Auto-upgrade eligible"}
                    </div>
                  ))
                )}
              </Panel>
            </>
          );
        }}
      </ChainQueryState>
    </div>
  );
}
