"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Star,
  Search,
  SlidersHorizontal,
  ThumbsUp,
  Clock,
  ChevronDown,
} from "lucide-react";
import {
  offers as allOffers,
  fiats,
  fiatRate,
  methodColor,
  type Offer,
  type Fiat,
  type PaymentMethod,
} from "./data";
import { TradeModal } from "./TradeModal";
import { cn } from "@/lib/utils";

const allMethods: (PaymentMethod | "All")[] = [
  "All",
  "Bank Transfer",
  "Wise",
  "SEPA",
  "UPI",
  "PayPal",
  "Revolut",
  "On-chain",
];

export function P2PMarket() {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [fiat, setFiat] = useState<Fiat>("USD");
  const [method, setMethod] = useState<(typeof allMethods)[number]>("All");
  const [amount, setAmount] = useState("");
  const [active, setActive] = useState<Offer | null>(null);

  const rate = fiatRate[fiat];

  const filtered = useMemo(() => {
    const amt = parseFloat(amount);
    return allOffers
      .filter((o) => method === "All" || o.methods.includes(method))
      .filter((o) => {
        if (!amt) return true;
        const min = o.min * rate.mult;
        const max = o.max * rate.mult;
        return amt >= min && amt <= max;
      })
      .sort((a, b) => (side === "buy" ? a.price - b.price : b.price - a.price));
  }, [method, amount, rate.mult, side]);

  return (
    <>
      <div className="glass overflow-hidden">
        {/* Controls */}
        <div className="flex flex-col gap-4 border-b border-white/5 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Buy / Sell toggle */}
            <div className="inline-flex rounded-full border border-white/10 bg-ink-950/60 p-1">
              {(["buy", "sell"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={cn(
                    "relative rounded-full px-7 py-2 text-sm font-semibold capitalize transition-colors",
                    side === s ? "text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  {side === s && (
                    <motion.span
                      layoutId="sidePill"
                      className={cn(
                        "absolute inset-0 rounded-full",
                        s === "buy" ? "bg-emerald-500/90" : "bg-rose-500/90"
                      )}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{s} LAE</span>
                </button>
              ))}
            </div>

            {/* Asset pills */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="rounded-lg bg-brand-500/15 px-3 py-1.5 font-semibold text-brand-200">
                LAE
              </span>
              {["USDT", "BTC", "ETH"].map((a) => (
                <span
                  key={a}
                  className="rounded-lg px-3 py-1.5 font-medium text-slate-500"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                placeholder={`Amount in ${fiat}`}
                className="w-36 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>

            {/* Fiat select */}
            <div className="relative">
              <select
                value={fiat}
                onChange={(e) => setFiat(e.target.value as Fiat)}
                className="appearance-none rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-4 pr-9 text-sm font-medium text-white outline-none focus:border-brand-500/50"
              >
                {fiats.map((f) => (
                  <option key={f} value={f} className="bg-ink-900">
                    {f}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>

            {/* Payment methods */}
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
              {allMethods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    method === m
                      ? "border-brand-500/50 bg-brand-500/15 text-brand-200"
                      : "border-white/10 bg-white/[0.02] text-slate-400 hover:text-white"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table header (desktop) */}
        <div className="hidden grid-cols-[1.6fr_1fr_1.2fr_1.4fr_0.9fr] gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 lg:grid">
          <span>Advertiser</span>
          <span>Price</span>
          <span>Available / Limit</span>
          <span>Payment</span>
          <span className="text-right">Trade</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {filtered.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="grid grid-cols-1 gap-4 px-5 py-5 transition-colors hover:bg-white/[0.02] sm:px-6 lg:grid-cols-[1.6fr_1fr_1.2fr_1.4fr_0.9fr] lg:items-center"
            >
              {/* Advertiser */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${o.color}, #7c3aed)`,
                    }}
                  >
                    {o.initial}
                  </span>
                  {o.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-900 bg-emerald-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-white">
                      {o.name}
                    </span>
                    {o.pro && (
                      <span className="flex items-center gap-0.5 rounded bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-300">
                        <ShieldCheck className="h-3 w-3" /> PRO
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-emerald-400" />
                      {o.completion}%
                    </span>
                    <span>{o.orders.toLocaleString()} orders</span>
                    <span className="hidden items-center gap-1 sm:flex">
                      <Clock className="h-3 w-3" />
                      {o.releaseMin}m
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div>
                <span className="lg:hidden text-xs text-slate-500">Price </span>
                <span className="font-mono text-lg font-bold text-white">
                  {rate.symbol}
                  {(o.price * rate.mult).toLocaleString("en-US", {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 4,
                  })}
                </span>
                <span className="ml-1 text-xs text-slate-500">/ LAE</span>
              </div>

              {/* Available / Limit */}
              <div className="text-sm">
                <div className="text-slate-200">
                  <span className="text-slate-500">Available </span>
                  {o.available.toLocaleString()} LAE
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-500">Limit </span>
                  {rate.symbol}
                  {Math.round(o.min * rate.mult).toLocaleString()} –{" "}
                  {rate.symbol}
                  {Math.round(o.max * rate.mult).toLocaleString()}
                </div>
              </div>

              {/* Payment */}
              <div className="flex flex-wrap gap-1.5">
                {o.methods.map((m) => (
                  <span
                    key={m}
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium"
                    style={{
                      color: methodColor[m],
                      borderColor: `${methodColor[m]}33`,
                      backgroundColor: `${methodColor[m]}10`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: methodColor[m] }}
                    />
                    {m}
                  </span>
                ))}
              </div>

              {/* Action */}
              <div className="lg:text-right">
                <button
                  onClick={() => setActive(o)}
                  className={cn(
                    "w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 lg:w-auto",
                    side === "buy"
                      ? "bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_0_40px_-12px_rgba(52,211,153,0.7)]"
                      : "bg-gradient-to-b from-rose-400 to-rose-600 shadow-[0_0_40px_-12px_rgba(244,63,94,0.7)]"
                  )}
                >
                  {side === "buy" ? "Buy" : "Sell"} LAE
                </button>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Star className="h-6 w-6 text-slate-600" />
              <p className="text-sm text-slate-400">
                No offers match your filters. Try a different amount or payment
                method.
              </p>
            </div>
          )}
        </div>
      </div>

      <TradeModal
        offer={active}
        side={side}
        fiat={fiat}
        onClose={() => setActive(null)}
      />
    </>
  );
}
