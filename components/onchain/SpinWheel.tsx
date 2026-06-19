"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

const SEGMENTS = [
  { label: "Try Again", color: "#64748b", weight: 50 },
  { label: "10 LAE", color: "#22c55e", weight: 25 },
  { label: "200 LAE", color: "#3b82f6", weight: 15 },
  { label: "2K LAE", color: "#a855f7", weight: 7 },
  { label: "10K LAE", color: "#f59e0b", weight: 2 },
  { label: "100K LAE", color: "#ef4444", weight: 1 },
];

export function SpinWheel({ spinning, resultTier }: { spinning: boolean; resultTier?: number }) {
  const rotation = useMemo(() => {
    if (resultTier === undefined) return 0;
    const idx = Math.min(resultTier, SEGMENTS.length - 1);
    const slice = 360 / SEGMENTS.length;
    return 360 * 5 + idx * slice + slice / 2;
  }, [resultTier]);

  return (
    <div className="relative mx-auto h-64 w-64">
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-brand-500/40 shadow-glow"
        style={{
          background: `conic-gradient(${SEGMENTS.map((s, i) => {
            const start = (i / SEGMENTS.length) * 100;
            const end = ((i + 1) / SEGMENTS.length) * 100;
            return `${s.color} ${start}% ${end}%`;
          }).join(", ")})`,
        }}
        animate={{ rotate: spinning ? rotation : 0 }}
        transition={{ duration: spinning ? 3 : 0, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
        <div className="h-0 w-0 border-x-8 border-b-[16px] border-x-transparent border-b-brand-400" />
      </div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-950/90 text-xs font-bold text-white">
          SPIN
        </div>
      </div>
    </div>
  );
}
