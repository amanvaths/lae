"use client";

import {
  ArrowDownLeft,
  CornerDownRight,
  Landmark,
  LayoutGrid,
  RefreshCw,
  ChevronsUp,
  UserPlus,
  XCircle,
  Gift,
  Activity,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress, formatDate } from "@/lib/format";
import { txUrl } from "@/lib/lae-club/contracts";
import {
  describeMatrixEvent,
  type EventCategory,
  type MatrixEventView,
} from "@/lib/lae-club/event-format";
import type { MatrixUserEvent } from "@/lib/lae-club/matrix-events";

const ICONS: Record<EventCategory, LucideIcon> = {
  income: ArrowDownLeft,
  lapse: CornerDownRight,
  treasury: Landmark,
  placement: LayoutGrid,
  recycle: RefreshCw,
  upgrade: ChevronsUp,
  registration: UserPlus,
  missed: XCircle,
  reward: Gift,
  other: Activity,
};

const TONES: Record<
  EventCategory,
  { icon: string; ring: string; text: string; dot: string }
> = {
  income: {
    icon: "text-emerald-300",
    ring: "border-emerald-500/25 bg-emerald-500/10",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  lapse: {
    icon: "text-teal-300",
    ring: "border-teal-500/25 bg-teal-500/10",
    text: "text-teal-300",
    dot: "bg-teal-400",
  },
  treasury: {
    icon: "text-violet-300",
    ring: "border-violet-500/25 bg-violet-500/10",
    text: "text-violet-300",
    dot: "bg-violet-400",
  },
  placement: {
    icon: "text-[#D4AF37]",
    ring: "border-[#D4AF37]/25 bg-[#D4AF37]/10",
    text: "text-[#D4AF37]",
    dot: "bg-[#D4AF37]",
  },
  recycle: {
    icon: "text-amber-300",
    ring: "border-amber-500/25 bg-amber-500/10",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
  upgrade: {
    icon: "text-sky-300",
    ring: "border-sky-500/25 bg-sky-500/10",
    text: "text-sky-300",
    dot: "bg-sky-400",
  },
  registration: {
    icon: "text-[#D4AF37]",
    ring: "border-[#D4AF37]/25 bg-[#D4AF37]/10",
    text: "text-[#D4AF37]",
    dot: "bg-[#D4AF37]",
  },
  missed: {
    icon: "text-red-300",
    ring: "border-red-500/25 bg-red-500/10",
    text: "text-red-300",
    dot: "bg-red-400",
  },
  reward: {
    icon: "text-emerald-300",
    ring: "border-emerald-500/25 bg-emerald-500/10",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  other: {
    icon: "text-slate-300",
    ring: "border-white/10 bg-white/5",
    text: "text-slate-300",
    dot: "bg-slate-400",
  },
};

function timeLabel(v: MatrixEventView): string | null {
  if (v.createdAt) {
    const t = formatDate(v.createdAt);
    if (t && t !== "Invalid Date") return t;
  }
  if (v.blockNumber) return `Block ${v.blockNumber.toString()}`;
  return null;
}

function ActivityRow({ v, compact }: { v: MatrixEventView; compact?: boolean }) {
  const Icon = ICONS[v.category];
  const tone = TONES[v.category];
  const when = timeLabel(v);

  return (
    <div className="flex items-center gap-3 py-3 transition-colors hover:bg-white/[0.02] sm:gap-3.5">
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:h-10 sm:w-10",
          tone.ring
        )}
      >
        <Icon className={cn("h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem]", tone.icon)} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-semibold text-white">{v.label}</span>
          {!compact &&
            v.chips.map((c) => (
              <span
                key={c}
                className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
              >
                {c}
              </span>
            ))}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 truncate text-xs text-slate-500">
          {v.description && <span className="truncate">{v.description}</span>}
          {when && (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:inline-block" />
              {when}
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {v.amount != null && v.amount > 0n ? (
          <span
            className={cn(
              "font-display text-sm font-bold tabular-nums",
              v.isCredit ? "text-emerald-400" : "text-slate-300"
            )}
          >
            {v.isCredit ? "+" : ""}
            {fmtEther(v.amount)}
          </span>
        ) : (
          <span className={cn("text-[11px] font-medium", tone.text)}>
            {v.chips[0] ?? "—"}
          </span>
        )}
        <a
          href={txUrl(v.txHash)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-500 transition-colors hover:text-[#D4AF37]"
          title={v.txHash}
        >
          {truncateAddress(v.txHash, 6, 4)}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}

export function ActivityFeed({
  events,
  compact = false,
  emptyLabel = "No activity yet",
}: {
  events: MatrixUserEvent[];
  compact?: boolean;
  emptyLabel?: string;
}) {
  if (!events || events.length === 0) {
    return <p className="py-2 text-sm text-slate-500">{emptyLabel}</p>;
  }
  return (
    <div className="divide-y divide-white/[0.06]">
      {events.map((e, i) => {
        const v = describeMatrixEvent(e);
        return <ActivityRow key={`${v.key}-${i}`} v={v} compact={compact} />;
      })}
    </div>
  );
}
