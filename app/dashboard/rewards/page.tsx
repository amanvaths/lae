"use client";

import { useState } from "react";
import { Panel, StatCard } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import {
  useLaeUser,
  useLaeRewardSummary,
  useLaeVestingDirectRequirement,
  useClaimLaeRewards,
} from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { LAE_COIN_TOKENOMICS } from "@/lib/lae-club/constants";

export default function RewardsPage() {
  const user = useLaeUser();
  const rewards = useLaeRewardSummary();
  const vesting = useLaeVestingDirectRequirement(user.registeredAt);
  const claim = useClaimLaeRewards();
  const [msg, setMsg] = useState<string | null>(null);

  if (user.isLoading || rewards.isLoading) {
    return <QueryLoading label="Loading LAE rewards…" />;
  }

  if (!user.registered) {
    return (
      <Panel title="LAE Rewards">
        <p className="text-sm text-slate-400">Register on LAE Club Matrix to receive locked LAE rewards.</p>
      </Panel>
    );
  }

  async function onClaim() {
    setMsg(null);
    try {
      await claim.claim();
      setMsg("Claim submitted — confirm in your wallet.");
      rewards.refetch();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Claim failed");
    }
  }

  const directOk = rewards.directCount >= vesting.requiredDirects;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">LAE Rewards</h1>
      <p className="mt-1 text-sm text-slate-400">
        {LAE_COIN_TOKENOMICS.vestingMonths}-month vesting · {LAE_COIN_TOKENOMICS.monthlyReleaseBps / 100}% per
        month · direct qualification required
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total allocated" value={`${fmtEther(rewards.allocated, 4)} LAE`} />
        <StatCard label="Total claimed" value={`${fmtEther(rewards.claimed, 4)} LAE`} />
        <StatCard label="Available now" value={`${fmtEther(rewards.claimable, 4)} LAE`} accent="emerald" />
        <StatCard label="Next release (vested)" value={`${fmtEther(rewards.nextRelease, 4)} LAE`} />
        <StatCard label="Still locked" value={`${fmtEther(rewards.locked, 4)} LAE`} />
        <StatCard
          label="Direct requirement"
          value={`Month ${vesting.month}: need ${vesting.requiredDirects.toString()} · you have ${rewards.directCount.toString()}`}
        />
      </div>

      <Panel className="mt-6" title="Claim rewards">
        <p className="text-sm text-slate-400">
          Rewards unlock per-second over {LAE_COIN_TOKENOMICS.vestingMonths} months when you meet the monthly
          direct referral requirement. Unqualified amounts stay locked — they are never burned.
        </p>
        {!directOk && (
          <p className="mt-3 text-sm text-amber-400">
            You need {vesting.requiredDirects.toString()} direct referrals for month {vesting.month} to unlock
            this month&apos;s tranche.
          </p>
        )}
        <button
          type="button"
          className="btn-primary mt-4"
          disabled={rewards.claimable === 0n || claim.isPending || claim.isConfirming}
          onClick={() => void onClaim()}
        >
          {claim.isPending || claim.isConfirming ? "Claiming…" : "Claim LAE rewards"}
        </button>
        {msg && <p className="mt-3 text-sm text-slate-300">{msg}</p>}
        {claim.receipt.isSuccess && (
          <p className="mt-2 text-sm text-emerald-400">Claim confirmed on-chain.</p>
        )}
      </Panel>
    </div>
  );
}
