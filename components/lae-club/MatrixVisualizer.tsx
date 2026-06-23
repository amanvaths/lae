"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { LAE_MATRIX_SIZE } from "@/lib/lae-club/constants";
import {
  buildMatrixSlots,
  MATRIX_ROWS,
  type MatrixSlot,
} from "@/lib/lae-club/matrix-slots";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Address } from "viem";

export function MatrixVisualizer({
  referrals,
  slots: slotsProp,
  levelActive,
  level,
  reinvestCount,
  totalEarning,
  className,
}: {
  referrals?: readonly Address[];
  slots?: MatrixSlot[];
  levelActive: boolean;
  level: number;
  reinvestCount?: bigint;
  totalEarning?: bigint;
  className?: string;
}) {
  const slots = slotsProp ?? buildMatrixSlots(referrals ?? [], levelActive);
  const filled = slots.filter((s) => s.state === "filled").length;

  return (
    <div className={cn("relative space-y-4", className)}>
      {/* Ambient gold particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-[#D4AF37]/5 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-[#C0C0C0]/5 blur-3xl" />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-1 font-bold tracking-wide text-[#D4AF37]">
            SLOT {level}
          </span>
          <span className="text-slate-500">CYCLE {Number(reinvestCount ?? 0n) + 1}</span>
        </div>
        <span className="font-mono font-semibold text-emerald-400">
          {filled}/{LAE_MATRIX_SIZE} filled
        </span>
      </div>

      <div className="relative overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex min-w-[min(100%,680px)] flex-col items-center gap-0 pt-3">
          <YouNode />

          <Connector height={28} />

          {MATRIX_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex w-full flex-col items-center">
              {rowIdx > 0 && <HorizontalBar rowIdx={rowIdx} />}
              <div
                className={cn(
                  "flex flex-wrap items-start justify-center",
                  rowIdx === 2 ? "gap-1.5 sm:gap-2" : "gap-3 sm:gap-4"
                )}
              >
                {row.map((spotNum) => {
                  const slot = slots[spotNum - 1]!;
                  return (
                    <div key={spotNum} className="flex flex-col items-center">
                      {rowIdx > 0 && (
                        <div className="h-3 w-px bg-gradient-to-b from-[#D4AF37]/40 to-transparent" />
                      )}
                      <SpotCard slot={slot} compact={rowIdx === 2} />
                      {rowIdx < 2 && (
                        <div className="h-3 w-px bg-gradient-to-b from-[#D4AF37]/25 to-transparent" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Legend />

      {totalEarning !== undefined && totalEarning > 0n && (
        <p className="text-center text-xs font-semibold text-emerald-400">
          Level earnings: {fmtEther(totalEarning)}
        </p>
      )}
    </div>
  );
}

function YouNode() {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={cn(
        "relative z-10 rounded-xl border-2 border-[#D4AF37]/70 px-8 py-3 text-center",
        "bg-gradient-to-b from-[#D4AF37] via-[#C5A028] to-[#B8860B]",
        "shadow-[0_0_28px_rgba(212,175,55,0.45)]"
      )}
    >
      <p className="text-base font-black tracking-[0.25em] text-[#1a1200]">YOU</p>
    </motion.div>
  );
}

function SpotCard({ slot, compact }: { slot: MatrixSlot; compact: boolean }) {
  const isGold = slot.tone === "gold";
  const filled = slot.state === "filled";
  const locked = slot.state === "locked";
  const open = slot.state === "open";

  return (
    <motion.div
      whileHover={filled ? { scale: 1.05, y: -2 } : undefined}
      className={cn(
        "relative rounded-xl border-2 px-2 py-2.5 text-center backdrop-blur-md transition-shadow",
        compact ? "min-w-[62px] max-w-[72px] sm:min-w-[68px]" : "min-w-[76px] sm:min-w-[80px]",
        filled &&
          isGold &&
          "border-[#D4AF37]/70 bg-gradient-to-b from-[#D4AF37]/20 via-[#1a1200]/50 to-black/80 shadow-[0_0_20px_rgba(212,175,55,0.35)]",
        filled &&
          !isGold &&
          "border-[#C0C0C0]/60 bg-gradient-to-b from-[#E8E8E8]/15 via-[#1a1a1a]/50 to-black/80 shadow-[0_0_16px_rgba(192,192,192,0.2)]",
        open &&
          "animate-pulse border-[#D4AF37]/50 border-dashed bg-[#D4AF37]/[0.06] shadow-[0_0_12px_rgba(212,175,55,0.2)]",
        slot.state === "waiting" &&
          "border-white/10 border-dashed bg-white/[0.02]",
        locked && "border-white/[0.06] bg-black/30 opacity-60 blur-[0.3px]"
      )}
    >
      <span
        className={cn(
          "absolute -top-2.5 left-1/2 z-10 flex h-[18px] w-[18px] -translate-x-1/2 items-center justify-center rounded-full text-[9px] font-bold",
          filled && isGold && "bg-gradient-to-b from-[#D4AF37] to-[#B8860B] text-[#1a1200]",
          filled && !isGold && "bg-gradient-to-b from-[#E8E8E8] to-[#A8A8A8] text-[#1a1a1a]",
          !filled && "bg-white/10 text-slate-400"
        )}
      >
        {slot.spot}
      </span>

      {locked && (
        <Lock className="mx-auto mb-0.5 h-3 w-3 text-slate-500" aria-hidden />
      )}

      <p
        className={cn(
          "mt-1 text-[9px] font-bold uppercase leading-tight sm:text-[10px]",
          filled && isGold && "text-[#D4AF37]",
          filled && !isGold && "text-[#C0C0C0]",
          open && "text-[#D4AF37]",
          slot.state === "waiting" && "text-slate-400",
          locked && "text-slate-600"
        )}
      >
        {slot.label}
      </p>
      <p className="text-[8px] leading-tight text-slate-500 sm:text-[9px]">{slot.sublabel}</p>

      <p
        className={cn(
          "mt-1 font-mono text-[8px] sm:text-[9px]",
          filled && "text-white/80",
          open && "font-semibold text-[#D4AF37]",
          slot.state === "waiting" && "text-slate-500",
          locked && "text-slate-600"
        )}
      >
        {filled
          ? slot.userId
            ? `#${slot.userId}`
            : slot.address
              ? truncateAddress(slot.address, 4, 3)
              : "FILLED"
          : locked
            ? "LOCKED"
            : open
              ? "OPEN"
              : "WAITING"}
      </p>
    </motion.div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/[0.06] pt-4 text-[10px] sm:gap-6 sm:text-[11px]">
      <div className="flex items-center gap-2">
        <span className="h-3 w-5 rounded border border-[#C0C0C0]/50 bg-gradient-to-b from-[#E8E8E8]/40 to-[#A8A8A8]/20" />
        <span className="text-slate-400">
          <strong className="text-[#C0C0C0]">Silver</strong> · YOUR INCOME
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-5 rounded border border-[#D4AF37]/50 bg-gradient-to-b from-[#D4AF37]/30 to-[#B8860B]/20" />
        <span className="text-slate-400">
          <strong className="text-[#D4AF37]">Gold</strong> · FLOW & SYSTEM
        </span>
      </div>
      <div className="flex items-center gap-3 text-slate-500">
        <span>
          <strong className="text-[#D4AF37]">OPEN</strong> = next slot
        </span>
        <span>
          <strong className="text-slate-400">WAITING</strong> = not yet filled
        </span>
      </div>
    </div>
  );
}

function Connector({ height }: { height: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <div className="h-full w-px bg-gradient-to-b from-[#D4AF37]/60 to-[#D4AF37]/10" />
    </div>
  );
}

function HorizontalBar({ rowIdx }: { rowIdx: number }) {
  const width = rowIdx === 1 ? "58%" : "88%";
  return (
    <div className="mb-1 flex h-5 w-full items-end justify-center">
      <div
        className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent"
        style={{ width }}
      />
    </div>
  );
}
