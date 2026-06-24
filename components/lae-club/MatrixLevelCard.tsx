"use client";

import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/* Compact circular progress ring */
function ProgressRing({
  pct,
  tone,
}: {
  pct: number;
  tone: "gold" | "muted";
}) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c;
  const stroke = tone === "gold" ? "#D4AF37" : "#C0C0C0";
  return (
    <div className="relative grid h-12 w-12 shrink-0 place-items-center">
      <svg viewBox="0 0 40 40" className="h-12 w-12 -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-[stroke-dasharray] duration-700 ease-premium"
          style={tone === "gold" ? { filter: "drop-shadow(0 0 4px rgba(212,175,55,0.5))" } : undefined}
        />
      </svg>
      <span
        className={cn(
          "absolute font-mono text-[10px] font-bold",
          tone === "gold" ? "text-[#D4AF37]" : "text-slate-500"
        )}
      >
        {pct}%
      </span>
    </div>
  );
}

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
    return <div className="skeleton h-[150px] rounded-2xl" />;
  }

  const progress = Math.round((filled / 14) * 100);

  /* ---------- Locked level ---------- */
  if (!active) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] to-black/40 p-4 backdrop-blur-sm transition-colors duration-300">
        {/* faint diagonal sheen */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.02)_50%,transparent_60%)]" />
        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-slate-400">Level {level}</p>
            <p className="mt-2 font-mono text-lg font-bold text-slate-500">{price}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-600">
              Cost (Token)
            </p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#C0C0C0]/20 bg-[#C0C0C0]/[0.06] text-[#C0C0C0]/60">
            <Lock className="h-4 w-4" />
          </span>
        </div>
        <div className="relative mt-3 flex items-center justify-between">
          <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Locked
          </span>
          <span className="font-mono text-xs text-slate-600">{filled} / 14 Filled</span>
        </div>
      </div>
    );
  }

  /* ---------- Active / selectable level ---------- */
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ease-premium",
        selected
          ? "border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/[0.16] via-[#1a1200]/50 to-black shadow-[0_0_0_1px_rgba(212,175,55,0.3),0_18px_40px_-18px_rgba(212,175,55,0.45)]"
          : "border-[#D4AF37]/30 bg-gradient-to-br from-white/[0.05] to-black/50 hover:border-[#D4AF37]/55 hover:shadow-[0_14px_34px_-18px_rgba(212,175,55,0.4)]"
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#D4AF37]/15 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display text-base font-bold text-white">Level {level}</p>
            <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-400">
              Active
            </span>
          </div>
          <p className="mt-2 font-display text-xl font-bold text-gradient-gold">{price}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#D4AF37]/50">
            Cost (Token)
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ProgressRing pct={progress} tone="gold" />
          <span className="font-mono text-[10px] text-slate-500">{filled} / 14 Filled</span>
        </div>
      </div>

      <div
        className={cn(
          "relative mt-3 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-300",
          selected
            ? "bg-gradient-to-r from-[#f5d760] via-[#D4AF37] to-[#B8860B] text-[#1a1200] shadow-[0_4px_16px_-4px_rgba(212,175,55,0.5)]"
            : "border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] text-[#D4AF37] group-hover:bg-[#D4AF37]/[0.12]"
        )}
      >
        View Matrix Tree
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  );
}
