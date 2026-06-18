"use client";

import { Panel } from "@/components/dashboard/ui";
import { useUserEventsOnChain } from "@/lib/contracts/hooks";
import { QueryLoading } from "@/components/dashboard/QueryState";

const EVENT_LABELS: Record<string, string> = {
  UserRegistered: "User registered",
  ClubPurchased: "Club purchased",
  PilotPurchased: "Pilot purchased",
  ClubPlacement: "Club placement",
  PilotPlacement: "Pilot placement",
  ClubCycleCompleted: "Club cycle completed",
  PilotCycleCompleted: "Pilot cycle completed",
  ClubRebirthCreated: "Club rebirth",
  PilotRebirthCreated: "Pilot rebirth",
  AutoUpgrade: "Auto upgrade",
  IncomePaid: "Income paid",
  TokenReward: "SLT reward",
  Withdraw: "Withdraw",
  PendingProcessed: "Queue processed",
};

export default function AnnouncementsPage() {
  const events = useUserEventsOnChain();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">On-chain Activity</h1>
      <p className="mt-1 text-sm text-slate-400">Live updates from BSC Testnet contract events</p>

      <Panel className="mt-6" title="Recent events">
        {events.isLoading ? (
          <QueryLoading label="Loading events…" />
        ) : (events.data ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">No events yet — register and purchase to see activity</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {(events.data ?? []).slice(0, 20).map((e) => (
              <li key={e.id} className="py-3 text-sm">
                <p className="font-medium text-white">{EVENT_LABELS[e.eventName] ?? e.eventName}</p>
                <p className="font-mono text-xs text-slate-500">{e.transactionHash.slice(0, 18)}…</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
