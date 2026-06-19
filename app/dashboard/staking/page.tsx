"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useStakingOnChain, useWalletOnChain } from "@/lib/contracts/hooks";
import {
  useApproveSlt,
  useSltAllowance,
  useStakeOnChain,
  useReleaseStake,
} from "@/lib/contracts/hooks/useWrites";
import { fmtEther } from "@/lib/contracts/format";
import { formatDate } from "@/lib/format";

export default function StakingPage() {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const stakes = useStakingOnChain();
  const wallet = useWalletOnChain();
  const allowance = useSltAllowance();
  const approve = useApproveSlt();
  const stake = useStakeOnChain();
  const release = useReleaseStake();

  if (stakes.isLoading) return <QueryLoading label="Loading stakes from chain…" />;

  const active = (stakes.data ?? []).filter((s) => !s.released);
  const released = (stakes.data ?? []).filter((s) => s.released);
  const lockedTotal = active.reduce((sum, s) => sum + s.amount, 0n);

  const stakeAmountValid = (() => {
    if (!amount) return false;
    try {
      return parseEther(amount) > 0n;
    } catch {
      return false;
    }
  })();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">LAE Staking</h1>
      <p className="mt-1 text-sm text-slate-400">
        365-day lock · Club L10+ or 5M LAE minimum eligibility
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Panel title="LAE balance">
          <p className="text-2xl font-bold text-white">
            {fmtEther(wallet.data?.sltBalance ?? 0n, 0)}
          </p>
        </Panel>
        <Panel title="Locked">
          <p className="text-2xl font-bold text-white">{fmtEther(lockedTotal, 0)}</p>
        </Panel>
        <Panel title="Active stakes">
          <p className="text-2xl font-bold text-white">{active.length}</p>
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
            disabled={busy !== null || !stakeAmountValid}
            className="btn-primary disabled:opacity-50"
            onClick={async () => {
              setBusy("stake");
              try {
                const wei = parseEther(amount);
                const allowed = allowance.data ?? 0n;
                if (allowed < wei) await approve();
                await stake(amount);
                setAmount("");
              } finally {
                setBusy(null);
              }
            }}
          >
            {busy === "stake" ? "Staking…" : "Stake"}
          </button>
        </div>
        <button
          type="button"
          className="mt-2 text-xs text-brand-300"
          onClick={async () => {
            setBusy("approve");
            try {
              await approve();
            } finally {
              setBusy(null);
            }
          }}
        >
          Approve LAE for staking contract
        </button>
      </Panel>

      <Panel className="mt-4" title="Active stakes">
        {active.length === 0 ? (
          <p className="text-sm text-slate-500">No active stakes</p>
        ) : (
          <div className="space-y-3">
            {active.map((s) => {
              const unlock = new Date(Number(s.lockEnd) * 1000);
              const canRelease = Date.now() >= unlock.getTime();
              return (
                <div
                  key={s.index}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">{fmtEther(s.amount, 0)} LAE</p>
                    <p className="text-xs text-slate-500">
                      Unlock: {formatDate(unlock.toISOString())}
                    </p>
                  </div>
                  {canRelease ? (
                    <button
                      type="button"
                      className="btn-primary text-xs"
                      disabled={busy === `release-${s.index}`}
                      onClick={async () => {
                        setBusy(`release-${s.index}`);
                        try {
                          await release(s.index);
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      Release
                    </button>
                  ) : (
                    <Pill tone="gold">Locked</Pill>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {released.length > 0 && (
        <Panel className="mt-4" title="Released stakes">
          {released.map((s) => (
            <div key={s.index} className="py-2 text-sm text-slate-400">
              #{s.index} · {fmtEther(s.amount, 0)} LAE · released
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
