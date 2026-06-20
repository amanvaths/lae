"use client";

import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { ROYAL_NFT_MILESTONES } from "@/lib/lae-club/constants";
import { useLaeAllMatrixLevels, useLaeNftStatus, useLaeUser } from "@/lib/lae-club/hooks";
import { LAE_CONTRACTS, addressUrl } from "@/lib/lae-club/contracts";
import { truncateAddress } from "@/lib/format";

export default function NftPage() {
  const user = useLaeUser();
  const nft = useLaeNftStatus();
  const levels = useLaeAllMatrixLevels();

  if (user.isLoading || nft.isLoading) {
    return <QueryLoading label="Loading NFT eligibility from chain…" />;
  }

  const ranks = [
    { label: "Registration Pass", active: nft.registrationPass, contract: LAE_CONTRACTS.registrationNft },
    { label: "Royal Rank 1", active: nft.royalRank1, contract: LAE_CONTRACTS.royalRank1, need: 3 },
    { label: "Royal Rank 2", active: nft.royalRank2, contract: LAE_CONTRACTS.royalRank2, need: 6 },
    { label: "Royal Rank 3", active: nft.royalRank3, contract: LAE_CONTRACTS.royalRank3, need: 9 },
    { label: "Royal Rank 4", active: nft.royalRank4, contract: LAE_CONTRACTS.royalRank4, need: 12 },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">NFT Status</h1>
      <p className="mt-1 text-sm text-slate-400">
        Eligibility derived from live active levels (isUserSlotActive) · User #{String(user.userId ?? "—")}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Panel title="Active levels">
          <p className="text-2xl font-bold text-white">{levels.activeCount} / 12</p>
        </Panel>
        <Panel title="Royal milestones">
          <div className="space-y-1 text-sm">
            {ROYAL_NFT_MILESTONES.map((m) => (
              <p key={m.level} className="text-slate-400">
                L{m.level}+ · {m.label}
              </p>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-6" title="Your NFT eligibility">
        {ranks.map((r) => (
          <div
            key={r.label}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-3"
          >
            <div>
              <p className="font-medium text-white">{r.label}</p>
              {"need" in r && (
                <p className="text-xs text-slate-500">Requires L{r.need}+ active</p>
              )}
              {r.contract !== "0x0000000000000000000000000000000000000000" && (
                <a
                  href={addressUrl(r.contract)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-300 hover:underline"
                >
                  {truncateAddress(r.contract)}
                </a>
              )}
            </div>
            <Pill tone={r.active ? "emerald" : "gold"}>{r.active ? "Eligible" : "Locked"}</Pill>
          </div>
        ))}
      </Panel>
    </div>
  );
}
