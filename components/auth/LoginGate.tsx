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

const WALLET_CHECK_MS = 2_500;

/** Connect screen — registered wallets go to dashboard; others go to registration. */
export function LoginGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useClientMounted();
  const redirecting = useRef(false);
  const { status, address } = useAccount();
  const { isReady, isWrongNetwork } = useWalletSession();
  const user = useLaeUser();
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
    if (isCheckingLaeRegistration(user)) return;

    if (laeRegistrationFailed(user)) return;

    redirecting.current = true;
    if (user.registered) {
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
    user.isLoading,
    user.registered,
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
    isCheckingLaeRegistration(user)
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
