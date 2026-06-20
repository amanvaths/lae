"use client";

import { useLaeUser } from "@/lib/lae-club/hooks";

/** True while LAE Club matrix registration status is loading. */
export function isCheckingLaeRegistration(user: ReturnType<typeof useLaeUser>) {
  return user.isLoading;
}

export function laeRegistrationFailed(_user: ReturnType<typeof useLaeUser>) {
  return false;
}
