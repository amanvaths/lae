"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { Panel, Pill } from "@/components/dashboard/ui";
import { useLaeProtocolStats } from "@/lib/lae-club/hooks";
import { ROYAL_NFT_MILESTONES } from "@/lib/lae-club/constants";

export default function AdminNftsPage() {
  const protocol = useLaeProtocolStats();

  return (
    <AdminShell title="NFTs">
      <h1 className="font-display text-2xl font-bold">Matrix milestones</h1>
      <p className="mt-1 text-sm text-slate-400">
        {protocol.totalUsers} registered users · LAE Club uses on-chain slot levels, not NFT passes
      </p>

      <Panel className="mt-6" title="Slot milestones">
        {ROYAL_NFT_MILESTONES.map((m) => (
          <p key={m.level} className="border-b border-white/5 py-2 text-sm text-slate-300">
            L{m.level}+ active → {m.label}
          </p>
        ))}
      </Panel>

      <Panel className="mt-4" title="NFT contracts">
        <div className="flex items-center justify-between py-3">
          <p className="text-sm text-slate-300">No NFT contracts in LAE Club Matrix plan</p>
          <Pill tone="gold">Not used</Pill>
        </div>
      </Panel>
    </AdminShell>
  );
}
