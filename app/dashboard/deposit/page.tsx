"use client";

import { useState } from "react";
import { ArrowDownToLine, Copy, Check, Zap, Bitcoin } from "lucide-react";
import { PageHeading, Panel, Pill, InfoNote } from "@/components/dashboard/ui";
import { wallet, slots, user, btcToUsd } from "@/lib/dashboard-data";

export default function DepositPage() {
  const [copied, setCopied] = useState(false);
  const nextSlot = slots.find((s) => s.id === user.highestSlot + 1);
  const [amount, setAmount] = useState(nextSlot?.price.toString() ?? "0.001");

  const copy = () => {
    navigator.clipboard?.writeText(wallet.btcAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div>
      <PageHeading
        icon={ArrowDownToLine}
        title="Deposit & Activate"
        subtitle="Add BTC to activate slots. Just start with 0.001 BTC — the engine handles upgrades automatically from there."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Deposit Bitcoin">
          <p className="mb-3 text-sm text-slate-400">Send BTC to your address below. Deposits are credited after 1 confirmation.</p>
          <div className="grid place-items-center rounded-xl border border-white/10 bg-white/[0.03] p-6">
            {/* faux QR */}
            <div className="grid grid-cols-8 gap-0.5">
              {Array.from({ length: 64 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-3.5 w-3.5 rounded-[2px] ${
                    (i * 7 + (i % 5) + (i % 3)) % 3 === 0 ? "bg-white" : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <Bitcoin className="h-4 w-4 shrink-0 text-gold-400" />
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-brand-200">{wallet.btcAddress}</span>
            <button onClick={copy} className="shrink-0 text-slate-400 hover:text-white">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <InfoNote>
            <span className="font-medium">Network:</span> Bitcoin (BTC). Only send BTC to this address.
          </InfoNote>
        </Panel>

        <Panel title="Activate a slot">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Amount (BTC)</span>
            <div className="relative">
              <Bitcoin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-400" />
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-4 font-mono text-sm text-white outline-none focus:border-brand-500/50"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">≈ {btcToUsd(parseFloat(amount) || 0)}</p>
          </label>

          <p className="mb-2 mt-4 text-xs uppercase tracking-wider text-slate-500">Quick select slot</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.slice(0, 8).map((s) => (
              <button
                key={s.id}
                onClick={() => setAmount(s.price.toString())}
                className={`rounded-lg border px-2 py-2 text-center text-xs transition-colors ${
                  amount === s.price.toString()
                    ? "border-brand-500/50 bg-brand-500/15 text-white"
                    : "border-white/8 bg-white/[0.02] text-slate-400 hover:text-white"
                }`}
              >
                <span className="block font-semibold">Slot {s.id}</span>
                <span className="font-mono text-[11px]">{s.price}</span>
              </button>
            ))}
          </div>

          {nextSlot && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-500/20 bg-brand-500/[0.06] p-3">
              <span className="text-sm text-slate-300">Next slot to activate</span>
              <Pill tone="brand">Slot {nextSlot.id} · {nextSlot.price} BTC</Pill>
            </div>
          )}

          <button className="btn-primary mt-5 w-full justify-center">
            <Zap className="h-4 w-4" /> Activate now
          </button>
        </Panel>
      </div>
    </div>
  );
}
