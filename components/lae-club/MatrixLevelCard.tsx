"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function MatrixLevelCard({
  level,
  active,
  selected,
  price,
  filled,
  loading,
  onClick,
}: {
  level: number;
  active: boolean;
  selected: boolean;
  price: string;
  filled: number;
  loading: boolean;
  onClick: () => void;
}) {
  if (loading) {
    return (
      <div className="h-[132px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
    );
  }

  const progress = Math.round((filled / 14) * 100);

  if (!active) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-dashed p-4 backdrop-blur-sm",
          "border-[#C0C0C0]/20 bg-gradient-to-br from-white/[0.02] to-black/40"
        )}
      >
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-[3px]">
          <div className="rounded-full border border-[#C0C0C0]/30 bg-[#C0C0C0]/10 p-2.5">
            <Lock className="h-5 w-5 text-[#C0C0C0]/70" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Locked
          </span>
        </div>
        <div className="opacity-40">
          <p className="text-lg font-bold text-white/40">Level {level}</p>
          <p className="mt-1 font-mono text-sm text-slate-600">{price}</p>
          <p className="mt-3 text-xs text-slate-600">0/14 positions</p>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-300",
        selected
          ? "border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/15 via-[#1a1200]/60 to-black shadow-[0_0_32px_rgba(212,175,55,0.2)]"
          : "border-[#D4AF37]/35 bg-gradient-to-br from-white/[0.04] to-black/60 hover:border-[#D4AF37]/60 hover:shadow-[0_0_24px_rgba(212,175,55,0.12)]"
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#D4AF37]/15 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-lg font-bold text-white">Level {level}</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-1 font-mono text-sm text-[#D4AF37]">{price}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          Active
        </span>
      </div>

      <div className="relative mt-3">
        <div className="mb-1 flex justify-between text-[10px]">
          <span className="text-slate-500">Progress</span>
          <span className="font-mono font-semibold text-[#D4AF37]">
            {filled}/14
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {selected && (
        <p className="relative mt-2 text-[10px] font-medium uppercase tracking-widest text-[#D4AF37]/60">
          Viewing matrix ↓
        </p>
      )}
    </motion.button>
  );
}
