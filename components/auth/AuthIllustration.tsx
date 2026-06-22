"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Crown, TrendingUp, Users, Layers, Sparkles, Shield } from "lucide-react";
import { GOLD_SPOTS, SILVER_SPOTS } from "@/lib/lae-club/constants";

type Variant = "login" | "register";

const copy: Record<Variant, { title: string; highlight: string; subtitle: string }> = {
  login: {
    title: "Silver & Gold",
    highlight: "Matrix Network",
    subtitle: "Premium on-chain wealth · 15 levels · 14-spot matrix",
  },
  register: {
    title: "Join The LAE Club",
    highlight: "Network",
    subtitle: "Activate your account and start building your 15-Level Smart Matrix.",
  },
};

const features: Record<Variant, { icon: typeof Crown; label: string; desc: string }[]> = {
  login: [
    { icon: TrendingUp, label: "Matrix Income", desc: "Automated BUSD" },
    { icon: Crown, label: "Royal Pool", desc: "Premium tier" },
    { icon: Sparkles, label: "LAE Rewards", desc: "20-month vesting" },
  ],
  register: [
    { icon: Layers, label: "15 Levels", desc: "Auto-upgrade" },
    { icon: Users, label: "14-Spot Matrix", desc: "Gold & Silver" },
    { icon: Shield, label: "On-Chain", desc: "100% secured" },
  ],
};

const MATRIX_ROWS = [
  [1, 2],
  [3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12, 13, 14],
] as const;

function isGoldSpot(n: number) {
  return (GOLD_SPOTS as readonly number[]).includes(n);
}

function isSilverSpot(n: number) {
  return (SILVER_SPOTS as readonly number[]).includes(n);
}

/** Compact decorative 14-spot matrix — matches dashboard layout, no overlap with text */
function AuthMatrixTree() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] px-2 py-4">
      {/* Soft glow behind tree */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />

      <div className="relative flex flex-col items-center">
        {/* YOU */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative z-10 rounded-xl border-2 border-[#D4AF37]/70 bg-gradient-to-b from-[#F5D760] via-[#D4AF37] to-[#B8962E] px-6 py-2 shadow-[0_0_24px_rgba(212,175,55,0.45)]"
        >
          <span className="text-xs font-black tracking-[0.2em] text-[#1a1200]">YOU</span>
        </motion.div>

        {/* Connector YOU → row 1 */}
        <div className="h-5 w-px bg-gradient-to-b from-[#D4AF37] to-[#D4AF37]/30" />

        {MATRIX_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex w-full flex-col items-center">
            {rowIdx > 0 && (
              <div className="relative mb-1 flex h-4 w-full items-end justify-center">
                <div
                  className="absolute top-0 h-3 w-px bg-[#D4AF37]/40"
                  style={{ left: "50%", transform: "translateX(-50%)" }}
                />
                <div
                  className="absolute top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"
                  style={{
                    left: `${100 / (row.length * 2)}%`,
                    right: `${100 / (row.length * 2)}%`,
                  }}
                />
                {row.map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-3 w-px bg-[#D4AF37]/35"
                    style={{ left: `${((i + 0.5) / row.length) * 100}%` }}
                  />
                ))}
              </div>
            )}

            <div
              className={cn(
                "flex items-start justify-center",
                rowIdx === 0 && "gap-16 sm:gap-24",
                rowIdx === 1 && "gap-3 sm:gap-5",
                rowIdx === 2 && "gap-1 sm:gap-1.5"
              )}
            >
              {row.map((spot, i) => (
                <motion.div
                  key={spot}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + rowIdx * 0.08 + i * 0.03, duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  {rowIdx > 0 && (
                    <div className="mb-0.5 h-2 w-px bg-gradient-to-b from-[#D4AF37]/50 to-transparent" />
                  )}
                  <MatrixNode spot={spot} compact={rowIdx === 2} />
                </motion.div>
              ))}
            </div>

            {!rowIdx && <div className="h-4 w-px bg-gradient-to-b from-[#D4AF37]/40 to-transparent" />}
          </div>
        ))}

        {/* Legend */}
        <div className="mt-5 flex items-center justify-center gap-5">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-b from-[#F5D760] to-[#B8962E] shadow-[0_0_6px_rgba(212,175,55,0.5)]" />
            Gold
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-b from-[#E8E8E8] to-[#A8A8A8]" />
            Silver
          </span>
        </div>
      </div>
    </div>
  );
}

function MatrixNode({ spot, compact }: { spot: number; compact?: boolean }) {
  const gold = isGoldSpot(spot);
  const silver = isSilverSpot(spot);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border font-bold",
        compact ? "h-7 w-7 text-[8px] sm:h-8 sm:w-8 sm:text-[9px]" : "h-9 w-9 text-[10px] sm:h-10 sm:w-10 sm:text-[11px]",
        gold &&
          "border-[#D4AF37]/60 bg-gradient-to-b from-[#F5D760] via-[#D4AF37] to-[#B8962E] text-[#1a1200] shadow-[0_0_10px_rgba(212,175,55,0.35)]",
        silver &&
          "border-[#C0C0C0]/50 bg-gradient-to-b from-[#E8E8E8] via-[#C0C0C0] to-[#A0A0A0] text-[#1a1a1a] shadow-[0_0_8px_rgba(192,192,192,0.2)]",
        !gold && !silver && "border-white/20 bg-white/10 text-white"
      )}
    >
      {spot}
    </div>
  );
}

export function AuthIllustration({ variant }: { variant: Variant }) {
  const { title, highlight, subtitle } = copy[variant];
  const feats = features[variant];

  return (
    <div className="relative flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#D4AF37]/10 bg-gradient-to-br from-[#0A0A0A] via-[#050505] to-[#080808] lg:min-h-0 lg:rounded-3xl">
      {/* Ambient background — stays behind everything */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#C0C0C0]/[0.03] blur-[60px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-5 sm:p-6 lg:p-8">
        {/* Header — top section, no overlap */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="shrink-0 text-center lg:text-left"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#D4AF37]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
            LAE Club · BSC Testnet
          </div>

          <h2 className="font-display text-2xl font-black leading-tight text-white sm:text-3xl lg:text-[2.25rem]">
            {title}{" "}
            <span className="text-gradient-gold">{highlight}</span>
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">{subtitle}</p>
        </motion.header>

        {/* Matrix tree — dedicated card, isolated from text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="my-5 shrink-0 rounded-2xl border border-white/[0.06] bg-black/30 py-3 backdrop-blur-sm sm:my-6"
        >
          <AuthMatrixTree />
        </motion.div>

        {/* Feature cards — bottom row, equal width, no overlap */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-auto grid shrink-0 grid-cols-3 gap-2 sm:gap-3"
        >
          {feats.map(({ icon: Icon, label, desc }, i) => (
            <div
              key={label}
              className={cn(
                "flex flex-col items-center rounded-xl border px-2 py-3 text-center transition-all sm:px-3 sm:py-3.5",
                i === 0
                  ? "border-[#D4AF37]/35 bg-[#D4AF37]/[0.08] shadow-[0_0_20px_rgba(212,175,55,0.08)]"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-[#C0C0C0]/25"
              )}
            >
              <Icon
                className={cn(
                  "mb-1.5 h-4 w-4 sm:h-5 sm:w-5",
                  i === 0 ? "text-[#D4AF37]" : "text-[#C0C0C0]"
                )}
              />
              <p
                className={cn(
                  "text-[10px] font-bold leading-tight sm:text-xs",
                  i === 0 ? "text-[#D4AF37]" : "text-slate-300"
                )}
              >
                {label}
              </p>
              <p className="mt-0.5 hidden text-[9px] text-slate-500 sm:block">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-white/[0.05] pt-4 lg:justify-start"
        >
          {["100% On-Chain", "Automated Payouts", "BSC Secured"].map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 text-[10px] font-medium text-slate-500"
            >
              <Shield className="h-3 w-3 shrink-0 text-[#D4AF37]/50" />
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
