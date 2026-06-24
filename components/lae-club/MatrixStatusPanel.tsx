"use client";

import { motion } from "framer-motion";
import { Coins, Layers, RotateCcw, Shield, TrendingUp, Users } from "lucide-react";
import { LAE_MATRIX_SIZE } from "@/lib/lae-club/constants";
import { fmtEther } from "@/lib/contracts/format";
import { cn } from "@/lib/utils";

export function MatrixStatusPanel({
  level,
  filled,
  cycle,
  totalEarning,
  heldForUpgrade,
  nextUpgradeCost,
  levelActive,
  className,
}: {
  level: number;
  filled: number;
  cycle: bigint;
  totalEarning?: bigint;
  heldForUpgrade?: bigint;
  nextUpgradeCost?: string;
  levelActive: boolean;
  className?: string;
}) {
  const remaining = LAE_MATRIX_SIZE - filled;
  const progress = Math.round((filled / LAE_MATRIX_SIZE) * 100);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-black/40 p-4 backdrop-blur-xl sm:p-5",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/[0.08] text-[#D4AF37]">
          <Shield className="h-3.5 w-3.5" />
        </span>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#D4AF37]/70">
          Matrix Status
        </p>
      </div>
      <h3 className="mt-3 font-display text-lg font-bold text-white">Level {level}</h3>
      <p
        className={cn(
          "mt-1 inline-flex items-center gap-1.5 text-xs font-medium",
          levelActive ? "text-emerald-400" : "text-slate-500"
        )}
      >
        {levelActive && (
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
        )}
        {levelActive ? "Active on-chain" : "Locked — upgrade to unlock"}
      </p>

      <div className="mt-4 space-y-3">
        <ProgressRow label="Filled positions" value={`${filled}/${LAE_MATRIX_SIZE}`} pct={progress} />
        <StatRow icon={Users} label="Remaining" value={String(remaining)} />
        <StatRow icon={RotateCcw} label="Cycle" value={String(Number(cycle) + 1)} />
        <StatRow
          icon={TrendingUp}
          label="Level earnings"
          value={totalEarning ? fmtEther(totalEarning) : "0"}
          highlight
        />
        {heldForUpgrade !== undefined && heldForUpgrade > 0n && (
          <StatRow icon={Layers} label="Held for upgrade" value={fmtEther(heldForUpgrade)} />
        )}
        {nextUpgradeCost && level < 15 && (
          <StatRow icon={Coins} label="Next level cost" value={nextUpgradeCost} />
        )}
      </div>
    </motion.aside>
  );
}

function ProgressRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-semibold text-[#D4AF37]">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B]"
        />
      </div>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Icon className="h-3.5 w-3.5 text-[#D4AF37]/60" />
        {label}
      </div>
      <span
        className={cn(
          "font-mono text-sm font-semibold",
          highlight ? "text-gradient-gold" : "text-white"
        )}
      >
        {value}
      </span>
    </div>
  );
}
