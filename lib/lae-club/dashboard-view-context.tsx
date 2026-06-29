"use client";

import { createContext, useContext, type ReactNode } from "react";
import { withBasePath } from "@/lib/paths";

export const VIEW_USER_STORAGE_KEY = "lae-dashboard-view-user-id";

const DashboardViewContext = createContext<number | null>(null);

export function parseDashboardViewUserId(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

export function persistDashboardViewUserId(id: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(VIEW_USER_STORAGE_KEY, String(id));
}

export function clearDashboardViewUserId() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(VIEW_USER_STORAGE_KEY);
}

export function readDashboardViewUserId(): number | null {
  if (typeof window === "undefined") return null;
  return parseDashboardViewUserId(sessionStorage.getItem(VIEW_USER_STORAGE_KEY));
}

/** Append ?viewUserId= when browsing another user's dashboard read-only. */
export function withDashboardHref(path: string, viewUserId: number | null): string {
  const href = withBasePath(path);
  if (!viewUserId) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}viewUserId=${viewUserId}`;
}

export function DashboardViewProvider({
  viewUserId,
  children,
}: {
  viewUserId: number | null;
  children: ReactNode;
}) {
  return (
    <DashboardViewContext.Provider value={viewUserId}>{children}</DashboardViewContext.Provider>
  );
}

/** When set, dashboard shows this user's data (read-only) instead of the connected wallet. */
export function useDashboardViewUserId(): number | null {
  return useContext(DashboardViewContext);
}

export function useIsDashboardViewMode(): boolean {
  return useDashboardViewUserId() != null;
}
