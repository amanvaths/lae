/** Base path when hosted on GitHub Pages (e.g. `/lae`). Empty for local dev. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a public asset or in-app path with the deployment base path. */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  if (!basePath) return path;
  if (path.startsWith(basePath)) return path;
  return `${basePath}${path}`;
}
