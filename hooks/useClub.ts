import { useQuery } from "@tanstack/react-query";
import {
  fetchClubMatrices,
  fetchClubPackages,
  fetchClubMatrix,
} from "@/lib/api/club";
import { queryKeys, STALE_TIME, RETRY } from "@/lib/api/query-keys";

export function useClubMatrices() {
  return useQuery({
    queryKey: queryKeys.club.matrices,
    queryFn: fetchClubMatrices,
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}

export function useClubPackages() {
  return useQuery({
    queryKey: queryKeys.club.packages,
    queryFn: fetchClubPackages,
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}

export function useClubMatrix(id: string) {
  return useQuery({
    queryKey: queryKeys.club.matrix(id),
    queryFn: () => fetchClubMatrix(id),
    enabled: !!id,
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}
