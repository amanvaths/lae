"use client";

import { AlertCircle, RefreshCw, Inbox } from "lucide-react";
import { Skeleton } from "./ui";

export function QueryLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-4 py-14 text-slate-400">
      <div className="relative h-10 w-10">
        <span className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#D4AF37] [animation-duration:0.8s]" />
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Premium skeleton placeholder for a stat-grid + panel layout. */
export function SkeletonDashboard() {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-28" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-5 h-48 w-full" />
      </div>
    </div>
  );
}

export function QueryError({
  message = "Failed to load data",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex animate-scale-in flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.08] to-transparent py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
        <AlertCircle className="h-6 w-6" />
      </span>
      <p className="text-sm text-red-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-[#D4AF37]/30 hover:bg-white/[0.06]"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}

export function QueryEmpty({ message = "No data yet" }: { message?: string }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-3 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.02] text-slate-500">
        <Inbox className="h-6 w-6" />
      </span>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
