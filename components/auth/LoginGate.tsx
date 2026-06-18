"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";
import { useClientMounted } from "@/lib/useClientMounted";
import { withBasePath } from "@/lib/paths";

/** Redirect to dashboard when wallet is already connected. */
export function LoginGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useClientMounted();
  const redirected = useRef(false);
  const { status } = useAccount();

  useEffect(() => {
    if (!mounted || redirected.current) return;
    if (status === "connected") {
      redirected.current = true;
      router.replace(withBasePath("/dashboard"));
    }
  }, [mounted, status, router]);

  if (!mounted || status === "connecting" || status === "reconnecting") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Checking wallet…</p>
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Opening dashboard…</p>
      </div>
    );
  }

  return <>{children}</>;
}
