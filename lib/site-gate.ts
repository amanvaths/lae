import { basePath } from "@/lib/paths";

export const SITE_PREVIEW_KEY = "lae_site_preview";
export const LAUNCH_AT = new Date("2026-06-22T00:00:00").getTime();

const PUBLIC_ROUTES = new Set([
  "/",
  "/home",
  "/login",
  "/coming-soon",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/p2p",
]);

/** Strip deployment base path from a pathname (e.g. `/lae/home` → `/home`). */
export function stripBasePath(pathname: string): string {
  if (basePath && pathname.startsWith(basePath)) {
    const rest = pathname.slice(basePath.length);
    return rest || "/";
  }
  return pathname;
}

export function isPublicRoute(pathname: string): boolean {
  const path = stripBasePath(pathname).replace(/\/$/, "") || "/";
  if (path.startsWith("/dashboard")) return true;
  return PUBLIC_ROUTES.has(path);
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
  return isLaunchLive() || hasSitePreview();
}

export function enableSitePreview(): void {
  try {
    localStorage.setItem(SITE_PREVIEW_KEY, "1");
  } catch {
    /* private browsing */
  }
}
