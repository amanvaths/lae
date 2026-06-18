"use client";

import { useState } from "react";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useWalletOnChain, useUserEventsOnChain } from "@/lib/contracts/hooks";
import { useWithdrawOnChain } from "@/lib/contracts/hooks/useWrites";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { parseEther, formatEther } from "viem";
import { txUrl } from "@/lib/contracts/addresses";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const wallet = useWalletOnChain();
  const events = useUserEventsOnChain();
  const withdraw = useWithdrawOnChain();

  if (wallet.isLoading) return <QueryLoading label="Loading on-chain balance…" />;

  const max = wallet.data?.daiInternal ?? 0n;

  const withdrawEvents = (events.data ?? []).filter((e) => e.eventName === "Withdraw");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Withdraw</h1>
      <p className="mt-1 text-sm text-slate-400">
        Internal balance: {fmtEther(max)} mDAI (from LAE matrix contract)
      </p>

      <Panel className="mt-6" title="Withdraw on-chain">
        <p className="mb-3 text-sm text-slate-400">
          Calls <code className="text-brand-200">withdraw(amount, withdrawRef)</code> — unique ref
          generated automatically.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount in mDAI"
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-brand-500/50"
          />
          <button
            type="button"
            disabled={
              pending ||
              !amount ||
              (() => {
                try {
                  return parseEther(amount) > max;
                } catch {
                  return true;
                }
              })()
            }
            onClick={async () => {
              setPending(true);
              try {
                await withdraw(amount);
                setAmount("");
              } finally {
                setPending(false);
              }
            }}
            className="btn-primary disabled:opacity-50"
          >
            {pending ? "Withdrawing…" : "Withdraw"}
          </button>
        </div>
        <button
          type="button"
          className="mt-2 text-xs text-brand-300"
          onClick={() => setAmount(formatEther(max))}
        >
          Max: {fmtEther(max)}
        </button>
      </Panel>

      <Panel className="mt-4" title="Withdrawal history (on-chain events)">
        {events.isLoading ? (
          <QueryLoading />
        ) : withdrawEvents.length === 0 ? (
          <p className="text-sm text-slate-500">No withdrawals yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {withdrawEvents.map((w) => (
              <div key={w.id} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="text-white">{fmtEther(BigInt(String(w.args.amount ?? 0)))} mDAI</p>
                  <a
                    href={txUrl(w.transactionHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-300 hover:underline"
                  >
                    {truncateAddress(w.transactionHash)}
                  </a>
                </div>
                <span className="text-emerald-400">Confirmed</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
