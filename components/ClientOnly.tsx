"use client";

import { useClientMounted } from "@/lib/useClientMounted";
import { Loader2 } from "lucide-react";

export function ClientOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const mounted = useClientMounted();

  if (!mounted) {
    return (
      fallback ?? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
          <p className="text-sm">Loading…</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
