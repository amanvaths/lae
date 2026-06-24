import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ---------------- Page heading ---------------- */
export function PageHeading({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex animate-fade-up flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon && (
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/[0.12] to-[#D4AF37]/[0.03] text-[#D4AF37] shadow-[inset_0_1px_0_0_rgba(212,175,55,0.15)] sm:h-12 sm:w-12">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl md:text-[1.75rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </div>
  );
}

/* ---------------- Panel ---------------- */
export function Panel({
  children,
  className,
  title,
  desc,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "group/panel relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-shadow duration-300 ease-premium sm:p-5 md:p-6",
        "shadow-[inset_0_1px_0_0_rgba(212,175,55,0.06),0_8px_24px_-14px_rgba(0,0,0,0.7)]",
        "hover:shadow-[inset_0_1px_0_0_rgba(212,175,55,0.1),0_14px_36px_-16px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {/* subtle top hairline accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/15 to-transparent" />
      {(title || action) && (
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-sm font-semibold tracking-tight text-white sm:text-base">
                {title}
              </h2>
            )}
            {desc && <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{desc}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------------- Stat card ---------------- */
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  accent = "brand",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: LucideIcon;
  trend?: { value: string; up?: boolean };
  accent?: "brand" | "violet" | "gold" | "emerald";
}) {
  const accents: Record<string, { glow: string; text: string; ring: string; bg: string }> = {
    brand: {
      glow: "from-[#D4AF37]/25",
      text: "text-[#D4AF37]",
      ring: "border-[#D4AF37]/20",
      bg: "from-[#D4AF37]/[0.12] to-[#D4AF37]/[0.02]",
    },
    gold: {
      glow: "from-[#D4AF37]/30",
      text: "text-[#D4AF37]",
      ring: "border-[#D4AF37]/20",
      bg: "from-[#D4AF37]/[0.14] to-[#D4AF37]/[0.02]",
    },
    violet: {
      glow: "from-accent-500/25",
      text: "text-accent-400",
      ring: "border-accent-500/20",
      bg: "from-accent-500/[0.12] to-accent-500/[0.02]",
    },
    emerald: {
      glow: "from-emerald-500/25",
      text: "text-emerald-400",
      ring: "border-emerald-500/20",
      bg: "from-emerald-500/[0.12] to-emerald-500/[0.02]",
    },
  };
  const a = accents[accent] ?? accents.brand;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-300 ease-premium sm:p-5",
        "shadow-[inset_0_1px_0_0_rgba(212,175,55,0.06),0_8px_24px_-16px_rgba(0,0,0,0.7)]",
        "hover:-translate-y-0.5 hover:border-[#D4AF37]/20 hover:shadow-[0_16px_36px_-18px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(212,175,55,0.12)]"
      )}
    >
      {/* Accent gradient glow */}
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br to-transparent opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
          a.glow
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
            {label}
          </p>
          <p className="mt-1.5 truncate font-display text-xl font-bold tracking-tight text-white sm:mt-2 sm:text-2xl">
            {value}
          </p>
          {sub && <p className="mt-1 truncate text-xs text-slate-500">{sub}</p>}
        </div>
        {Icon && (
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-gradient-to-br shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-transform duration-300 ease-premium group-hover:scale-105 sm:h-11 sm:w-11",
              a.ring,
              a.bg,
              a.text
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
        )}
      </div>
      {trend && (
        <p
          className={cn(
            "relative mt-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
            trend.up
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          )}
        >
          {trend.up ? "▲" : "▼"} {trend.value}
        </p>
      )}
    </div>
  );
}

/* ---------------- Pill / badge ---------------- */
export function Pill({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: "slate" | "brand" | "emerald" | "gold" | "violet" | "red";
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: "border-white/10 bg-white/[0.04] text-slate-300",
    brand: "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    gold: "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
    violet: "border-accent-500/30 bg-accent-500/10 text-accent-400",
    red: "border-red-500/30 bg-red-500/10 text-red-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Progress bar ---------------- */
export function Progress({
  value,
  className,
  tone = "brand",
}: {
  value: number; // 0-100
  className?: string;
  tone?: "brand" | "gold" | "emerald";
}) {
  const tones: Record<string, string> = {
    brand: "from-[#D4AF37] to-[#B8860B]",
    gold: "from-[#D4AF37] to-[#B8860B]",
    emerald: "from-emerald-400 to-emerald-600",
  };
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-white/[0.06] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      <div
        className={cn(
          "relative h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-premium",
          tones[tone]
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-40" />
      </div>
    </div>
  );
}

/* ---------------- Sparkline (responsive SVG) ---------------- */
export function Sparkline({
  data,
  height = 36,
  stroke = "#D4AF37",
  className,
}: {
  data: number[];
  height?: number;
  stroke?: string;
  className?: string;
}) {
  if (!data.length) return null;
  const vbW = 100;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = vbW / (data.length - 1);
  const pts = data.map((d, i) => [
    i * step,
    height - ((d - min) / range) * (height - 4) - 2,
  ]);
  const path = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`)
    .join(" ");
  const area = `${path} L${vbW},${height} L0,${height} Z`;
  const id = `sp-${stroke.replace("#", "")}`;
  return (
    <div className={cn("w-full min-w-0", className)} style={{ height }}>
      <svg
        viewBox={`0 0 ${vbW} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ---------------- Horizontal scroll table wrapper ---------------- */
export function TableWrap({
  children,
  minWidth = 560,
}: {
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}

/* ---------------- Empty / coming-soon notice ---------------- */
export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/[0.08] to-[#D4AF37]/[0.02] px-4 py-3 text-sm text-[#D4AF37]/90 shadow-[inset_0_1px_0_0_rgba(212,175,55,0.1)]">
      {children}
    </div>
  );
}

/* ---------------- Skeleton primitives ---------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3.5"
          style={{ width: `${90 - i * (60 / Math.max(1, lines))}%` }}
        />
      ))}
    </div>
  );
}

/* ---------------- Rich empty state ---------------- */
export function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-12 text-center">
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#D4AF37]/15 bg-gradient-to-br from-[#D4AF37]/[0.1] to-transparent text-[#D4AF37]/70">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <div>
        <p className="font-display text-sm font-semibold text-white">{title}</p>
        {desc && <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{desc}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/* ---------------- CTA link button ---------------- */
export function ActionLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <Link href={href} className={variant === "primary" ? "btn-primary" : "btn-ghost"}>
      {children}
    </Link>
  );
}
