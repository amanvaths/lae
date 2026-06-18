"use client";

import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useUserEventsOnChain } from "@/lib/contracts/hooks";
import { truncateAddress } from "@/lib/format";

export default function SpilloverPage() {
  const events = useUserEventsOnChain();

  if (events.isLoading) return <QueryLoading label="Loading placement events…" />;

  const placements = (events.data ?? []).filter(
    (e) =>
      (e.eventName === "ClubPlacement" || e.eventName === "PilotPlacement") &&
      e.args.isSpillover === true
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Spillover</h1>
      <p className="mt-1 text-sm text-slate-400">Placements via BFS spillover from chain events</p>
      <Panel className="mt-6" title="Spillover placements">
        {placements.length === 0 ? (
          <p className="text-sm text-slate-500">No spillover placements recorded for your wallet</p>
        ) : (
          placements.map((e) => (
            <div key={e.id} className="border-b border-white/5 py-3 text-sm">
              <Pill tone="brand">{e.eventName}</Pill>
              <p className="mt-1 text-white">
                Matrix {String(e.args.matrixId)} · slot {String(e.args.slotIndex)}
              </p>
              <p className="text-xs text-slate-500">Sponsor {truncateAddress(String(e.args.sponsor ?? ""))}</p>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}
