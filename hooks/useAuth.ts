import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe } from "@/lib/api/auth";
import { queryKeys, STALE_TIME, RETRY } from "@/lib/api/query-keys";

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchMe,
    enabled,
    staleTime: STALE_TIME.medium,
    retry: RETRY,
  });
}

export function useInvalidateAuth() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.auth.me });
}
