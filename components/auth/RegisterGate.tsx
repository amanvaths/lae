"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";
import { useClientMounted } from "@/lib/useClientMounted";
import { useWalletSession } from "@/providers/WalletSessionProvider";
import { useSensoUser } from "@/lib/contracts/hooks";
import { withBasePath } from "@/lib/paths";

/** Registration screen — requires connected, unregistered wallet. */
export function RegisterGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useClientMounted();
  const redirecting = useRef(false);
  const { status, address } = useAccount();
  const { isReady, isWrongNetwork } = useWalletSession();
  const user = useSensoUser();

  useEffect(() => {
    redirecting.current = false;
  }, [address]);

  useEffect(() => {
    if (!mounted || !isReady || redirecting.current) return;

    if (status !== "connected" || !address || isWrongNetwork) {
      redirecting.current = true;
      router.replace(withBasePath("/login"));
      return;
    }

    if (user.isLoading || user.isFetching) return;

    if (user.data?.registered) {
      redirecting.current = true;
      router.replace(withBasePath("/dashboard"));
    }
  }, [
    mounted,
    isReady,
    status,
    address,
    isWrongNetwork,
    user.isLoading,
    user.isFetching,
    user.data?.registered,
    router,
  ]);

  if (!mounted || !isReady || status === "connecting" || status === "reconnecting") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Connecting wallet…</p>
      </div>
    );
  }

  if (status !== "connected" || !address) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Redirecting to login…</p>
      </div>
    );
  }

  if (user.isLoading || user.isFetching) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Checking registration…</p>
      </div>
    );
  }

  if (user.data?.registered) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Opening dashboard…</p>
      </div>
    );
  }

  return <>{children}</>;
}
