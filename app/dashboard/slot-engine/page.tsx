"use client";

import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import {
  usePilotMatricesOnChain,
  usePilotPackagesOnChain,
  useUserEventsOnChain,
} from "@/lib/contracts/hooks";
import { PILOT_SLOTS } from "@/lib/contracts/abis";
import { truncateAddress } from "@/lib/format";

export default function PilotSlotsPage() {
  const matrices = usePilotMatricesOnChain();
  const packages = usePilotPackagesOnChain();
  const events = useUserEventsOnChain();

  if (matrices.isLoading || packages.isLoading) {
    return <QueryLoading label="Loading pilot matrices from chain…" />;
  }

  const rebirthCount = (events.data ?? []).filter((e) => e.eventName === "PilotRebirthCreated").length;
  const cycles = (events.data ?? []).filter((e) => e.eventName === "PilotCycleCompleted");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Pilot Slot Engine</h1>
      <p className="mt-1 text-sm text-slate-400">On-chain Pilot matrices · {PILOT_SLOTS} slots</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Panel title="Packages owned">
          <p className="text-2xl font-bold text-white">{packages.data?.length ?? 0}</p>
        </Panel>
        <Panel title="Cycles completed">
          <p className="text-2xl font-bold text-white">{cycles.length}</p>
        </Panel>
        <Panel title="Rebirths">
          <p className="text-2xl font-bold text-white">{rebirthCount}</p>
        </Panel>
      </div>

      <div className="mt-6 space-y-4">
        {(matrices.data ?? []).length === 0 && (
          <Panel title="No pilot matrices">
            <p className="text-sm text-slate-500">Purchase a Pilot package to activate.</p>
          </Panel>
        )}
        {(matrices.data ?? []).map((m) => {
          const pkg = packages.data?.find((p) => p.level === m.level);
          return (
            <Panel
              key={String(m.matrixId)}
              title={`Pilot Matrix #${String(m.matrixId)} — Level ${m.level}`}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <Pill tone={m.active ? "emerald" : "slate"}>{m.active ? "Active" : "Inactive"}</Pill>
                {m.cycleCompleted && <Pill tone="gold">Cycle complete</Pill>}
                {m.isRebirth && <Pill tone="violet">Rebirth</Pill>}
                {pkg && !pkg.isManual && <Pill tone="brand">Auto-upgrade</Pill>}
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-slate-400">
                  Slots:{" "}
                  <span className="text-white">
                    {m.slotsFilled}/{PILOT_SLOTS}
                  </span>
                </p>
                <p className="text-slate-400">
                  Cycles: <span className="text-white">{pkg?.cyclesCompleted ?? m.cycleNumber}</span>
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {m.slots.map((slot, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/10 p-2 text-center text-xs"
                  >
                    <p className="text-slate-500">Slot {i}</p>
                    <p className="mt-1 font-mono text-white">
                      {slot.startsWith("0x0000") ? "Empty" : truncateAddress(slot)}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
