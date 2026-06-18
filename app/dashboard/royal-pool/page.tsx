"use client";

import { Panel } from "@/components/dashboard/ui";
import { ChainQueryState } from "@/components/dashboard/ChainQueryState";
import { useWalletOnChain, useUserEventsOnChain } from "@/lib/contracts/hooks";
import { fmtEther } from "@/lib/contracts/format";

export default function RoyalPoolPage() {
  const wallet = useWalletOnChain();
  const events = useUserEventsOnChain();

  const income = (events.data ?? []).filter((e) => e.eventName === "IncomePaid");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Royal Pool</h1>
      <p className="mt-1 text-sm text-slate-400">Earnings from on-chain IncomePaid events</p>
      <ChainQueryState query={wallet}>
        {(w) => (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Panel title="Total earned">
              <p className="text-2xl font-bold text-white">{fmtEther(w.totalEarnings)} mDAI</p>
            </Panel>
            <Panel title="Income events">
              <p className="text-2xl font-bold text-white">{income.length}</p>
            </Panel>
          </div>
        )}
      </ChainQueryState>
    </div>
  );
}
