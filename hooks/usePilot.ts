import { useQuery } from "@tanstack/react-query";
import { fetchPilotMatrices, fetchPilotPackages } from "@/lib/api/pilot";
import { queryKeys, STALE_TIME, RETRY } from "@/lib/api/query-keys";

export function usePilotMatrices() {
  return useQuery({
    queryKey: queryKeys.pilot.matrices,
    queryFn: fetchPilotMatrices,
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}

export function usePilotPackages() {
  return useQuery({
    queryKey: queryKeys.pilot.packages,
    queryFn: fetchPilotPackages,
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}
