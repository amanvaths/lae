"use client";

import { motion } from "framer-motion";
import { MATRIX_SPOT_LABELS, LAE_MATRIX_SIZE } from "@/lib/lae-club/constants";
import { truncateAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

const ZERO = "0x0000000000000000000000000000000000000000";

const ROWS: number[][] = [
  [1, 2],
  [3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12, 13, 14],
];

const goldGradient =
  "bg-gradient-to-b from-[#D4AF37] via-[#C5A028] to-[#B8860B]";
const goldBorder = "border-[#D4AF37]/60";
const goldGlow = "shadow-[0_0_16px_rgba(212,175,55,0.35)]";

const silverGradient =
  "bg-gradient-to-b from-[#E8E8E8] via-[#C0C0C0] to-[#A8A8A8]";
const silverBorder = "border-[#C0C0C0]/50";
const silverGlow = "shadow-[0_0_12px_rgba(192,192,192,0.2)]";

export function MatrixVisualizer({
  referrals,
  level,
  reinvestCount,
  totalEarning,
  className,
}: {
  referrals: `0x${string}`[];
  level: number;
  reinvestCount?: bigint;
  totalEarning?: bigint;
  className?: string;
}) {
  const allSlots = Array.from({ length: LAE_MATRIX_SIZE }, (_, i) => {
    const addr = referrals[i];
    return {
      spotNum: i + 1,
      address: addr,
      filled: !!addr && addr !== ZERO,
    };
  });

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-gradient-to-r from-[#D4AF37]/20 to-[#B8860B]/20 px-2.5 py-1 font-bold tracking-wide text-[#D4AF37]">
            SLOT {level}
          </span>
          <span className="text-slate-500">
            CYCLE {Number(reinvestCount ?? 0n) + 1}
          </span>
        </div>
        <span className="font-mono text-emerald-400">
          {allSlots.filter((s) => s.filled).length}/{LAE_MATRIX_SIZE} filled
        </span>
      </div>

      {/* Tree container — horizontal scroll on mobile */}
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto flex min-w-[640px] flex-col items-center gap-0 pt-2">
          {/* YOU node */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "relative z-10 rounded-xl border-2 px-8 py-3 text-center",
              goldBorder,
              goldGradient,
              "shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            )}
          >
            <p className="text-base font-black tracking-widest text-[#1a1200]">
              YOU
            </p>
          </motion.div>

          {/* Connector from YOU to Row 1 */}
          <div className="relative flex h-8 w-full items-center justify-center">
            <div className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-gradient-to-b from-[#D4AF37] to-[#D4AF37]/20" />
          </div>

          {/* Rows */}
          {ROWS.map((row, rowIdx) => {
            const isLastRow = rowIdx === 2;
            return (
              <div key={rowIdx} className="flex w-full flex-col items-center">
                {/* Horizontal bar connecting siblings */}
                {rowIdx > 0 && (
                  <div className="relative mb-1 flex h-6 w-full items-end justify-center">
                    <HorizontalBar rowIdx={rowIdx} />
                  </div>
                )}

                <div
                  className={cn(
                    "flex items-start justify-center",
                    isLastRow ? "gap-1.5 sm:gap-2" : "gap-4"
                  )}
                >
                  {row.map((spotNum) => {
                    const slot = allSlots[spotNum - 1];
                    const meta = MATRIX_SPOT_LABELS[spotNum];
                    const isGold = meta?.tone === "gold";
                    const { filled, address } = slot;
                    const nextOpenSpot = allSlots.findIndex((s) => !s.filled) + 1;
                    const isNextOpen = !filled && spotNum === nextOpenSpot;

                    return (
                      <div
                        key={spotNum}
                        className="flex flex-col items-center"
                      >
                        {/* Vertical drop line from horizontal bar */}
                        {rowIdx > 0 && (
                          <div className="h-3 w-px bg-gradient-to-b from-[#D4AF37]/40 to-[#D4AF37]/10" />
                        )}

                        <SpotBox
                          spotNum={spotNum}
                          filled={filled}
                          isGold={isGold}
                          isNextOpen={isNextOpen}
                          label={meta?.label ?? "—"}
                          sublabel={meta?.sublabel ?? ""}
                          address={address}
                          compact={isLastRow}
                        />

                        {/* Vertical connector to next row */}
                        {!isLastRow && (
                          <div className="h-3 w-px bg-gradient-to-b from-[#D4AF37]/30 to-[#D4AF37]/10" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* FREE labels under bottom-row pairs (auto-upgrade pairs) */}
                {isLastRow && (
                  <div className="mt-1.5 flex items-start justify-center gap-1.5 sm:gap-2">
                    {[7, 9, 11, 13].map((pairStart) => {
                      const pairFilled =
                        allSlots[pairStart - 1]?.filled || allSlots[pairStart]?.filled;
                      return (
                        <div
                          key={pairStart}
                          className="flex w-[128px] items-center justify-center sm:w-[136px]"
                        >
                          {pairFilled ? (
                            <span className="rounded-full bg-[#D4AF37]/10 px-3 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]/60">
                              Free
                            </span>
                          ) : (
                            <span className="text-[9px] uppercase tracking-[0.15em] text-slate-600">
                              Pair {pairStart}–{pairStart + 1}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 border-t border-white/[0.06] pt-4 text-[11px]">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-4 w-6 rounded-md border",
              silverBorder,
              silverGradient
            )}
          />
          <span className="text-slate-300">
            <strong className="text-[#C0C0C0]">Silver</strong>{" "}
            <span className="text-slate-500">3, 6, 8, 9, 11, 12</span>
          </span>
          <span className="font-semibold tracking-wide text-[#C0C0C0]/70">
            YOUR INCOME
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-4 w-6 rounded-md border",
              goldBorder,
              goldGradient
            )}
          />
          <span className="text-slate-300">
            <strong className="text-[#D4AF37]">Gold</strong>{" "}
            <span className="text-slate-500">1, 2, 4, 5, 7, 10, 13, 14</span>
          </span>
          <span className="font-semibold tracking-wide text-[#D4AF37]/70">
            FLOW & SYSTEM
          </span>
        </div>
      </div>

      {totalEarning !== undefined && totalEarning > 0n && (
        <p className="text-center text-xs font-semibold text-emerald-400">
          Level earnings: {Number(totalEarning) / 1e18} BUSD
        </p>
      )}
    </div>
  );
}

/* ---- Spot box ---- */
function SpotBox({
  spotNum,
  filled,
  isGold,
  isNextOpen,
  label,
  sublabel,
  address,
  compact,
}: {
  spotNum: number;
  filled: boolean;
  isGold: boolean;
  isNextOpen: boolean;
  label: string;
  sublabel: string;
  address: `0x${string}` | undefined;
  compact: boolean;
}) {
  const boxW = compact ? "min-w-[64px] max-w-[72px] sm:min-w-[68px]" : "min-w-[72px]";

  const filledGold = cn(
    "border-[#D4AF37]/60 bg-gradient-to-b from-[#D4AF37]/25 via-[#C5A028]/15 to-[#B8860B]/10",
    goldGlow
  );
  const filledSilver = cn(
    "border-[#C0C0C0]/50 bg-gradient-to-b from-[#E8E8E8]/20 via-[#C0C0C0]/12 to-[#A8A8A8]/8",
    silverGlow
  );
  const emptyBox = isNextOpen
    ? "border-[#D4AF37]/25 bg-[#D4AF37]/[0.04] border-dashed"
    : "border-white/[0.1] bg-white/[0.03] border-dashed";

  return (
    <motion.div
      whileHover={{ scale: 1.08, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "relative rounded-lg border-2 px-2 py-2 text-center",
        boxW,
        filled ? (isGold ? filledGold : filledSilver) : emptyBox
      )}
    >
      {/* Spot number badge */}
      <span
        className={cn(
          "absolute -top-2.5 left-1/2 z-10 flex h-[18px] w-[18px] -translate-x-1/2 items-center justify-center rounded-full text-[9px] font-bold leading-none",
          filled
            ? isGold
              ? "bg-gradient-to-b from-[#D4AF37] to-[#B8860B] text-[#1a1200] shadow-[0_0_6px_rgba(212,175,55,0.5)]"
              : "bg-gradient-to-b from-[#E8E8E8] to-[#A8A8A8] text-[#1a1a1a] shadow-[0_0_6px_rgba(192,192,192,0.4)]"
            : "bg-white/10 text-slate-500"
        )}
      >
        {spotNum}
      </span>

      <p
        className={cn(
          "mt-1.5 text-[10px] font-bold leading-tight",
          filled
            ? isGold
              ? "text-[#D4AF37]"
              : "text-[#C0C0C0]"
            : isNextOpen
              ? "text-[#D4AF37]/80"
              : "text-slate-400"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "text-[9px] leading-tight",
          filled
            ? isGold
              ? "text-[#D4AF37]/60"
              : "text-[#C0C0C0]/60"
            : isNextOpen
              ? "text-[#D4AF37]/50"
              : "text-slate-500"
        )}
      >
        {filled ? sublabel : isNextOpen ? "Next open" : "Awaiting"}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-[8px]",
          filled ? "text-white/70" : isNextOpen ? "text-[#D4AF37]/70" : "text-slate-500"
        )}
      >
        {filled && address ? truncateAddress(address, 4, 3) : isNextOpen ? `#${spotNum}` : "—"}
      </p>
    </motion.div>
  );
}

/* ---- Horizontal connector bar ---- */
function HorizontalBar({ rowIdx }: { rowIdx: number }) {
  const width = rowIdx === 1 ? "60%" : "85%";
  return (
    <div
      className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent"
      style={{ width }}
    />
  );
}
