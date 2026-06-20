"use client";

import { Loader2, RefreshCw } from "lucide-react";

export function RegistrationCheckSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function RegistrationCheckError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-center">
      <p className="text-sm text-amber-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
