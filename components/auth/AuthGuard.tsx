"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthContext } from "@/providers/AuthProvider";
import { Loader2 } from "lucide-react";
import { withBasePath } from "@/lib/paths";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(withBasePath("/login"));
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Loading your account…</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
