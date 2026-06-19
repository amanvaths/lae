"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";
import { useClientMounted } from "@/lib/useClientMounted";
import { useWalletSession } from "@/providers/WalletSessionProvider";
import { useSensoUser } from "@/lib/contracts/hooks";
import {
  isCheckingRegistration,
  registrationReadFailed,
} from "@/lib/auth/registration-check";
import { withBasePath } from "@/lib/paths";

const REGISTRATION_CHECK_MS = 8_000;

/** Dashboard access: connected wallet, correct network, on-chain registration. */
export function WalletGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useClientMounted();
  const redirecting = useRef(false);
  const { isReady, isWrongNetwork } = useWalletSession();
  const { status, address } = useAccount();
  const user = useSensoUser();
  const [checkTimedOut, setCheckTimedOut] = useState(false);

  useEffect(() => {
    redirecting.current = false;
    setCheckTimedOut(false);
  }, [address]);

  useEffect(() => {
    if (!isCheckingRegistration(user)) return;
    const t = setTimeout(() => setCheckTimedOut(true), REGISTRATION_CHECK_MS);
    return () => clearTimeout(t);
  }, [user.isPending, user.data, user.isError, address]);

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

    if (isCheckingRegistration(user) && !checkTimedOut) return;

    if (registrationReadFailed(user)) return;

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
    user.isPending,
    user.isError,
    user.data?.registered,
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

  if (registrationReadFailed(user)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center text-slate-400">
        <p className="text-sm text-rose-300">Could not verify registration on-chain.</p>
        <p className="text-xs">Check BSC Testnet RPC and try reconnecting your wallet.</p>
      </div>
    );
  }

  if (isCheckingRegistration(user) && !checkTimedOut) {
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
