import { basePath } from "@/lib/paths";

/** Strip deployment base path for route matching. */
export function normalizeAppPath(pathname: string): string {
  if (basePath && pathname.startsWith(basePath)) {
    const stripped = pathname.slice(basePath.length);
    return stripped || "/";
  }
  return pathname || "/";
}

const PUBLIC_PREFIXES = ["/", "/login", "/register", "/coin", "/p2p"] as const;

/** Routes that do not require wallet connection. */
export function isPublicAppPath(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  if (path === "/") return true;
  return PUBLIC_PREFIXES.some((p) => p !== "/" && (path === p || path.startsWith(`${p}/`)));
}

/** Dashboard and admin — disconnect should redirect to login. */
export function isProtectedAppPath(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  return path.startsWith("/dashboard") || path.startsWith("/admin");
}

export function isLoginPath(pathname: string): boolean {
  return normalizeAppPath(pathname) === "/login";
}
