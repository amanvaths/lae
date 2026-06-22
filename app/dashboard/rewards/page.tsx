"use client";

import { useEffect, useState } from "react";
import { Panel, StatCard } from "@/components/dashboard/ui";
import { QueryLoading, QueryError } from "@/components/dashboard/QueryState";
import {
  useLaeUser,
  useLaeRewardSummary,
  useLaeVestingDirectRequirement,
  useClaimLaeRewards,
} from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { LAE_COIN_TOKENOMICS } from "@/lib/lae-club/constants";
import { formatWalletError } from "@/lib/wallet/errors";

export default function RewardsPage() {
  const user = useLaeUser();
  const rewards = useLaeRewardSummary();
  const vesting = useLaeVestingDirectRequirement(user.registeredAt);
  const claim = useClaimLaeRewards();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (claim.receipt.isSuccess) {
      rewards.refetch();
    }
  }, [claim.receipt.isSuccess, claim.receipt.data?.transactionHash, rewards.refetch]);

  if (user.isLoading || rewards.isLoading) {
    return <QueryLoading label="Loading LAE rewards…" />;
  }

  if (user.isError) {
    return (
      <QueryError
        message="Could not load user profile — wallet disconnected or contract unavailable"
        onRetry={() => user.refetch()}
      />
    );
  }

  if (!user.registered) {
    return (
      <Panel title="LAE Rewards">
        <p className="text-sm text-slate-400">User not registered — register on LAE Club Matrix first.</p>
      </Panel>
    );
  }

  async function onClaim() {
    setMsg(null);
    try {
      await claim.claim();
      setMsg("Claim submitted — confirm in your wallet.");
    } catch (e) {
      setMsg(formatWalletError(e));
    }
  }

  const directOk = rewards.directCount >= vesting.requiredDirects;
  const canClaim =
    rewards.claimable > 0n && directOk && !claim.isPending && !claim.isConfirming;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">LAE Rewards</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        {LAE_COIN_TOKENOMICS.vestingMonths}-month vesting · {LAE_COIN_TOKENOMICS.monthlyReleaseBps / 100}% per
        month · direct qualification required
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-ink-900/80 p-4 backdrop-blur-xl transition-all duration-500 hover:border-[#D4AF37]/40 hover:shadow-glow-gold sm:p-5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-[#D4AF37]/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <p className="relative text-[0.65rem] font-medium uppercase tracking-wider text-[#D4AF37]/70 sm:text-xs">Total allocated</p>
          <p className="relative mt-1.5 truncate font-display text-xl font-bold text-gradient-gold sm:text-2xl">{fmtEther(rewards.allocated, 4)} LAE</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[#C0C0C0]/20 bg-ink-900/80 p-4 backdrop-blur-xl transition-all duration-500 hover:border-[#C0C0C0]/40 hover:shadow-[0_0_40px_-10px_rgba(192,192,192,0.2)] sm:p-5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-[#C0C0C0]/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <p className="relative text-[0.65rem] font-medium uppercase tracking-wider text-[#C0C0C0]/70 sm:text-xs">Total claimed</p>
          <p className="relative mt-1.5 truncate font-display text-xl font-bold text-[#C0C0C0] sm:text-2xl">{fmtEther(rewards.claimed, 4)} LAE</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-ink-900/80 p-4 backdrop-blur-xl transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] sm:p-5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <p className="relative text-[0.65rem] font-medium uppercase tracking-wider text-emerald-400/70 sm:text-xs">Available now</p>
          <p className="relative mt-1.5 truncate font-display text-xl font-bold text-emerald-400 sm:text-2xl">{fmtEther(rewards.claimable, 4)} LAE</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-ink-900/80 p-4 backdrop-blur-xl transition-all duration-500 hover:border-[#D4AF37]/40 hover:shadow-glow-gold sm:p-5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-[#D4AF37]/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <p className="relative text-[0.65rem] font-medium uppercase tracking-wider text-[#D4AF37]/70 sm:text-xs">Next release (vested)</p>
          <p className="relative mt-1.5 truncate font-display text-xl font-bold text-gradient-gold sm:text-2xl">{fmtEther(rewards.nextRelease, 4)} LAE</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/80 p-4 backdrop-blur-xl transition-all duration-500 hover:border-white/[0.15] sm:p-5">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">Still locked</p>
          <p className="mt-1.5 truncate font-display text-xl font-bold text-white sm:text-2xl">{fmtEther(rewards.locked, 4)} LAE</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/80 p-4 backdrop-blur-xl transition-all duration-500 hover:border-white/[0.15] sm:p-5">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">Direct requirement</p>
          <p className="mt-1.5 truncate font-display text-base font-bold text-white sm:text-lg">
            Month {vesting.month}: need {vesting.requiredDirects.toString()} · you have{" "}
            <span className={rewards.directCount >= vesting.requiredDirects ? "text-emerald-400" : "text-red-400"}>
              {rewards.directCount.toString()}
            </span>
          </p>
        </div>
      </div>

      <Panel className="mt-6 border-[#D4AF37]/15" title="Claim rewards">
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
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/20 to-[#B8860B]/20 px-6 py-2.5 text-sm font-semibold text-[#D4AF37] transition-all duration-300 hover:from-[#D4AF37]/30 hover:to-[#B8860B]/30 hover:shadow-glow-gold disabled:opacity-40 disabled:hover:shadow-none"
          disabled={!canClaim}
          onClick={() => void onClaim()}
        >
          {claim.isPending || claim.isConfirming ? "Claiming…" : "Claim LAE rewards"}
        </button>
        {msg && <p className="mt-3 text-sm text-slate-300">{msg}</p>}
        {claim.error && (
          <p className="mt-2 text-sm text-red-400">{formatWalletError(claim.error)}</p>
        )}
        {claim.receipt.isSuccess && (
          <p className="mt-2 text-sm text-emerald-400">Claim confirmed on-chain.</p>
        )}
      </Panel>
    </div>
  );
}
