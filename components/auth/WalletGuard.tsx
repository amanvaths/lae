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
import { WrongNetworkPanel } from "@/components/web3/WrongNetworkPanel";

/** Dashboard access: connected wallet, correct network, on-chain registration. */
export function WalletGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useClientMounted();
  const redirecting = useRef(false);
  const { isReady, isWrongNetwork } = useWalletSession();
  const { status, address } = useAccount();
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
    timedOut,
    router,
  ]);

  if (!mounted) {
    return <RegistrationCheckSpinner label="Loading…" />;
  }

  if (!isReady || walletWait.waiting) {
    return <RegistrationCheckSpinner label="Connecting wallet…" />;
  }

  if (status !== "connected" || !address) {
    return <RegistrationCheckSpinner label="Redirecting to login…" />;
  }

  if (isWrongNetwork) {
    return <WrongNetworkPanel />;
  }

  if (failed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
        <RegistrationCheckError
          message="Could not verify registration on-chain. Check BSC Testnet RPC and retry."
          onRetry={() => user.refetch()}
        />
      </div>
    );
  }

  if (checking) {
    return <RegistrationCheckSpinner label="Verifying registration…" />;
  }

  if (!user.registered) {
    return <RegistrationCheckSpinner label="Redirecting to registration…" />;
  }

  return <>{children}</>;
}
