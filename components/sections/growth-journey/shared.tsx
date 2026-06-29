"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CLUBS, DETAIL_ICONS, END_COPY, FEATURES, type ClubPhase } from "./data";

export function JourneyHeader({ className }: { className?: string }) {
  return (
    <div className={cn("text-center", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D4AF37] sm:text-xs">
        Never End
      </p>
      <h2 className="mt-2 font-display text-[1.75rem] font-bold italic leading-tight sm:text-4xl lg:text-[2.75rem]">
        <span className="bg-gradient-to-r from-[#FFF4C2] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">
          LAE CLUB
        </span>{" "}
        <span className="relative inline-block text-white">
          GROWTH
          <svg
            className="absolute -right-5 -top-1 h-5 w-5 text-[#FFD700] sm:-right-7 sm:h-7 sm:w-7"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M4 18 L18 4 M18 4 H8 M18 4 V14"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </h2>
      <div className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-3 px-2">
        <span className="hidden h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/45 sm:block" />
        <p className="text-center text-[10px] font-semibold uppercase leading-snug tracking-[0.18em] text-[#D4AF37] sm:text-[11px] sm:tracking-[0.22em]">
          Three Clubs • Three Levels • Unlimited Growth
        </p>
        <span className="hidden h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/45 sm:block" />
      </div>
    </div>
  );
}

export function GoldCircle({
  children,
  className,
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-11 w-11",
    md: "h-14 w-14",
    lg: "h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20",
  };
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full border-2 border-[#D4AF37]/70 bg-gradient-to-b from-[#FFD700]/20 to-[#B8860B]/10 shadow-[0_0_24px_rgba(212,175,55,0.35)]",
        sizes[size],
        className
      )}
    >
      {children}
    </div>
  );
}

export function MilestoneBubble({
  months,
  compact,
  className,
}: {
  months: number | "growth";
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-full border-2 border-[#D4AF37]/55 bg-black/80 px-3 py-2 text-center shadow-[0_0_20px_rgba(212,175,55,0.2)] backdrop-blur-sm",
        compact ? "max-w-[108px]" : "max-w-[132px] sm:max-w-[148px]",
        className
      )}
    >
      {months === "growth" ? (
        <>
          <p className="text-[11px] font-bold uppercase leading-tight text-[#FFD700]">Unlimited</p>
          <p className="text-[10px] font-bold uppercase leading-tight text-[#FFD700]">Growth</p>
        </>
      ) : (
        <>
          <p className="text-sm font-bold leading-none text-[#FFD700] sm:text-base">{months} Months</p>
          <p className="mt-1 text-[8px] font-semibold uppercase leading-tight tracking-wide text-slate-300 sm:text-[9px]">
            Stay Active & Complete Your Journey
          </p>
        </>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[#D4AF37]/12 py-2 last:border-b-0">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]" strokeWidth={2.2} />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="ml-auto text-right text-[11px] font-bold uppercase text-white">{value}</span>
    </div>
  );
}

export function ClubCard({
  club,
  variant = "mobile",
  className,
}: {
  club: ClubPhase;
  variant?: "mobile" | "desktop";
  className?: string;
}) {
  const Icon = club.icon;
  const compact = variant === "desktop";

  return (
    <div
      className={cn(
        "rounded-xl border border-[#D4AF37]/25 bg-gradient-to-b from-[#141414] to-[#080808] shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(212,175,55,0.08)]",
        compact ? "w-[168px] px-2.5 py-3 sm:w-[188px]" : "w-full px-4 py-4",
        className
      )}
    >
      <div className="flex flex-col items-center text-center">
        <GoldCircle size={compact ? "sm" : "md"}>
          <Icon className={cn("text-[#FFD700]", compact ? "h-5 w-5" : "h-6 w-6")} strokeWidth={1.8} />
        </GoldCircle>
        {compact ? (
          <>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-200">
              {club.num}. {club.name}
            </p>
            <span className="mt-1 inline-flex rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#FFD700]">
              Phase {club.phase}
            </span>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]">
              {club.tagline}
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-100">
              {club.name}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#D4AF37]">
              Phase {club.phase} • {club.tagline}
            </p>
          </>
        )}
      </div>

      <div className={cn("mt-3", compact && "space-y-0")}>
        <DetailRow icon={DETAIL_ICONS.entry} label="Entry Fee" value={club.entryFee} />
        <DetailRow icon={DETAIL_ICONS.matrix} label="Matrix" value={club.matrix} />
        <DetailRow icon={DETAIL_ICONS.slots} label="Upgrade Slots" value={club.slots} />
        <DetailRow icon={DETAIL_ICONS.duration} label="Duration" value={club.duration} />
        <DetailRow icon={DETAIL_ICONS.earning} label="Earning Potential" value={club.earning} />
      </div>

      <div className="mt-2 rounded-lg border border-[#D4AF37]/25 bg-black/50 px-2.5 py-2.5">
        <p className="text-[10px] font-medium uppercase leading-snug text-slate-200 sm:text-[11px]">
          <DETAIL_ICONS.guarantee className="mr-1 inline h-3.5 w-3.5 text-[#D4AF37]" />
          No income in {club.guaranteeMonths} months? Get{" "}
          <span className="font-bold text-[#FFD700]">2x value</span> return from ecosystem (as per
          rules).
        </p>
      </div>
    </div>
  );
}

export function FeatureBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#121212] to-[#080808] p-3 sm:p-4",
        className
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-2.5 border-[#D4AF37]/15 sm:border-r sm:pr-3 last:sm:border-r-0"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10">
              <f.icon className="h-4 w-4 text-[#FFD700]" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase leading-snug text-white sm:text-[11px]">
                {f.title}
              </p>
              <p className="mt-0.5 text-[9px] leading-snug text-slate-400 sm:text-[10px]">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FooterTagline({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37] sm:text-[11px] sm:tracking-[0.28em]",
        className
      )}
    >
      One Journey • Three Clubs • Unlimited Possibilities
    </p>
  );
}

export function EndJourneyBlock({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", compact ? "max-w-[140px]" : "max-w-xs")}>
      <GoldCircle size={compact ? "sm" : "md"}>
        <DETAIL_ICONS.earning className="h-5 w-5 text-[#FFD700]" />
      </GoldCircle>
      <p className="text-left text-[10px] font-semibold uppercase leading-snug text-slate-200 sm:text-[11px]">
        {END_COPY}
      </p>
    </div>
  );
}

export { CLUBS };
