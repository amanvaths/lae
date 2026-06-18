"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useAnalyticsReferrals } from "@/lib/hooks/useAnalytics";
import { useReferralsOnChain } from "@/lib/contracts/hooks";
import { truncateAddress } from "@/lib/format";

export default function ReferralsPage() {
  const analytics = useAnalyticsReferrals();
  const chain = useReferralsOnChain();

  const useApi = analytics.isSuccess && analytics.data;
  const loading = useApi ? analytics.isLoading : chain.isLoading;

  if (loading) return <QueryLoading label="Loading referrals…" />;

  const direct = useApi
    ? analytics.data!.map((r) => r.referralAddress)
    : chain.data?.direct ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Direct Referrals</h1>
      <p className="mt-1 text-sm text-slate-400">
        {direct.length} direct
        {!useApi &&
          ` · ${chain.data?.qualifiedClub ?? 0} qualified club · ${chain.data?.qualifiedPilot ?? 0} qualified pilot`}
      </p>

      <Panel className="mt-6" title="Referral wallets">
        {direct.length === 0 ? (
          <p className="text-sm text-slate-500">Share your link to grow your team</p>
        ) : (
          <div className="divide-y divide-white/5">
            {direct.map((addr, i) => (
              <div key={addr} className="flex justify-between py-3 text-sm">
                <span className="text-slate-400">#{i + 1}</span>
                <span className="font-mono text-white">{truncateAddress(addr)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
