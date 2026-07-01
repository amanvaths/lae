"use client";

/**
 * Pre-launch gate removed — all routes load directly on laeclub.org.
 * Kept as a pass-through so imports stay stable if re-enabled later.
 */
export function GlobalSiteGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
