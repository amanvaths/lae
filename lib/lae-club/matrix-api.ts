"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type ApiSlotState = "locked" | "waiting" | "open" | "filled";

export interface ApiMatrixSlot {
  position: number;
  state: ApiSlotState;
  userId: number | null;
  address: string | null;
}

export interface ApiMatrixTree {
  userId: number;
  address: string;
  level: number;
  cycle: number;
  active: boolean;
  filledSpots: number;
  boardFilled?: number;
  overflowCount?: number;
  completed: boolean;
  slot2Opened: boolean;
  totalEarned: string;
  totalCycles: number;
  slots: ApiMatrixSlot[];
  overflowMembers?: ApiOverflowMember[];
}

export interface ApiOverflowMember {
  userId: number;
  address: string | null;
  depth: number;
}

export interface ApiMatrixOverviewCycle {
  cycle: number;
  filled: number;
  completed: boolean;
  slot2Opened: boolean;
}

export interface ApiMatrixOverviewLevel {
  level: number;
  active: boolean;
  currentCycle: number;
  cycles: ApiMatrixOverviewCycle[];
}

export interface ApiMatrixOverview {
  userId: number;
  address: string;
  levels: ApiMatrixOverviewLevel[];
}

export function fetchMatrixTree(userId: number, level: number, cycle: number) {
  return api.get<ApiMatrixTree>(`/api/matrix/tree/${userId}/${level}/${cycle}`, false);
}

export function fetchMatrixOverview(userId: number, level?: number) {
  const q = level != null ? `?level=${level}` : "";
  return api.get<ApiMatrixOverview>(`/api/matrix/overview/${userId}${q}`, false);
}

/** LAEClubMatrix tree — API (usersXMatrixReferrals via backend). */
export function useLaeMatrixTreeApi(
  userId: number | undefined,
  level: number,
  cycle: number,
  options?: { enabled?: boolean }
) {
  const enabled =
    (options?.enabled ?? true) && !!userId && userId > 0 && level >= 1 && cycle >= 1;

  const query = useQuery({
    queryKey: ["lae-matrix-tree", userId, level, cycle],
    queryFn: () => fetchMatrixTree(userId!, level, cycle),
    enabled,
    // Live matrix must reflect every new registration immediately. The backend
    // reads usersXMatrixReferrals straight from chain, so poll it instead of
    // serving a stale cache (this was the "position appears one registration
    // late" bug — storage/event/API were correct, only the UI cache lagged).
    staleTime: 0,
    refetchInterval: 6_000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    retry: 1,
  });

  return {
    tree: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** @deprecated alias */
export const useMatrixCoreTreeApi = useLaeMatrixTreeApi;

export function useLaeMatrixOverviewApi(userId: number | undefined, level?: number) {
  const enabled = !!userId && userId > 0;
  const query = useQuery({
    queryKey: ["lae-matrix-overview", userId, level],
    queryFn: () => fetchMatrixOverview(userId!, level),
    enabled,
    staleTime: 0,
    refetchInterval: 8_000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    retry: 1,
  });
  return {
    overview: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
  };
}

/** @deprecated alias */
export const useMatrixCoreOverviewApi = useLaeMatrixOverviewApi;

/** User placements across levels (from API). */
export function useLaeMatrixPlacement(userId: number | undefined) {
  const enabled = !!userId && userId > 0;
  return useQuery({
    queryKey: ["lae-matrix-placement", userId],
    queryFn: () =>
      api.get<
        {
          matrixOwnerId: number;
          level: number;
          cycleId: number;
          position: number;
          occupantId: number;
        }[]
      >(`/api/matrix/placement/${userId}`, false),
    enabled,
    staleTime: 30_000,
  });
}

/** @deprecated alias */
export const useMatrixCorePlacement = useLaeMatrixPlacement;
