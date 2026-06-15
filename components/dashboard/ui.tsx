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
    <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-brand-300 sm:h-11 sm:w-11">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl">
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
    <section className={cn("glass overflow-hidden p-4 sm:p-5 md:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-sm font-semibold text-white sm:text-base">
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
  const accents: Record<string, string> = {
    brand: "from-brand-500/20 text-brand-300",
    violet: "from-accent-500/20 text-accent-400",
    gold: "from-gold-400/20 text-gold-400",
    emerald: "from-emerald-500/20 text-emerald-400",
  };
  return (
    <div className="group glass glass-hover relative overflow-hidden p-4 sm:p-5">
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100",
          accents[accent]
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
            {label}
          </p>
          <p className="mt-1.5 truncate font-display text-xl font-bold text-white sm:mt-2 sm:text-2xl">
            {value}
          </p>
          {sub && <p className="mt-1 truncate text-xs text-slate-500">{sub}</p>}
        </div>
        {Icon && (
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] sm:h-10 sm:w-10",
              accents[accent].split(" ")[1]
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
        )}
      </div>
      {trend && (
        <p
          className={cn(
            "relative mt-3 inline-flex items-center gap-1 text-xs font-medium",
            trend.up ? "text-emerald-400" : "text-red-400"
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
    brand: "border-brand-500/30 bg-brand-500/10 text-brand-200",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    gold: "border-gold-400/30 bg-gold-400/10 text-gold-300",
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
    brand: "from-brand-400 to-accent-500",
    gold: "from-gold-300 to-gold-500",
    emerald: "from-emerald-400 to-emerald-600",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/5", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ---------------- Sparkline (responsive SVG) ---------------- */
export function Sparkline({
  data,
  height = 36,
  stroke = "#48bcff",
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
    <div className="rounded-xl border border-brand-500/20 bg-brand-500/[0.06] px-4 py-3 text-sm text-brand-100/80">
      {children}
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
