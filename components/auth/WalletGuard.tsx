"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useClientMounted } from "@/lib/useClientMounted";
import { contractKeys } from "@/lib/contracts/query-keys";
import { withBasePath } from "@/lib/paths";

/** Dashboard access requires a connected wallet (on-chain mode). */
export function WalletGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const mounted = useClientMounted();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { status } = useAccount();

  useEffect(() => {
    if (!mounted) return;

    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
      redirectTimer.current = null;
    }

    if (status === "connected" || status === "connecting" || status === "reconnecting") {
      return;
    }

    if (status === "disconnected") {
      redirectTimer.current = setTimeout(() => {
        qc.removeQueries({ queryKey: contractKeys.all });
        router.replace(withBasePath("/login"));
      }, 600);
    }

    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [mounted, status, router, qc]);

  if (!mounted || status === "connecting" || status === "reconnecting") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Connecting wallet…</p>
      </div>
    );
  }

  if (status !== "connected") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}
