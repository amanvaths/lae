"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useReferralsOnChain, useSensoUser } from "@/lib/contracts/hooks";
import { referralLink } from "@/lib/contracts/services/utils";
import { truncateAddress } from "@/lib/format";

export default function SharePage() {
  const { address } = useAccount();
  const user = useSensoUser();
  const referrals = useReferralsOnChain();

  const link = address ? referralLink(address) : "";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Share &amp; Refer</h1>
      <p className="mt-1 text-sm text-slate-400">On-chain referral link — sponsor = your wallet</p>

      <Panel className="mt-6" title="Your referral link">
        <code className="block break-all rounded-lg bg-black/30 p-3 text-sm text-brand-200">
          {link || "Connect wallet"}
        </code>
        <p className="mt-2 text-xs text-slate-500">
          New users register with <code className="text-brand-200">register(yourAddress)</code>
        </p>
      </Panel>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel title="Direct referrals">
          {referrals.isLoading ? (
            <QueryLoading />
          ) : (
            <p className="text-2xl font-bold text-white">{referrals.data?.direct.length ?? 0}</p>
          )}
        </Panel>
        <Panel title="Qualified (Club L4+)">
          <p className="text-2xl font-bold text-white">{referrals.data?.qualifiedClub ?? 0}</p>
        </Panel>
        <Panel title="Qualified (Pilot)">
          <p className="text-2xl font-bold text-white">{referrals.data?.qualifiedPilot ?? 0}</p>
        </Panel>
        <Panel title="Your sponsor">
          <p className="font-mono text-sm text-white">
            {user.data?.registered ? truncateAddress(user.data.sponsor) : "—"}
          </p>
        </Panel>
      </div>

      <Panel className="mt-4" title="Direct referral wallets">
        {referrals.isLoading ? (
          <QueryLoading />
        ) : (referrals.data?.direct.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-500">No direct referrals yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {referrals.data!.direct.map((addr) => (
              <div key={addr} className="py-2 font-mono text-sm text-white">
                {truncateAddress(addr)}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Link href="/dashboard/referrals" className="btn-ghost mt-4 inline-flex">
        View all referrals
      </Link>
    </div>
  );
}
