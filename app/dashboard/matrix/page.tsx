"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useClubMatricesOnChain, usePilotMatricesOnChain } from "@/lib/contracts/hooks";
import { truncateAddress } from "@/lib/format";

export default function MatrixPage() {
  const club = useClubMatricesOnChain();
  const pilot = usePilotMatricesOnChain();

  if (club.isLoading || pilot.isLoading) {
    return <QueryLoading label="Loading matrices from chain…" />;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Co-Matrix</h1>
      <p className="mt-1 text-sm text-slate-400">Active club &amp; pilot matrices on-chain</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Club">
          {(club.data ?? []).map((m) => (
            <div key={String(m.matrixId)} className="mb-3 rounded-lg border border-white/10 p-3 text-sm">
              <p className="text-white">#{String(m.matrixId)} L{m.level}</p>
              <p className="text-slate-400">{m.slotsFilled} slots filled</p>
            </div>
          ))}
          {(club.data ?? []).length === 0 && <p className="text-slate-500">No club matrices</p>}
        </Panel>
        <Panel title="Pilot">
          {(pilot.data ?? []).map((m) => (
            <div key={String(m.matrixId)} className="mb-3 rounded-lg border border-white/10 p-3 text-sm">
              <p className="text-white">#{String(m.matrixId)} L{m.level}</p>
              <p className="text-slate-400">{m.slotsFilled}/2 slots</p>
            </div>
          ))}
          {(pilot.data ?? []).length === 0 && <p className="text-slate-500">No pilot matrices</p>}
        </Panel>
      </div>
    </div>
  );
}
