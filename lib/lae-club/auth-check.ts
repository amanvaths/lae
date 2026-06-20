"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useLaeUser } from "@/lib/lae-club/hooks";

/** Max wait for on-chain registration check before showing UI / error. */
export const REGISTRATION_CHECK_TIMEOUT_MS = 4_000;

/** Max wait for wallet reconnect before showing connect UI. */
export const WALLET_SESSION_TIMEOUT_MS = 3_000;

export type LaeUserState = ReturnType<typeof useLaeUser>;

/** True while LAE Club matrix registration status is loading (respects timeout). */
export function isCheckingLaeRegistration(user: LaeUserState, timedOut = false) {
  return user.isLoading && !timedOut;
}

/** Registration check failed or exceeded timeout. */
export function laeRegistrationFailed(user: LaeUserState, timedOut = false) {
  return user.isError || timedOut;
}

/** Shared timeout for auth gates — resets when wallet address changes. */
export function useRegistrationCheckTimeout(user: LaeUserState) {
  const { address } = useAccount();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setTimedOut(false);
  }, [address]);

  useEffect(() => {
    if (!user.isLoading) {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), REGISTRATION_CHECK_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [user.isLoading, address]);

  return {
    timedOut,
    checking: isCheckingLaeRegistration(user, timedOut),
    failed: laeRegistrationFailed(user, timedOut),
  };
}

/** Timeout while wagmi is connecting / reconnecting. */
export function useWalletConnectTimeout(
  status: "connected" | "connecting" | "disconnected" | "reconnecting"
) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (status !== "connecting" && status !== "reconnecting") {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), WALLET_SESSION_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [status]);

  const waiting = status === "connecting" || status === "reconnecting";
  return { timedOut, waiting: waiting && !timedOut };
}
