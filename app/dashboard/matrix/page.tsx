"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle2, RotateCcw, Coins, Users } from "lucide-react";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { MatrixVisualizer } from "@/components/lae-club/MatrixVisualizer";
import { LAE_LEVELS } from "@/lib/lae-club/constants";
import {
  useLaeUser,
  useLaeLevelPrices,
  useLaeMatrixLevel,
  useLaeAllMatrixLevels,
} from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { cn } from "@/lib/utils";

export default function MatrixPage() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const user = useLaeUser();
  const prices = useLaeLevelPrices();
  const allLevels = useLaeAllMatrixLevels();
  const matrix = useLaeMatrixLevel(selectedLevel ?? 1);

  if (user.isLoading) {
    return <QueryLoading label="Loading LAE Club matrix…" />;
  }

  function handleSlotClick(level: number, active: boolean) {
    if (!active) return;
    setSelectedLevel((prev) => (prev === level ? null : level));
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          <span className="bg-gradient-to-r from-[#E8E8E8] via-[#C0C0C0] to-[#A8A8A8] bg-clip-text text-transparent">
            Silver
          </span>{" "}
          <span className="text-white/60">&</span>{" "}
          <span className="bg-gradient-to-r from-[#D4AF37] via-[#C5A028] to-[#B8860B] bg-clip-text text-transparent">
            Gold
          </span>{" "}
          <span className="text-white">Matrix</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          15 levels · 14 spots · live on-chain · User ID #
          {String(user.userId ?? "—")}
        </p>
      </div>

      {/* Slot grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: LAE_LEVELS }, (_, i) => i + 1).map((lvl) => {
          const isActive =
            lvl === 1 || allLevels.levels[lvl - 1]?.active === true;
          const price = prices.prices?.find((p) => p.level === lvl);
          const isSelected = selectedLevel === lvl;

          return (
            <SlotCard
              key={lvl}
              level={lvl}
              active={isActive}
              selected={isSelected}
              price={price?.priceFormatted ?? "—"}
              loading={allLevels.isLoading}
              onClick={() => handleSlotClick(lvl, isActive)}
            />
          );
        })}
      </div>

      {/* Matrix visualizer for selected level */}
      <AnimatePresence mode="wait">
        {selectedLevel !== null && (
          <motion.div
            key={selectedLevel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Panel
              title={`Level ${selectedLevel} — Matrix Tree`}
              className="border border-[#D4AF37]/20 bg-[#050505]"
            >
              {matrix.isLoading ? (
                <QueryLoading label="Loading level data…" />
              ) : (
                <>
                  {/* Level stats bar */}
                  <div className="mb-4 flex flex-wrap gap-3 border-b border-white/[0.06] pb-4 text-xs">
                    <StatChip
                      icon={Users}
                      label="Filled"
                      value={`${matrix.filledSpots}/14`}
                      tone="emerald"
                    />
                    <StatChip
                      icon={RotateCcw}
                      label="Recycles"
                      value={String(matrix.reinvestCount)}
                      tone="gold"
                    />
                    <StatChip
                      icon={Coins}
                      label="Earnings"
                      value={
                        matrix.totalEarning
                          ? fmtEther(matrix.totalEarning)
                          : "0"
                      }
                      tone="brand"
                    />
                    {matrix.heldForUpgrade > 0n && (
                      <StatChip
                        icon={Lock}
                        label="Held"
                        value={fmtEther(matrix.heldForUpgrade)}
                        tone="silver"
                      />
                    )}
                  </div>

                  <MatrixVisualizer
                    referrals={matrix.referrals}
                    level={selectedLevel}
                    reinvestCount={matrix.reinvestCount}
                    totalEarning={matrix.totalEarning}
                  />
                </>
              )}
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- Slot card ---- */
function SlotCard({
  level,
  active,
  selected,
  price,
  loading,
  onClick,
}: {
  level: number;
  active: boolean;
  selected: boolean;
  price: string;
  loading: boolean;
  onClick: () => void;
}) {
  if (loading) {
    return (
      <div className="h-[120px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
    );
  }

  if (!active) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-dashed border-[#D4AF37]/20 bg-white/[0.02] p-4 backdrop-blur-sm">
        {/* Lock overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-[2px]">
          <div className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-2.5">
            <Lock className="h-5 w-5 text-[#D4AF37]/60" />
          </div>
          <span className="rounded-full bg-white/[0.06] px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Locked
          </span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-bold text-white/30">Level {level}</p>
            <p className="mt-1 font-mono text-sm text-slate-600">{price}</p>
          </div>
          <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-xs font-medium text-slate-600">
            0/14
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-200",
        selected
          ? "border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/10 via-[#1a1200]/40 to-transparent shadow-[0_0_24px_rgba(212,175,55,0.15)]"
          : "border-[#D4AF37]/30 bg-white/[0.03] hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/[0.04]"
      )}
    >
      {/* Glow accent */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#D4AF37]/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-white">Level {level}</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-1 font-mono text-sm text-[#D4AF37]">{price}</p>
        </div>
        <span className="rounded-lg bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-bold text-[#D4AF37]">
          Active
        </span>
      </div>

      {selected && (
        <p className="mt-2 text-[10px] font-medium uppercase tracking-widest text-[#D4AF37]/50">
          Viewing tree ↓
        </p>
      )}
    </motion.button>
  );
}

/* ---- Stat chip ---- */
function StatChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Lock;
  label: string;
  value: string;
  tone: "gold" | "silver" | "emerald" | "brand";
}) {
  const colors: Record<string, string> = {
    gold: "border-[#D4AF37]/20 text-[#D4AF37]",
    silver: "border-[#C0C0C0]/20 text-[#C0C0C0]",
    emerald: "border-emerald-500/20 text-emerald-400",
    brand: "border-brand-500/20 text-brand-300",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg border bg-white/[0.02] px-2.5 py-1.5",
        colors[tone]
      )}
    >
      <Icon className="h-3 w-3 opacity-60" />
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
