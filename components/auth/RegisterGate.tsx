"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useClientMounted } from "@/lib/useClientMounted";
import { useWalletSession } from "@/providers/WalletSessionProvider";
import { useLaeUser } from "@/lib/lae-club/hooks";
import {
  isCheckingLaeRegistration,
  laeRegistrationFailed,
  useRegistrationCheckTimeout,
  useWalletConnectTimeout,
} from "@/lib/lae-club/auth-check";
import {
  RegistrationCheckError,
  RegistrationCheckSpinner,
} from "@/components/auth/RegistrationCheckBanner";
import { withBasePath } from "@/lib/paths";
import { WrongNetworkPanel } from "@/components/web3/WrongNetworkPanel";

/** Registration screen — requires connected, unregistered wallet. */
export function RegisterGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useClientMounted();
  const redirecting = useRef(false);
  const { status, address } = useAccount();
  const { isReady, isWrongNetwork } = useWalletSession();
  const user = useLaeUser();
  const { timedOut, checking, failed } = useRegistrationCheckTimeout(user);
  const walletWait = useWalletConnectTimeout(status);

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

    if (isWrongNetwork) return;

    if (isCheckingLaeRegistration(user, timedOut)) return;
    if (laeRegistrationFailed(user, timedOut)) return;

    if (user.registered) {
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
    user.registered,
    timedOut,
    router,
  ]);

  if (!mounted || !isReady || walletWait.waiting) {
    return <RegistrationCheckSpinner label="Connecting wallet…" />;
  }

  if (status !== "connected" || !address) {
    return <RegistrationCheckSpinner label="Redirecting to login…" />;
  }

  if (isWrongNetwork) {
    return <WrongNetworkPanel />;
  }

  if (checking) {
    return <RegistrationCheckSpinner label="Checking registration…" />;
  }

  if (failed) {
    return (
      <div className="px-1">
        <RegistrationCheckError
          message="Registration check timed out. Ensure you are on BSC Testnet and retry."
          onRetry={() => user.refetch()}
        />
        {children}
      </div>
    );
  }

  if (user.registered) {
    return <RegistrationCheckSpinner label="Opening dashboard…" />;
  }

  return <>{children}</>;
}
