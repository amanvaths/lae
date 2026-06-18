"use client";

import { Loader2, AlertCircle } from "lucide-react";

export function QueryLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
      <span className="text-sm">{label}</span>
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 py-10 text-center">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="text-sm text-red-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function QueryEmpty({ message = "No data yet" }: { message?: string }) {
  return (
    <div className="py-12 text-center text-sm text-slate-500">{message}</div>
  );
}
