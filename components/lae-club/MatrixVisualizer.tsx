"use client";

import { cn } from "@/lib/utils";
import { MATRIX_SPOT_LABELS, LAE_MATRIX_SIZE } from "@/lib/lae-club/constants";
import { truncateAddress } from "@/lib/format";

/** Silver & Gold Matrix — 14-spot tree (2 + 4 + 8), PPT design */
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
  const rows = [
    referrals.slice(0, 2),
    referrals.slice(2, 6),
    referrals.slice(6, 14),
  ];
  const rowSizes = [2, 4, 8];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gradient-to-r from-amber-500/20 to-yellow-600/20 px-2 py-0.5 font-bold text-amber-300">
            SLOT {level}
          </span>
          <span className="text-slate-500">
            CYCLE {Number(reinvestCount ?? 0n) + 1}
          </span>
        </div>
        <span className="font-mono text-emerald-400">
          {referrals.length}/{LAE_MATRIX_SIZE} filled
        </span>
      </div>

      {/* YOU node */}
      <div className="flex justify-center pt-2">
        <div className="relative">
          <div className="rounded-lg border-2 border-amber-400 bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 px-6 py-2.5 text-center shadow-[0_0_20px_rgba(255,195,26,0.3)]">
            <p className="text-sm font-black tracking-wide text-ink-950">YOU</p>
          </div>
          {/* connector line down */}
          <div className="absolute left-1/2 top-full h-5 w-px -translate-x-1/2 bg-gradient-to-b from-amber-500 to-amber-500/30" />
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, rowIdx) => {
        const size = rowSizes[rowIdx];
        return (
          <div key={rowIdx} className="relative">
            {/* horizontal connector line */}
            <div className="mx-auto mb-1 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" style={{ width: `${Math.min(100, 40 + rowIdx * 25)}%` }} />

            <div className={cn(
              "flex justify-center gap-1.5",
              rowIdx === 2 ? "flex-wrap" : ""
            )}>
              {Array.from({ length: size }).map((_, i) => {
                const globalIdx = (rowIdx === 0 ? 0 : rowIdx === 1 ? 2 : 6) + i;
                const spotNum = globalIdx + 1;
                const addr = row[i];
                const meta = MATRIX_SPOT_LABELS[spotNum];
                const filled = !!addr && addr !== "0x0000000000000000000000000000000000000000";
                const isGold = meta?.tone === "gold";
                const isSilver = meta?.tone === "silver";
                const isFreeRow = rowIdx === 2;

                return (
                  <div key={spotNum} className="flex flex-col items-center gap-0.5">
                    {/* vertical connector */}
                    {rowIdx > 0 && (
                      <div className="h-3 w-px bg-amber-500/30" />
                    )}
                    <div
                      className={cn(
                        "relative rounded-lg border-2 px-2 py-1.5 text-center transition-all",
                        rowIdx === 2 ? "min-w-[60px]" : "min-w-[72px]",
                        filled
                          ? isGold
                            ? "border-amber-400/70 bg-gradient-to-b from-amber-500/20 via-yellow-600/15 to-amber-700/10 shadow-[0_2px_12px_rgba(255,195,26,0.15)]"
                            : "border-slate-300/50 bg-gradient-to-b from-slate-300/15 via-slate-400/10 to-slate-500/5 shadow-[0_2px_12px_rgba(200,200,200,0.1)]"
                          : "border-white/10 bg-white/[0.02]"
                      )}
                    >
                      {/* Spot number badge */}
                      <span className={cn(
                        "absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[8px] font-bold leading-none",
                        filled
                          ? isGold
                            ? "bg-amber-500 text-ink-950"
                            : "bg-slate-300 text-ink-950"
                          : "bg-white/20 text-slate-500"
                      )}>
                        {spotNum}
                      </span>

                      <p className={cn(
                        "mt-1 text-[10px] font-bold leading-tight",
                        filled
                          ? isGold ? "text-amber-200" : "text-slate-200"
                          : "text-slate-500"
                      )}>
                        {meta?.label ?? "—"}
                      </p>
                      <p className={cn(
                        "text-[9px] leading-tight",
                        filled
                          ? isGold ? "text-amber-300/70" : "text-slate-400/80"
                          : "text-slate-600"
                      )}>
                        {meta?.sublabel ?? ""}
                      </p>
                      <p className={cn(
                        "mt-0.5 font-mono text-[8px]",
                        filled ? "text-white/70" : "text-slate-600"
                      )}>
                        {filled ? truncateAddress(addr, 4, 3) : "Empty"}
                      </p>
                    </div>
                    {/* FREE label on bottom row */}
                    {isFreeRow && i % 2 === 1 && (
                      <span className="mt-0.5 text-[7px] font-bold uppercase tracking-widest text-slate-600">Free</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/5 pt-3 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-5 rounded border border-slate-300/50 bg-gradient-to-b from-slate-300/20 to-slate-400/10" />
          <span className="text-slate-400">
            <strong className="text-slate-200">Silver</strong> — 3, 6, 8, 9, 11, 12
          </span>
          <span className="ml-1 text-slate-500">YOUR INCOME</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-5 rounded border border-amber-400/60 bg-gradient-to-b from-amber-500/25 to-amber-600/15" />
          <span className="text-slate-400">
            <strong className="text-amber-200">Gold</strong> — 1, 2, 4, 5, 7, 10, 13, 14
          </span>
          <span className="ml-1 text-slate-500">FLOW & SYSTEM</span>
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
