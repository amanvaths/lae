"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet as WalletIcon,
  Bitcoin,
  Lock,
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  Check,
} from "lucide-react";
import { PageHeading, Panel, Pill, StatCard } from "@/components/dashboard/ui";
import { wallet, transactions, fmtBtc, btcToUsd } from "@/lib/dashboard-data";

export default function WalletPage() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(wallet.btcAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div>
      <PageHeading
        icon={WalletIcon}
        title="Wallet"
        subtitle="Your non-custodial Bitcoin wallet. Funds settle instantly with no withdrawal charges."
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/deposit" className="btn-ghost !px-4 !py-2.5">
              <ArrowDownToLine className="h-4 w-4" /> Deposit
            </Link>
            <Link href="/dashboard/withdraw" className="btn-primary !px-4 !py-2.5">
              <ArrowUpFromLine className="h-4 w-4" /> Withdraw
            </Link>
          </div>
        }
      />

      {/* Balance hero */}
      <div className="glass relative mb-5 overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold-400/10 blur-3xl" />
        <p className="text-sm text-slate-400">Available balance</p>
        <div className="mt-2 flex items-end gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950">
            <Bitcoin className="h-7 w-7" />
          </span>
          <div>
            <p className="font-display text-4xl font-bold text-white">
              {wallet.available.toFixed(4)} <span className="text-xl text-slate-400">BTC</span>
            </p>
            <p className="text-sm text-slate-500">{btcToUsd(wallet.available)}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Your BTC deposit address</p>
            <p className="truncate font-mono text-sm text-brand-200">{wallet.btcAddress}</p>
          </div>
          <button onClick={copy} className="btn-ghost shrink-0 !px-4 !py-2 text-sm">
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy address"}
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <StatCard label="Available" value={fmtBtc(wallet.available, 4)} icon={Bitcoin} accent="emerald" />
        <StatCard label="Locked in slots" value={fmtBtc(wallet.locked, 4)} icon={Lock} accent="brand" />
        <StatCard label="Total earned" value={fmtBtc(wallet.totalEarned, 4)} accent="gold" />
        <StatCard label="Total withdrawn" value={fmtBtc(wallet.totalWithdrawn, 4)} accent="violet" />
      </div>

      <Panel title="Recent wallet activity" action={
        <Link href="/dashboard/transactions" className="text-sm font-medium text-brand-300 hover:text-brand-200">
          View all →
        </Link>
      }>
        <div className="flex flex-col divide-y divide-white/5">
          {transactions.filter((t) => ["deposit", "withdraw", "income", "recycle"].includes(t.type)).slice(0, 6).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${tx.amount >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {tx.amount >= 0 ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{tx.label}</p>
                  <p className="text-xs text-slate-500">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-400" : "text-red-300"}`}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(4)}
                </p>
                <Pill tone={tx.status === "completed" ? "emerald" : "gold"}>{tx.status}</Pill>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
