"use client";

import { useQuery } from "@tanstack/react-query";
import { LAE_LEVELS } from "./constants";
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
  totalEarning: string;
  totalTeamSize: number;
  slots: ApiMatrixSlot[];
}

export interface ApiMatrixOverviewLevel {
  level: number;
  active: boolean;
  filled: number;
  cycle: number;
}

export interface ApiMatrixOverview {
  userId: number;
  address: string;
  levels: ApiMatrixOverviewLevel[];
}

export function fetchMatrixTree(userId: number, level: number) {
  return api.get<ApiMatrixTree>(`/api/matrix/tree/${userId}/${level}`, false);
}

export function fetchMatrixOverview(userId: number) {
  return api.get<ApiMatrixOverview>(`/api/matrix/overview/${userId}`, false);
}

/** Authoritative matrix tree for (userId, level) served from the backend DB/contract. */
export function useLaeMatrixTreeApi(
  userId: number | undefined,
  level: number,
  options?: { enabled?: boolean }
) {
  const enabled =
    (options?.enabled ?? true) &&
    !!userId &&
    userId > 0 &&
    level >= 1 &&
    level <= LAE_LEVELS;

  const query = useQuery({
    queryKey: ["lae-matrix-tree", userId, level],
    queryFn: () => fetchMatrixTree(userId!, level),
    enabled,
    staleTime: 15_000,
    retry: 1,
  });

  return {
    tree: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Per-level active flag + fill counts for the matrix grid. */
export function useLaeMatrixOverviewApi(userId: number | undefined) {
  const enabled = !!userId && userId > 0;
  const query = useQuery({
    queryKey: ["lae-matrix-overview", userId],
    queryFn: () => fetchMatrixOverview(userId!),
    enabled,
    staleTime: 20_000,
    retry: 1,
  });

  return {
    overview: query.data,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
  };
}
