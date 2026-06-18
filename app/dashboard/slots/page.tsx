"use client";

import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import {
  useClubMatricesOnChain,
  useClubPackagesOnChain,
  useUserEventsOnChain,
} from "@/lib/contracts/hooks";
import { CLUB_SLOTS } from "@/lib/contracts/abis";
import { truncateAddress } from "@/lib/format";

export default function ClubSlotsPage() {
  const matrices = useClubMatricesOnChain();
  const packages = useClubPackagesOnChain();
  const events = useUserEventsOnChain();

  if (matrices.isLoading || packages.isLoading) {
    return <QueryLoading label="Loading club matrices from chain…" />;
  }

  const rebirthCount = (events.data ?? []).filter((e) => e.eventName === "ClubRebirthCreated").length;
  const autoUpgrades = (events.data ?? []).filter((e) => e.eventName === "AutoUpgrade");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Club Matrices</h1>
      <p className="mt-1 text-sm text-slate-400">On-chain Club slots · {CLUB_SLOTS} positions per matrix</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Panel title="Packages owned">
          <p className="text-2xl font-bold text-white">{packages.data?.length ?? 0}</p>
        </Panel>
        <Panel title="Rebirths">
          <p className="text-2xl font-bold text-white">{rebirthCount}</p>
        </Panel>
        <Panel title="Auto upgrades">
          <p className="text-2xl font-bold text-white">{autoUpgrades.length}</p>
        </Panel>
      </div>

      <div className="mt-6 space-y-4">
        {(matrices.data ?? []).length === 0 && (
          <Panel title="No active matrices">
            <p className="text-sm text-slate-500">Purchase a Club package to create a matrix.</p>
          </Panel>
        )}
        {(matrices.data ?? []).map((m) => {
          const pkg = packages.data?.find((p) => p.level === m.level);
          return (
            <Panel
              key={String(m.matrixId)}
              title={`Matrix #${String(m.matrixId)} — Level ${m.level}`}
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
                    {m.slotsFilled}/{CLUB_SLOTS}
                  </span>
                </p>
                <p className="text-slate-400">
                  Cycles: <span className="text-white">{pkg?.cyclesCompleted ?? m.cycleNumber}</span>
                </p>
                <p className="text-slate-400">
                  Cycle #: <span className="text-white">{m.cycleNumber}</span>
                </p>
                <p className="text-slate-400">
                  Parent matrix: <span className="text-white">{String(m.parentMatrixId)}</span>
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
