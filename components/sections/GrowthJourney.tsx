"use client";

import {
  Bitcoin,
  Grid3x3,
  Layers,
  CalendarClock,
  TrendingUp,
  ShieldCheck,
  Infinity as InfinityIcon,
  Crown,
  Gem,
  Trophy,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

type Phase = {
  phase: number;
  name: string;
  tagline: string;
  icon: typeof Crown;
  accent: string;
  ring: string;
  glow: string;
  chip: string;
  spine: string;
  entryFee: string;
  duration: string;
  slots: string;
  earning: string;
  guarantee: string;
  unlock: string;
};

const phases: Phase[] = [
  {
    phase: 1,
    name: "LAE Club",
    tagline: "Start Your Journey",
    icon: Crown,
    accent: "text-amber-400",
    ring: "border-amber-500/30",
    glow: "shadow-[0_0_60px_-12px_rgba(245,158,11,0.45)]",
    chip: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    spine: "#f59e0b",
    entryFee: "0.001 BTC",
    duration: "20 Months",
    slots: "15 Slots",
    earning: "Min. 5 BTC",
    guarantee:
      "No income in 20 months? Get 2x value return from the ecosystem (as per rules).",
    unlock: "After 20 months in LAE Club, Royal Club unlocks.",
  },
  {
    phase: 2,
    name: "Royal Club",
    tagline: "Grow Your Network",
    icon: Gem,
    accent: "text-slate-200",
    ring: "border-slate-300/30",
    glow: "shadow-[0_0_60px_-12px_rgba(203,213,225,0.35)]",
    chip: "bg-slate-300/10 text-slate-200 border-slate-300/25",
    spine: "#cbd5e1",
    entryFee: "0.1 BTC",
    duration: "10 Months",
    slots: "10 Slots",
    earning: "Min. 50 BTC",
    guarantee:
      "No income in 10 months? Get 2x value return from the ecosystem (as per rules).",
    unlock: "After 10 months in Royal Club, High Rich Club unlocks.",
  },
  {
    phase: 3,
    name: "High Rich Club",
    tagline: "Achieve Financial Freedom",
    icon: Trophy,
    accent: "text-[#FFD66B]",
    ring: "border-[#FFD66B]/35",
    glow: "shadow-[0_0_70px_-10px_rgba(255,214,107,0.5)]",
    chip: "bg-[#FFD66B]/10 text-[#FFD66B] border-[#FFD66B]/30",
    spine: "#FFD66B",
    entryFee: "1 BTC",
    duration: "5 Months",
    slots: "5 Slots",
    earning: "Min. 500 BTC",
    guarantee:
      "No income in 5 months? Get 2x value return from the ecosystem (as per rules).",
    unlock: "Complete the journey — unlock financial freedom & unlimited growth.",
  },
];

const features = [
  { icon: BadgeCheck, label: "Performance Based", desc: "Rewards follow real activity" },
  { icon: InfinityIcon, label: "Clubs Never Close", desc: "Start & grow at your pace" },
  { icon: ShieldCheck, label: "Secure & Transparent", desc: "Decentralized on-chain" },
  { icon: Bitcoin, label: "Powered by BTC", desc: "BEP-20 · safe & verifiable" },
];

function DetailRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Crown;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <Icon className={cn("h-4 w-4 shrink-0", accent)} />
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className="ml-auto text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function PhaseCard({ p, side }: { p: Phase; side: "left" | "right" }) {
  const Icon = p.icon;
  return (
    <div
      className={cn(
        "relative w-full sm:w-[64%]",
        side === "left" ? "sm:self-start" : "sm:self-end"
      )}
    >
      {/* phase node badge */}
      <div
        className={cn(
          "absolute -top-4 z-20 grid h-12 w-12 place-items-center rounded-2xl border bg-ink-950/90 backdrop-blur",
          p.ring,
          p.glow,
          side === "left" ? "left-5 sm:-right-6 sm:left-auto" : "left-5 sm:-left-6"
        )}
      >
        <span className={cn("font-display text-lg font-bold", p.accent)}>{p.phase}</span>
      </div>

      <div
        className={cn(
          "group relative overflow-hidden rounded-3xl border bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 pt-9 backdrop-blur-xl transition-all duration-500 sm:p-7 sm:pt-10",
          p.ring,
          "hover:-translate-y-1",
          p.glow
        )}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-current opacity-[0.06] blur-3xl" />

        {/* header */}
        <div className="relative flex items-center gap-3">
          <span className={cn("grid h-12 w-12 place-items-center rounded-2xl border", p.ring)}>
            <Icon className={cn("h-6 w-6", p.accent)} />
          </span>
          <div>
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                p.chip
              )}
            >
              Phase {p.phase}
            </span>
            <h3 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
              {p.name}
            </h3>
          </div>
        </div>
        <p className={cn("relative mt-1 text-sm font-medium", p.accent)}>{p.tagline}</p>

        {/* details */}
        <div className="relative mt-5 grid gap-2 sm:grid-cols-2">
          <DetailRow icon={Bitcoin} label="Entry Fee" value={p.entryFee} accent={p.accent} />
          <DetailRow icon={Grid3x3} label="Matrix" value="14 Box" accent={p.accent} />
          <DetailRow icon={Layers} label="Upgrade Slots" value={p.slots} accent={p.accent} />
          <DetailRow icon={CalendarClock} label="Duration" value={p.duration} accent={p.accent} />
        </div>

        <div
          className={cn(
            "relative mt-2 flex items-center gap-2.5 rounded-xl border px-3 py-2.5",
            p.chip
          )}
        >
          <TrendingUp className={cn("h-4 w-4 shrink-0", p.accent)} />
          <span className="text-[11px] uppercase tracking-wide text-slate-400">
            Earning Potential
          </span>
          <span className={cn("ml-auto text-base font-bold", p.accent)}>{p.earning}</span>
        </div>

        {/* guarantee */}
        <p className="relative mt-3 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs leading-relaxed text-slate-400">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          {p.guarantee}
        </p>

        {/* unlock note */}
        <p className="relative mt-3 flex items-center gap-2 text-xs font-medium text-slate-300">
          <ArrowRight className={cn("h-3.5 w-3.5", p.accent)} />
          {p.unlock}
        </p>
      </div>
    </div>
  );
}

export function GrowthJourney() {
  return (
    <section id="growth" className="relative scroll-mt-28 overflow-hidden py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeading
          eyebrow="Never End Growth"
          title={
            <>
              Never End{" "}
              <span className="text-gradient-gold">LAE Club Growth</span>
            </>
          }
          description="Three Clubs · Three Levels · Unlimited Growth — one journey from LAE Club to Royal Club to High Rich Club."
        />

        <div className="relative mx-auto mt-16 max-w-4xl">
          {/* S-curve spine behind the cards */}
          <svg
            className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="growthSpine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#FFD66B" />
              </linearGradient>
            </defs>
            <path
              d="M50,4 C92,12 92,28 50,34 C8,40 8,60 50,66 C92,72 92,88 50,96"
              fill="none"
              stroke="url(#growthSpine)"
              strokeWidth="0.7"
              strokeLinecap="round"
              strokeDasharray="2 2.4"
              opacity="0.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="relative z-10 flex flex-col gap-10 sm:gap-16">
            {phases.map((p, i) => (
              <Reveal key={p.phase} delay={i}>
                <PhaseCard p={p} side={i % 2 === 0 ? "right" : "left"} />
              </Reveal>
            ))}
          </div>
        </div>

        {/* feature badges */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.label} delay={i}>
              <div className="flex h-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 backdrop-blur-xl">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                  <f.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="truncate text-xs text-slate-500">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={1}>
          <p className="mt-10 text-center text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            One Journey · Three Clubs ·{" "}
            <span className="text-gradient-gold">Unlimited Possibilities</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
