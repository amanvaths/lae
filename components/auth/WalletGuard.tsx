"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";
import { useClientMounted } from "@/lib/useClientMounted";
import { useWalletSession } from "@/providers/WalletSessionProvider";
import { useLaeUser } from "@/lib/lae-club/hooks";
import { isCheckingLaeRegistration, laeRegistrationFailed } from "@/lib/lae-club/auth-check";
import { withBasePath } from "@/lib/paths";

const REGISTRATION_CHECK_MS = 8_000;

/** Dashboard access: connected wallet, correct network, on-chain registration. */
export function WalletGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useClientMounted();
  const redirecting = useRef(false);
  const { isReady, isWrongNetwork } = useWalletSession();
  const { status, address } = useAccount();
  const user = useLaeUser();
  const [checkTimedOut, setCheckTimedOut] = useState(false);

  useEffect(() => {
    redirecting.current = false;
    setCheckTimedOut(false);
  }, [address]);

  useEffect(() => {
    if (!isCheckingLaeRegistration(user)) return;
    const t = setTimeout(() => setCheckTimedOut(true), REGISTRATION_CHECK_MS);
    return () => clearTimeout(t);
  }, [user.isLoading, user.registered, address]);

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

    if (isCheckingLaeRegistration(user) && !checkTimedOut) return;
    if (laeRegistrationFailed(user)) return;

    if (!user.registered) {
      redirecting.current = true;
      router.replace(withBasePath("/register"));
    }
  }, [
    mounted,
    isReady,
    status,
    address,
    isWrongNetwork,
    user.isLoading,
    user.registered,
    checkTimedOut,
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

  if (laeRegistrationFailed(user)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center text-slate-400">
        <p className="text-sm text-rose-300">Could not verify registration on-chain.</p>
        <p className="text-xs">Check BSC Testnet RPC and try reconnecting your wallet.</p>
      </div>
    );
  }

  if (isCheckingLaeRegistration(user) && !checkTimedOut) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Verifying registration…</p>
      </div>
    );
  }

  if (!user.registered) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Redirecting to registration…</p>
      </div>
    );
  }

  return <>{children}</>;
}
