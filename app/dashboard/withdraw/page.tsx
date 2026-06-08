"use client";

import { useState } from "react";
import { ArrowUpFromLine, Bitcoin, Zap, ShieldCheck } from "lucide-react";
import { PageHeading, Panel, Pill, StatCard, InfoNote } from "@/components/dashboard/ui";
import { wallet, transactions, fmtBtc, btcToUsd } from "@/lib/dashboard-data";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [addr, setAddr] = useState("");
  const amt = parseFloat(amount) || 0;
  const valid = amt > 0 && amt <= wallet.available && addr.length > 6;

  return (
    <div>
      <PageHeading
        icon={ArrowUpFromLine}
        title="Withdraw"
        subtitle="Automatic and instant withdrawals — no withdrawal charges, no hidden fees, no admin approval."
        action={<Pill tone="emerald"><Zap className="h-3.5 w-3.5" /> Instant settlement</Pill>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Available" value={fmtBtc(wallet.available, 4)} sub={btcToUsd(wallet.available)} icon={Bitcoin} accent="emerald" />
        <StatCard label="Withdrawal fee" value="0 BTC" sub="No charges ever" accent="brand" />
        <StatCard label="Total withdrawn" value={fmtBtc(wallet.totalWithdrawn, 4)} accent="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Request withdrawal">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Amount (BTC)</span>
            <div className="relative">
              <Bitcoin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-400" />
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0000"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-16 font-mono text-sm text-white outline-none focus:border-brand-500/50"
              />
              <button
                onClick={() => setAmount(wallet.available.toString())}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-brand-300 hover:bg-white/10"
              >
                MAX
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              ≈ {btcToUsd(amt)} · Available {wallet.available.toFixed(4)} BTC
            </p>
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Destination address</span>
            <input
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="bc1q…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 px-4 font-mono text-sm text-white outline-none focus:border-brand-500/50"
            />
          </label>

          {amt > wallet.available && (
            <p className="mt-2 text-xs text-red-400">Amount exceeds available balance.</p>
          )}

          <button
            disabled={!valid}
            className={`mt-5 w-full justify-center ${valid ? "btn-primary" : "cursor-not-allowed rounded-full border border-white/8 py-3 text-sm text-slate-600 inline-flex items-center gap-2"}`}
          >
            <ArrowUpFromLine className="h-4 w-4" /> Withdraw {amt > 0 ? `${amt.toFixed(4)} BTC` : ""}
          </button>

          <InfoNote>
            <ShieldCheck className="mr-1 inline h-4 w-4" />
            Withdrawals are executed by smart contract and confirm in under a second.
          </InfoNote>
        </Panel>

        <Panel title="Recent withdrawals">
          <div className="flex flex-col divide-y divide-white/5">
            {transactions.filter((t) => t.type === "withdraw").map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-white">{tx.label}</p>
                  <p className="text-xs text-slate-500">{tx.date} · {tx.hash}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-red-300">{tx.amount.toFixed(4)}</p>
                  <Pill tone={tx.status === "completed" ? "emerald" : "gold"}>{tx.status}</Pill>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
