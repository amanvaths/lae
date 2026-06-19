"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";
import { useClientMounted } from "@/lib/useClientMounted";
import { useWalletSession } from "@/providers/WalletSessionProvider";
import { useSensoUser } from "@/lib/contracts/hooks";
import { withBasePath } from "@/lib/paths";

/** Dashboard access: connected wallet, correct network, on-chain registration. */
export function WalletGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useClientMounted();
  const redirecting = useRef(false);
  const { isReady, isWrongNetwork } = useWalletSession();
  const { status, address } = useAccount();
  const user = useSensoUser();

  useEffect(() => {
    redirecting.current = false;
  }, [address]);

  useEffect(() => {
    if (!mounted || !isReady || redirecting.current) return;

    if (status !== "connected" || !address) {
      redirecting.current = true;
      router.replace(withBasePath("/login"));
      return;
    }

    if (isWrongNetwork) {
      redirecting.current = true;
      router.replace(withBasePath("/login"));
      return;
    }

    if (user.isLoading || user.isFetching) return;

    if (!user.data?.registered) {
      redirecting.current = true;
      router.replace(withBasePath("/login/register"));
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

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (!isReady || status === "connecting" || status === "reconnecting") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Connecting wallet…</p>
      </div>
    );
  }

  if (status !== "connected" || !address || isWrongNetwork) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Redirecting to login…</p>
      </div>
    );
  }

  if (user.isLoading || user.isFetching) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Verifying registration…</p>
      </div>
    );
  }

  if (!user.data?.registered) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Redirecting to registration…</p>
      </div>
    );
  }

  return <>{children}</>;
}
