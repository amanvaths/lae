"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  Lock,
  ArrowRight,
  Wallet,
  Clock,
  Star,
} from "lucide-react";
import {
  type Offer,
  type Fiat,
  fiatRate,
  methodColor,
} from "./data";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Lock,
    title: "LAE locked in escrow",
    body: "The seller's $LAE is locked in the audited escrow smart contract — neither party nor LAE can touch it.",
  },
  {
    icon: Wallet,
    title: "You pay the seller",
    body: "Send the fiat off-chain via the agreed method, then mark the order as paid.",
  },
  {
    icon: ShieldCheck,
    title: "Auto-release on confirm",
    body: "The seller confirms receipt and the contract releases $LAE straight to your wallet. Disputes go to DAO arbitration.",
  },
];

export function TradeModal({
  offer,
  side,
  fiat,
  onClose,
}: {
  offer: Offer | null;
  side: "buy" | "sell";
  fiat: Fiat;
  onClose: () => void;
}) {
  const [fiatAmount, setFiatAmount] = useState("");

  const rate = fiatRate[fiat];
  const price = (offer?.price ?? 0) * rate.mult;

  const laeAmount = useMemo(() => {
    const f = parseFloat(fiatAmount);
    if (!f || !price) return 0;
    return f / price;
  }, [fiatAmount, price]);

  const isBuy = side === "buy";

  return (
    <AnimatePresence>
      {offer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass relative grid w-full max-w-3xl gap-0 overflow-hidden md:grid-cols-2"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left: advertiser + escrow flow */}
            <div className="border-b border-white/5 bg-white/[0.02] p-6 sm:p-8 md:border-b-0 md:border-r">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-12 w-12 place-items-center rounded-full text-lg font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${offer.color}, #7c3aed)`,
                  }}
                >
                  {offer.initial}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white">{offer.name}</span>
                    {offer.pro && (
                      <ShieldCheck className="h-4 w-4 text-brand-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                    {offer.completion}% · {offer.orders.toLocaleString()} orders
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Non-custodial · on-chain escrow protected
              </div>

              <div className="mt-6 flex flex-col gap-5">
                {steps.map((s, i) => (
                  <div key={s.title} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300">
                        <s.icon className="h-4 w-4" />
                      </span>
                      {i < steps.length - 1 && (
                        <span className="my-1 h-full w-px flex-1 bg-gradient-to-b from-brand-500/40 to-transparent" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-semibold text-white">
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                        {s.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: trade form */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                    isBuy
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                  )}
                >
                  {isBuy ? "Buy" : "Sell"} $LAE
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" /> ~{offer.releaseMin} min release
                </span>
              </div>

              <dl className="mt-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Price</dt>
                  <dd className="font-mono font-semibold text-white">
                    {rate.symbol}
                    {price.toLocaleString("en-US", {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Available</dt>
                  <dd className="font-mono text-slate-200">
                    {offer.available.toLocaleString()} LAE
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Limit</dt>
                  <dd className="font-mono text-slate-200">
                    {rate.symbol}
                    {Math.round(offer.min * rate.mult).toLocaleString()} –{" "}
                    {rate.symbol}
                    {Math.round(offer.max * rate.mult).toLocaleString()}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {offer.methods.map((m) => (
                  <span
                    key={m}
                    className="rounded-md border px-2 py-1 text-[11px] font-medium"
                    style={{
                      color: methodColor[m],
                      borderColor: `${methodColor[m]}40`,
                      backgroundColor: `${methodColor[m]}12`,
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">
                    {isBuy ? "I will pay" : "I will receive"}
                  </span>
                  <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-4 focus-within:border-brand-500/60">
                    <input
                      type="number"
                      value={fiatAmount}
                      onChange={(e) => setFiatAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent py-3 text-lg font-semibold text-white outline-none placeholder:text-slate-600"
                    />
                    <span className="text-sm font-semibold text-slate-400">
                      {fiat}
                    </span>
                  </div>
                </label>

                <div className="flex items-center justify-center">
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-400">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </span>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">
                    {isBuy ? "I will receive" : "I will send"}
                  </span>
                  <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-4">
                    <input
                      readOnly
                      value={laeAmount ? laeAmount.toFixed(2) : ""}
                      placeholder="0.00"
                      className="w-full bg-transparent py-3 text-lg font-semibold text-brand-200 outline-none placeholder:text-slate-600"
                    />
                    <span className="text-sm font-semibold text-slate-400">
                      LAE
                    </span>
                  </div>
                </label>
              </div>

              <button
                className={cn(
                  "btn-primary mt-6 w-full justify-center",
                  !isBuy &&
                    "from-rose-400 to-rose-600 shadow-[0_0_60px_-15px_rgba(244,63,94,0.6)] hover:shadow-[0_0_80px_-10px_rgba(244,63,94,0.8)]"
                )}
              >
                <Wallet className="h-4 w-4" />
                Connect wallet to {isBuy ? "buy" : "sell"}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
                <Lock className="h-3 w-3" />
                Funds are escrowed by smart contract. LAE never holds your money.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
