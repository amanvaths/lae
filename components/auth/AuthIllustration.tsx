"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Crown, TrendingUp, Users, Layers, Sparkles, Shield } from "lucide-react";

type Variant = "login" | "register";

const copy: Record<Variant, { title: string; highlight: string; subtitle: string }> = {
  login: {
    title: "Silver & Gold",
    highlight: "Matrix Network",
    subtitle: "Premium on-chain wealth · 15 levels · 14-spot matrix · Automated income distribution",
  },
  register: {
    title: "Join The LAE Club",
    highlight: "Network",
    subtitle: "Activate your account and start building your 15-Level Smart Matrix. Earn BUSD income automatically.",
  },
};

const features: Record<Variant, { icon: typeof Crown; label: string; desc: string }[]> = {
  login: [
    { icon: TrendingUp, label: "Matrix Income", desc: "Automated BUSD payouts" },
    { icon: Crown, label: "Royal Pool", desc: "Premium earning tier" },
    { icon: Sparkles, label: "LAE Rewards", desc: "20-month vested tokens" },
  ],
  register: [
    { icon: Layers, label: "15 Levels", desc: "Auto-upgrade system" },
    { icon: Users, label: "14-Spot Matrix", desc: "Silver & Gold positions" },
    { icon: Shield, label: "On-Chain", desc: "100% blockchain secured" },
  ],
};

export function AuthIllustration({ variant }: { variant: Variant }) {
  const { title, highlight, subtitle } = copy[variant];
  const feats = features[variant];

  return (
    <div className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[#D4AF37]/10 bg-gradient-to-br from-[#0A0A0A] via-[#050505] to-[#0D0D0D] p-6 sm:min-h-[380px] lg:min-h-0 lg:rounded-3xl lg:p-10">
      {/* Gold ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]/[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[250px] w-[250px] rounded-full bg-[#C0C0C0]/[0.04] blur-[80px]" />

      {/* Matrix tree network — larger and more prominent */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 500 500"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="authGoldLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#C0C0C0" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id="authGoldGlow">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Tree connections */}
        {[
          [250, 90, 150, 180], [250, 90, 350, 180],
          [150, 180, 80, 270], [150, 180, 180, 270],
          [350, 180, 320, 270], [350, 180, 420, 270],
          [80, 270, 50, 370], [80, 270, 110, 370],
          [180, 270, 160, 370], [180, 270, 210, 370],
          [320, 270, 290, 370], [320, 270, 350, 370],
          [420, 270, 400, 370], [420, 270, 450, 370],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={`l-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#authGoldLine)" strokeWidth="1.5" />
        ))}

        {/* Top node with glow */}
        <circle cx="250" cy="90" r="24" fill="url(#authGoldGlow)" />
        <circle cx="250" cy="90" r="14" fill="#D4AF37" opacity="0.9" />
        <text x="250" y="94" textAnchor="middle" fill="#050505" fontSize="10" fontWeight="800">YOU</text>

        {/* Level 1 nodes */}
        {[[150, 180, "#D4AF37"], [350, 180, "#D4AF37"]].map(([cx, cy, fill], i) => (
          <g key={`n1-${i}`}>
            <circle cx={cx} cy={cy} r="12" fill={fill as string} opacity="0.8" />
            <text x={cx as number} y={(cy as number) + 4} textAnchor="middle" fill="#050505" fontSize="7" fontWeight="700">{i + 1}</text>
          </g>
        ))}

        {/* Level 2 nodes */}
        {[[80, 270, "#C0C0C0"], [180, 270, "#D4AF37"], [320, 270, "#D4AF37"], [420, 270, "#C0C0C0"]].map(([cx, cy, fill], i) => (
          <g key={`n2-${i}`}>
            <circle cx={cx} cy={cy} r="10" fill={fill as string} opacity="0.75" />
            <text x={cx as number} y={(cy as number) + 3} textAnchor="middle" fill="#050505" fontSize="6" fontWeight="700">{i + 3}</text>
          </g>
        ))}

        {/* Level 3 nodes */}
        {[
          [50, 370, "#D4AF37"], [110, 370, "#C0C0C0"],
          [160, 370, "#C0C0C0"], [210, 370, "#D4AF37"],
          [290, 370, "#C0C0C0"], [350, 370, "#C0C0C0"],
          [400, 370, "#D4AF37"], [450, 370, "#D4AF37"],
        ].map(([cx, cy, fill], i) => (
          <g key={`n3-${i}`}>
            <circle cx={cx} cy={cy} r="8" fill={fill as string} opacity="0.65" />
            <text x={cx as number} y={(cy as number) + 3} textAnchor="middle" fill="#050505" fontSize="5" fontWeight="700">{i + 7}</text>
          </g>
        ))}
      </svg>

      {/* Content overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-md text-center lg:text-left"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
          <span className="h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />
          LAE Club · BSC Testnet
        </div>

        <h2 className="font-display text-3xl font-black leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
          {title}{" "}
          <span className="text-gradient-gold">{highlight}</span>
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-400 lg:text-base">{subtitle}</p>

        {/* Feature cards */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
          {feats.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all hover:scale-105",
                i === 0
                  ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                  : "border-[#C0C0C0]/20 bg-[#C0C0C0]/5"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 shrink-0",
                i === 0 ? "text-[#D4AF37]" : "text-[#C0C0C0]"
              )} />
              <div>
                <p className={cn(
                  "text-xs font-bold",
                  i === 0 ? "text-[#D4AF37]" : "text-[#C0C0C0]"
                )}>{label}</p>
                <p className="text-[10px] text-slate-500">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
          {["100% On-Chain", "Automated Payouts", "BSC Secured"].map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <Shield className="h-3 w-3 text-[#D4AF37]/60" />
              {t}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
