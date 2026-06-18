"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useClientMounted } from "@/lib/useClientMounted";
import { contractKeys } from "@/lib/contracts/query-keys";

/** Dashboard access requires a connected wallet (on-chain mode). */
export function WalletGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const mounted = useClientMounted();
  const { isConnected, isConnecting, isReconnecting } = useAccount();

  useEffect(() => {
    if (!mounted) return;
    if (!isConnecting && !isReconnecting && !isConnected) {
      qc.removeQueries({ queryKey: contractKeys.all });
      router.replace("/login");
    }
  }, [mounted, isConnected, isConnecting, isReconnecting, router, qc]);

  if (!mounted || isConnecting || isReconnecting) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Connecting wallet…</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}
