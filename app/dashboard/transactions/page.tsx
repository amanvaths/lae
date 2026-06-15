"use client";

import { useState } from "react";
import {
  ReceiptText,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Crown,
  Medal,
  Layers,
  TrendingUp,
} from "lucide-react";
import { PageHeading, Panel, Pill } from "@/components/dashboard/ui";
import { transactions, fmtBtc, type Tx } from "@/lib/dashboard-data";

const typeMeta: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  income: { icon: TrendingUp, tone: "text-emerald-400 bg-emerald-500/10" },
  recycle: { icon: RefreshCw, tone: "text-brand-400 bg-brand-500/10" },
  royal: { icon: Crown, tone: "text-gold-400 bg-gold-400/10" },
  rank: { icon: Medal, tone: "text-accent-400 bg-accent-500/10" },
  slot: { icon: Layers, tone: "text-violet-400 bg-accent-500/10" },
  deposit: { icon: ArrowDownToLine, tone: "text-emerald-400 bg-emerald-500/10" },
  withdraw: { icon: ArrowUpFromLine, tone: "text-red-400 bg-red-500/10" },
};

const filters = ["all", "income", "recycle", "royal", "rank", "slot", "deposit", "withdraw"] as const;

export default function TransactionsPage() {
  const [f, setF] = useState<(typeof filters)[number]>("all");
  const rows = transactions.filter((t) => f === "all" || t.type === f);

  return (
    <div>
      <PageHeading
        icon={ReceiptText}
        title="Transactions"
        subtitle="A complete, on-chain record of every income, recycle, slot activation, deposit and withdrawal."
      />

      <Panel
        title="All transactions"
        action={
          <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:overflow-visible sm:pb-0">
            {filters.map((x) => (
              <button
                key={x}
                onClick={() => setF(x)}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize transition-colors sm:px-3 ${
                  f === x ? "bg-brand-500/20 text-brand-200" : "bg-white/[0.04] text-slate-400 hover:text-white"
                }`}
              >
                {x}
              </button>
            ))}
          </div>
        }
      >
        {/* Mobile cards */}
        <div className="flex flex-col gap-3 md:hidden">
          {rows.map((tx: Tx) => {
            const meta = typeMeta[tx.type] ?? typeMeta.income;
            const Icon = meta.icon;
            return (
              <div
                key={tx.id}
                className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{tx.label}</p>
                      <p className="font-mono text-xs text-slate-500">{tx.id}</p>
                    </div>
                  </div>
                  <p className={`shrink-0 font-mono text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-400" : "text-red-300"}`}>
                    {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(4)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                  <Pill tone="slate">{tx.type}</Pill>
                  <Pill tone={tx.status === "completed" ? "emerald" : "gold"}>{tx.status}</Pill>
                  <span className="text-xs text-slate-500">{tx.date}</span>
                </div>
                <p className="mt-2 truncate font-mono text-xs text-brand-300">{tx.hash}</p>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3">Transaction</th>
                <th className="py-3">Type</th>
                <th className="py-3">Tx hash</th>
                <th className="py-3">Date</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx: Tx) => {
                const meta = typeMeta[tx.type] ?? typeMeta.income;
                const Icon = meta.icon;
                return (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 place-items-center rounded-lg ${meta.tone}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-medium text-white">{tx.label}</p>
                          <p className="font-mono text-xs text-slate-500">{tx.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3"><Pill tone="slate">{tx.type}</Pill></td>
                    <td className="py-3 font-mono text-xs text-brand-300">{tx.hash}</td>
                    <td className="py-3 text-slate-400">{tx.date}</td>
                    <td className="py-3"><Pill tone={tx.status === "completed" ? "emerald" : "gold"}>{tx.status}</Pill></td>
                    <td className={`py-3 text-right font-mono font-semibold ${tx.amount >= 0 ? "text-emerald-400" : "text-red-300"}`}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <p className="py-8 text-center text-sm text-slate-500">No transactions of this type.</p>
        )}
      </Panel>
    </div>
  );
}
