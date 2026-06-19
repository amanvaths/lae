"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";
import { useClientMounted } from "@/lib/useClientMounted";
import { useWalletSession } from "@/providers/WalletSessionProvider";
import { useSensoUser } from "@/lib/contracts/hooks";
import { isCheckingRegistration, registrationReadFailed } from "@/lib/auth/registration-check";
import { withBasePath } from "@/lib/paths";

const WALLET_CHECK_MS = 2_500;

/** Connect screen — registered wallets go to dashboard; others go to registration. */
export function LoginGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useClientMounted();
  const redirecting = useRef(false);
  const { status, address } = useAccount();
  const { isReady, isWrongNetwork } = useWalletSession();
  const user = useSensoUser();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowForm(true), WALLET_CHECK_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    redirecting.current = false;
  }, [address]);

  useEffect(() => {
    if (!mounted || !isReady || redirecting.current) return;
    if (status !== "connected" || !address || isWrongNetwork) return;
    if (isCheckingRegistration(user)) return;

    if (registrationReadFailed(user)) return;

    redirecting.current = true;
    if (user.data?.registered) {
      router.replace(withBasePath("/dashboard"));
    } else {
      router.replace(withBasePath("/register"));
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
    router,
  ]);

  if (!mounted) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (
    status === "connected" &&
    address &&
    !isWrongNetwork &&
    isCheckingRegistration(user)
  ) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Checking registration…</p>
      </div>
    );
  }

  if ((status === "connecting" || status === "reconnecting") && !showForm) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        <p className="text-sm">Checking wallet…</p>
      </div>
    );
  }

  return <>{children}</>;
}
