"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "login" | "register";

const copy: Record<Variant, { title: string; subtitle: string }> = {
  login: {
    title: "Silver & Gold Matrix Network",
    subtitle: "Premium on-chain wealth · 15 levels · 14-spot matrix",
  },
  register: {
    title: "Build Your LAE Network",
    subtitle: "Join the matrix · Earn BUSD · Unlock LAE rewards",
  },
};

/** Premium left-panel visual — gold/silver network theme, no cartoon assets */
export function AuthIllustration({ variant }: { variant: Variant }) {
  const { title, subtitle } = copy[variant];

  return (
    <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-[#050505] p-6 sm:min-h-[320px] lg:min-h-0 lg:rounded-none lg:border-0 lg:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(212,175,55,0.12),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(192,192,192,0.08),transparent_60%)]" />

      {/* Network grid */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#C0C0C0" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {[
          [200, 80, 120, 160],
          [200, 80, 280, 160],
          [120, 160, 80, 240],
          [120, 160, 160, 240],
          [280, 160, 240, 240],
          [280, 160, 320, 240],
          [80, 240, 60, 320],
          [160, 240, 140, 320],
          [240, 240, 220, 320],
          [320, 240, 340, 320],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#goldLine)" strokeWidth="1.5" />
        ))}
        {[
          [200, 80, "#D4AF37"],
          [120, 160, "#C0C0C0"],
          [280, 160, "#C0C0C0"],
          [80, 240, "#D4AF37"],
          [160, 240, "#C0C0C0"],
          [240, 240, "#C0C0C0"],
          [320, 240, "#D4AF37"],
          [60, 320, "#C0C0C0"],
          [140, 320, "#D4AF37"],
          [220, 320, "#C0C0C0"],
          [340, 320, "#D4AF37"],
        ].map(([cx, cy, fill], i) => (
          <circle key={`n-${i}`} cx={cx} cy={cy} r="10" fill={fill as string} opacity="0.85" />
        ))}
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-sm text-center lg:text-left"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#D4AF37]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
          LAE Club · BSC Testnet
        </div>
        <h2 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
          {title.split(" ").slice(0, -2).join(" ")}{" "}
          <span className="text-gradient-gold">{title.split(" ").slice(-2).join(" ")}</span>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{subtitle}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
          {["Matrix Income", "Royal Pool", "LAE Rewards"].map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[11px] font-medium",
                tag === "Matrix Income"
                  ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                  : "border-[#C0C0C0]/30 bg-[#C0C0C0]/5 text-[#C0C0C0]"
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
