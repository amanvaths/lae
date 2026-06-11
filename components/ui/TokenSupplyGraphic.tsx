"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/useDeferredReady";

const bars = [
  { label: "Network", pct: 40, color: "#ffc31a" },
  { label: "Staking", pct: 22, color: "#ffd54f" },
  { label: "Treasury", pct: 15, color: "#e5a800" },
  { label: "Team", pct: 12, color: "#ffca28" },
  { label: "Ecosystem", pct: 8, color: "#ffe082" },
  { label: "Public", pct: 3, color: "#34d399" },
];

export function TokenSupplyGraphic() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-4 rounded-full bg-brand-500/5 blur-2xl" />
      <div className="relative flex h-48 items-end justify-center gap-2 sm:gap-3">
        {bars.map((b, i) => (
          <div key={b.label} className="flex flex-col items-center gap-2">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              whileInView={{ height: `${b.pct * 2.2}px`, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: reduced ? 0 : 0.7,
                delay: reduced ? 0 : i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-7 rounded-t-sm sm:w-9"
              style={{
                background: `linear-gradient(to top, ${b.color}44, ${b.color})`,
                boxShadow: `0 0 20px ${b.color}44`,
              }}
            />
            <span className="text-[0.6rem] font-medium uppercase tracking-wide text-slate-500 sm:text-[0.65rem]">
              {b.label}
            </span>
            <span className="font-mono text-xs font-semibold text-white">{b.pct}%</span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        1,000,000,000 $LAE · fixed supply · 1.5% burn per tx
      </p>
    </div>
  );
}
