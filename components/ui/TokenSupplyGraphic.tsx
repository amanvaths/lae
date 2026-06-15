"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/useDeferredReady";
import { LAE_TOKENOMICS, fmtLae } from "@/lib/lae-content";

const bars = [
  {
    label: "Community",
    pct: LAE_TOKENOMICS.communityReward.pct,
    color: "#ffc31a",
  },
  {
    label: "Liquidity",
    pct: LAE_TOKENOMICS.liquidityPool.pct,
    color: "#ffd54f",
  },
];

export function TokenSupplyGraphic() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-4 rounded-full bg-brand-500/5 blur-2xl" />
      <div className="relative flex h-44 items-end justify-center gap-8 sm:gap-12">
        {bars.map((b, i) => (
          <div key={b.label} className="flex flex-col items-center gap-2">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              whileInView={{ height: `${b.pct * 1.6}px`, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: reduced ? 0 : 0.7,
                delay: reduced ? 0 : i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-12 rounded-t-sm sm:w-16"
              style={{
                background: `linear-gradient(to top, ${b.color}44, ${b.color})`,
                boxShadow: `0 0 20px ${b.color}44`,
              }}
            />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {b.label}
            </span>
            <span className="font-mono text-sm font-semibold text-white">{b.pct}%</span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        {fmtLae(LAE_TOKENOMICS.totalSupply)} $LAE · launch {LAE_TOKENOMICS.launchPriceLabel} · target{" "}
        {LAE_TOKENOMICS.ecosystemTarget}
      </p>
    </div>
  );
}
