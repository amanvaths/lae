"use client";

import { createContext, useContext, type ReactNode } from "react";

const DashboardViewContext = createContext<number | null>(null);

export function parseDashboardViewUserId(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
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
