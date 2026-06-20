"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
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

/** Connect screen — registered wallets go to dashboard; others go to registration. */
export function LoginGate({ children }: { children: ReactNode }) {
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
    if (status !== "connected" || !address || isWrongNetwork) return;
    if (isCheckingLaeRegistration(user, timedOut)) return;
    if (laeRegistrationFailed(user, timedOut)) return;

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
    timedOut,
    router,
  ]);

  if (!mounted) {
    return <RegistrationCheckSpinner label="Loading…" />;
  }

  if (walletWait.waiting) {
    return <RegistrationCheckSpinner label="Checking wallet…" />;
  }

  if (
    status === "connected" &&
    address &&
    !isWrongNetwork &&
    checking
  ) {
    return <RegistrationCheckSpinner label="Checking registration…" />;
  }

  const showRegistrationError =
    status === "connected" &&
    address &&
    !isWrongNetwork &&
    failed;

  return (
    <>
      {showRegistrationError && (
        <RegistrationCheckError
          message="Could not verify registration in time. Check BSC Testnet RPC or retry."
          onRetry={() => user.refetch()}
        />
      )}
      {children}
    </>
  );
}
