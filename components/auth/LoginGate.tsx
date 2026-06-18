"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";
import { useClientMounted } from "@/lib/useClientMounted";

/** Redirect to dashboard when wallet is already connected. */
export function LoginGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useClientMounted();
  const { isConnected, isConnecting, isReconnecting } = useAccount();

  useEffect(() => {
    if (!mounted) return;
    if (!isConnecting && !isReconnecting && isConnected) {
      router.replace("/dashboard");
    }
  }, [mounted, isConnected, isConnecting, isReconnecting, router]);

  if (!mounted || isConnecting || isReconnecting) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Checking wallet…</p>
      </div>
    );
  }

  if (isConnected) return null;

  return <>{children}</>;
}
