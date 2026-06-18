"use client";

import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useUserEventsOnChain } from "@/lib/contracts/hooks";

export default function RecyclePage() {
  const events = useUserEventsOnChain();

  if (events.isLoading) return <QueryLoading label="Loading rebirth events…" />;

  const rebirths = (events.data ?? []).filter(
    (e) => e.eventName === "ClubRebirthCreated" || e.eventName === "PilotRebirthCreated"
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Recycle / Rebirth</h1>
      <p className="mt-1 text-sm text-slate-400">{rebirths.length} on-chain rebirth events</p>
      <Panel className="mt-6" title="Rebirth history">
        {rebirths.length === 0 ? (
          <p className="text-sm text-slate-500">No rebirths yet</p>
        ) : (
          rebirths.map((e) => (
            <div key={e.id} className="border-b border-white/5 py-3 text-sm">
              <Pill tone="violet">{e.eventName}</Pill>
              <p className="mt-1 text-white">Matrix {String(e.args.matrixId)} · L{String(e.args.level)}</p>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}
