"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useWalletOnChain, useUserEventsOnChain } from "@/lib/contracts/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { formatDate, truncateAddress } from "@/lib/format";

export default function WalletPage() {
  const wallet = useWalletOnChain();
  const events = useUserEventsOnChain();

  if (wallet.isLoading) return <QueryLoading label="Loading on-chain wallet…" />;

  const w = wallet.data!;

  const incomeEvents = (events.data ?? []).filter((e) => e.eventName === "IncomePaid").slice(0, 20);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Wallet</h1>
      <p className="mt-1 text-sm text-slate-400">Live balances from BSC Testnet contracts</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Wallet mDAI", value: fmtEther(w.daiWallet) },
          { label: "Internal mDAI", value: fmtEther(w.daiInternal) },
          { label: "LAE Balance", value: fmtEther(w.sltBalance, 2) },
          { label: "Total Earnings", value: fmtEther(w.totalEarnings) },
          { label: "Total Withdrawals", value: fmtEther(w.totalWithdrawals) },
        ].map((item) => (
          <Panel key={item.label} title={item.label}>
            <p className="font-display text-2xl font-bold text-white">{item.value}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <Link href="/dashboard/deposit" className="btn-primary">
          <ArrowDownToLine className="h-4 w-4" /> Deposit
        </Link>
        <Link href="/dashboard/withdraw" className="btn-ghost">
          <ArrowUpFromLine className="h-4 w-4" /> Withdraw
        </Link>
      </div>

      <Panel className="mt-6" title="Recent IncomePaid events">
        {events.isLoading ? (
          <QueryLoading />
        ) : incomeEvents.length === 0 ? (
          <p className="text-sm text-slate-500">No income events yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {incomeEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{e.eventName}</p>
                  <p className="text-xs text-slate-500">
                    L{String(e.args.level ?? "—")} · type {String(e.args.incomeType ?? "—")}
                  </p>
                </div>
                <p className="text-emerald-400">
                  +{fmtEther(BigInt(String(e.args.amount ?? 0)))}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
