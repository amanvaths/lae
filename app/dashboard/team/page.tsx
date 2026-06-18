"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useAnalyticsTeam } from "@/lib/hooks/useAnalytics";
import { useReferralsOnChain } from "@/lib/contracts/hooks";
import { truncateAddress } from "@/lib/format";

export default function TeamPage() {
  const analytics = useAnalyticsTeam();
  const chain = useReferralsOnChain();

  const useApi = analytics.isSuccess && analytics.data;
  const loading = useApi ? analytics.isLoading : chain.isLoading;

  if (loading) return <QueryLoading label="Loading team…" />;

  const direct = useApi
    ? analytics.data!.direct.map((d) => d.referralAddress)
    : chain.data?.direct ?? [];

  const qualifiedClub = useApi
    ? analytics.data!.qualifiedClub
    : chain.data?.qualifiedClub ?? 0;
  const qualifiedPilot = useApi
    ? analytics.data!.qualifiedPilot
    : chain.data?.qualifiedPilot ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">My Team</h1>
      <p className="mt-1 text-sm text-slate-400">
        Direct referrals {useApi ? "from blockchain indexer" : "from on-chain mapping"}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Panel title="Direct team">
          <p className="text-2xl font-bold text-white">
            {useApi ? analytics.data!.directCount : direct.length}
          </p>
        </Panel>
        <Panel title="Qualified club">
          <p className="text-2xl font-bold text-white">{qualifiedClub}</p>
        </Panel>
        <Panel title="Qualified pilot">
          <p className="text-2xl font-bold text-white">{qualifiedPilot}</p>
        </Panel>
      </div>

      <Panel className="mt-6" title="Team members">
        {direct.length === 0 ? (
          <p className="text-sm text-slate-500">No team members yet</p>
        ) : (
          direct.map((addr) => (
            <div key={addr} className="border-b border-white/5 py-3 font-mono text-sm text-white">
              {truncateAddress(addr)}
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}
