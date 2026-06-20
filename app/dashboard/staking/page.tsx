"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useLaeCoinStats, useLaeStaking } from "@/lib/lae-club/hooks";
import { LAE_CONTRACTS } from "@/lib/lae-club/contracts";
import { laeCoinAbi, laeStakingAbi } from "@/lib/lae-club/abis";
import { fmtEther } from "@/lib/contracts/format";
import { useToast } from "@/providers/ToastProvider";

export default function StakingPage() {
  const { address } = useAccount();
  const { push } = useToast();
  const staking = useLaeStaking();
  const coin = useLaeCoinStats();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  if (staking.isLoading) {
    return <QueryLoading label="Loading staking from chain…" />;
  }

  const apr = Number(staking.aprBps) / 100;

  async function approveAndStake() {
    if (!address || !amount) return;
    setBusy("stake");
    try {
      const wei = parseEther(amount);
      push("Approve LAE for staking…", "info");
      await writeContractAsync({
        address: LAE_CONTRACTS.laeCoin,
        abi: laeCoinAbi,
        functionName: "approve",
        args: [LAE_CONTRACTS.staking, wei],
      });
      push("Stake LAE…", "info");
      await writeContractAsync({
        address: LAE_CONTRACTS.staking,
        abi: laeStakingAbi,
        functionName: "stake",
        args: [wei],
      });
      push("Stake submitted", "success");
      setAmount("");
    } catch (e) {
      push(e instanceof Error ? e.message : "Stake failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function claim() {
    setBusy("claim");
    try {
      await writeContractAsync({
        address: LAE_CONTRACTS.staking,
        abi: laeStakingAbi,
        functionName: "claim",
      });
      push("Rewards claimed", "success");
    } catch (e) {
      push(e instanceof Error ? e.message : "Claim failed", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">LAE Staking</h1>
      <p className="mt-1 text-sm text-slate-400">
        Live reads from staking contract · APR {apr}% · global TVL{" "}
        {fmtEther(staking.totalStakedGlobal, 0)} LAE
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <Panel title="Your stake">
          <p className="text-2xl font-bold text-white">
            {fmtEther(staking.stakedAmount, 0)} LAE
          </p>
          {staking.active ? <Pill tone="emerald">Active</Pill> : <Pill tone="gold">Not staked</Pill>}
        </Panel>
        <Panel title="Pending reward">
          <p className="text-2xl font-bold text-emerald-400">
            {fmtEther(staking.pendingReward, 0)} LAE
          </p>
        </Panel>
        <Panel title="Global staked">
          <p className="text-2xl font-bold text-white">
            {fmtEther(staking.totalStakedGlobal, 0)}
          </p>
        </Panel>
        <Panel title="Circulating supply">
          <p className="text-2xl font-bold text-white">
            {coin.circulating ? fmtEther(coin.circulating, 0) : "—"}
          </p>
        </Panel>
      </div>

      <Panel className="mt-6" title="Stake LAE">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="LAE amount"
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none"
          />
          <button
            type="button"
            disabled={busy !== null || !amount}
            className="btn-primary disabled:opacity-50"
            onClick={approveAndStake}
          >
            {busy === "stake" ? "Staking…" : "Stake"}
          </button>
          <button
            type="button"
            disabled={busy !== null || staking.pendingReward === 0n}
            className="btn-ghost disabled:opacity-50"
            onClick={claim}
          >
            {busy === "claim" ? "Claiming…" : "Claim rewards"}
          </button>
        </div>
      </Panel>
    </div>
  );
}
