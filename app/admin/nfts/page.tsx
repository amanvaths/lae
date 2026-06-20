"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { Panel, Pill } from "@/components/dashboard/ui";
import { useLaeProtocolStats } from "@/lib/lae-club/hooks";
import { LAE_CONTRACTS, addressUrl } from "@/lib/lae-club/contracts";
import { ROYAL_NFT_MILESTONES } from "@/lib/lae-club/constants";
import { truncateAddress } from "@/lib/format";

export default function AdminNftsPage() {
  const protocol = useLaeProtocolStats();

  const contracts = [
    { label: "Registration Pass NFT", addr: LAE_CONTRACTS.registrationNft },
    { label: "Royal Rank 1 NFT", addr: LAE_CONTRACTS.royalRank1 },
    { label: "Royal Rank 2 NFT", addr: LAE_CONTRACTS.royalRank2 },
    { label: "Royal Rank 3 NFT", addr: LAE_CONTRACTS.royalRank3 },
    { label: "Royal Rank 4 NFT", addr: LAE_CONTRACTS.royalRank4 },
  ];

  return (
    <AdminShell title="NFTs">
      <h1 className="font-display text-2xl font-bold">NFT Stats</h1>
      <p className="mt-1 text-sm text-slate-400">
        {protocol.totalUsers} registered users · eligibility tied to active matrix levels
      </p>

      <Panel className="mt-6" title="Royal rank milestones">
        {ROYAL_NFT_MILESTONES.map((m) => (
          <p key={m.level} className="border-b border-white/5 py-2 text-sm text-slate-300">
            L{m.level}+ active → {m.label}
          </p>
        ))}
      </Panel>

      <Panel className="mt-4" title="NFT contracts">
        {contracts.map((c) => {
          const deployed = c.addr !== "0x0000000000000000000000000000000000000000";
          return (
            <div key={c.label} className="flex items-center justify-between border-b border-white/5 py-3">
              <div>
                <p className="text-sm text-white">{c.label}</p>
                {deployed ? (
                  <a
                    href={addressUrl(c.addr)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-brand-300 hover:underline"
                  >
                    {truncateAddress(c.addr)}
                  </a>
                ) : (
                  <p className="text-xs text-slate-500">Not configured</p>
                )}
              </div>
              <Pill tone={deployed ? "emerald" : "gold"}>
                {deployed ? "Configured" : "Pending deploy"}
              </Pill>
            </div>
          );
        })}
      </Panel>
    </AdminShell>
  );
}
