import { basePath } from "@/lib/paths";

export const SITE_PREVIEW_KEY = "lae_site_preview";
export const LAUNCH_AT = new Date("2026-06-22T00:00:00").getTime();

/** Routes that must never redirect to /coming-soon. */
const ALWAYS_OPEN_PREFIXES = [
  "/login",
  "/dashboard",
  "/coming-soon",
  "/p2p",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/whitepaper",
  "/home",
] as const;

/** Strip deployment base path from a pathname (e.g. `/lae/home` → `/home`). */
export function stripBasePath(pathname: string): string {
  if (basePath && pathname.startsWith(basePath)) {
    const rest = pathname.slice(basePath.length);
    return rest || "/";
  }
  return pathname;
}

export function normalizePath(pathname: string | null | undefined): string {
  if (!pathname) return "/";
  return stripBasePath(pathname).replace(/\/$/, "") || "/";
}

export function isAlwaysOpenRoute(pathname: string | null | undefined): boolean {
  const path = normalizePath(pathname);
  return ALWAYS_OPEN_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

/** @deprecated Prefer shouldRedirectToComingSoon — kept for callers that check "public". */
export function isPublicRoute(pathname: string | null | undefined): boolean {
  const path = normalizePath(pathname);
  if (isAlwaysOpenRoute(path)) return true;
  return path === "/";
}

export function isLaunchLive(): boolean {
  if (typeof window === "undefined") return false;
  return Date.now() >= LAUNCH_AT;
}

export function hasSitePreview(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SITE_PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

export function canAccessFullSite(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.NEXT_PUBLIC_SITE_LIVE === "true") return true;
  return isLaunchLive() || hasSitePreview();
}

/**
 * Pre-launch gate: only the marketing landing paths redirect to /coming-soon.
 * App routes (/login, /dashboard, …) always load directly.
 */
export function shouldRedirectToComingSoon(pathname: string | null | undefined): boolean {
  if (canAccessFullSite()) return false;
  if (isAlwaysOpenRoute(pathname)) return false;

  const path = normalizePath(pathname);
  return path === "/" || path === "/home";
}

export function enableSitePreview(): void {
  try {
    localStorage.setItem(SITE_PREVIEW_KEY, "1");
  } catch {
    /* private browsing */
  }
}
