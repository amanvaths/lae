"use client";

import { cn } from "@/lib/utils";
import { MATRIX_SPOT_LABELS, LAE_MATRIX_SIZE } from "@/lib/lae-club/constants";
import { truncateAddress } from "@/lib/format";

const TONE: Record<string, string> = {
  blue: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  pink: "border-pink-500/40 bg-pink-500/10 text-pink-200",
  gold: "border-brand-500/50 bg-brand-500/15 text-brand-200",
  slate: "border-white/20 bg-white/5 text-slate-300",
  orange: "border-orange-500/40 bg-orange-500/10 text-orange-200",
  red: "border-red-500/40 bg-red-500/10 text-red-300",
};

/** 14-spot X-Matrix tree visualizer (2 + 4 + 8) */
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

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>
          Level <strong className="text-white">{level}</strong>
        </span>
        <span>
          Cycle <strong className="text-white">{Number(reinvestCount ?? 0n) + 1}</strong>
        </span>
        <span>
          Filled{" "}
          <strong className="text-emerald-400">
            {referrals.length}/{LAE_MATRIX_SIZE}
          </strong>
        </span>
      </div>

      <div className="flex justify-center">
        <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-center">
          <p className="text-[10px] uppercase tracking-widest text-brand-300">You</p>
          <p className="text-xs text-slate-400">Matrix Owner · L{level}</p>
        </div>
      </div>

      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex flex-wrap justify-center gap-2"
          style={{ paddingLeft: rowIdx * 8 }}
        >
          {Array.from({ length: rowIdx === 0 ? 2 : rowIdx === 1 ? 4 : 8 }).map((_, i) => {
            const globalIdx = (rowIdx === 0 ? 0 : rowIdx === 1 ? 2 : 6) + i;
            const spotNum = globalIdx + 1;
            const addr = row[i];
            const meta = MATRIX_SPOT_LABELS[spotNum];
            const filled = !!addr && addr !== "0x0000000000000000000000000000000000000000";
            return (
              <div
                key={spotNum}
                className={cn(
                  "min-w-[72px] rounded-lg border px-2 py-2 text-center text-[10px]",
                  filled ? TONE[meta?.tone ?? "slate"] : "border-white/10 bg-white/[0.02] text-slate-500"
                )}
              >
                <p className="font-bold">Spot {spotNum}</p>
                <p className="mt-0.5 opacity-80">{meta?.label ?? "—"}</p>
                <p className="mt-1 font-mono text-[9px]">
                  {filled ? truncateAddress(addr) : "Empty"}
                </p>
              </div>
            );
          })}
        </div>
      ))}

      {totalEarning !== undefined && totalEarning > 0n && (
        <p className="text-center text-xs text-emerald-400">
          Level earnings: {Number(totalEarning) / 1e18} (on-chain)
        </p>
      )}
    </div>
  );
}
