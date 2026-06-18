import { basePath } from "@/lib/paths";

export const SITE_PREVIEW_KEY = "lae_site_preview";
export const LAUNCH_AT = new Date("2026-06-22T00:00:00").getTime();

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

/** Gate disabled — every route is accessible by URL. */
export function shouldRedirectToComingSoon(_pathname?: string | null): boolean {
  return false;
}

/** @deprecated Gate removed — all routes are open. */
export function isPublicRoute(_pathname?: string | null): boolean {
  return true;
}

export function enableSitePreview(): void {
  try {
    localStorage.setItem(SITE_PREVIEW_KEY, "1");
  } catch {
    /* private browsing */
  }
}
