"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useReferralsOnChain } from "@/lib/contracts/hooks";
import { truncateAddress } from "@/lib/format";

export default function GenealogyPage() {
  const referrals = useReferralsOnChain();

  if (referrals.isLoading) return <QueryLoading label="Loading genealogy…" />;

  const direct = referrals.data?.direct ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Genealogy</h1>
      <p className="mt-1 text-sm text-slate-400">Direct referral line from on-chain mapping</p>
      <Panel className="mt-6" title="Level 1 — Direct">
        {direct.length === 0 ? (
          <p className="text-sm text-slate-500">No direct referrals</p>
        ) : (
          <ul className="space-y-2">
            {direct.map((addr) => (
              <li key={addr} className="font-mono text-sm text-white">
                {truncateAddress(addr)}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
