import { useQuery } from "@tanstack/react-query";
import {
  fetchReferralTree,
  fetchDirectReferrals,
  fetchTeamSize,
  fetchSponsorChain,
} from "@/lib/api/club";
import { queryKeys, STALE_TIME, RETRY } from "@/lib/api/query-keys";

export function useReferralTree(depth = 5) {
  return useQuery({
    queryKey: queryKeys.referral.tree(depth),
    queryFn: () => fetchReferralTree(depth),
    staleTime: STALE_TIME.medium,
    retry: RETRY,
  });
}

export function useDirectReferrals(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.referral.direct(page),
    queryFn: () => fetchDirectReferrals(page, limit),
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}

export function useTeamSize() {
  return useQuery({
    queryKey: queryKeys.referral.teamSize,
    queryFn: fetchTeamSize,
    staleTime: STALE_TIME.short,
    retry: RETRY,
  });
}

export function useSponsorChain() {
  return useQuery({
    queryKey: queryKeys.referral.sponsorChain,
    queryFn: fetchSponsorChain,
    staleTime: STALE_TIME.long,
    retry: RETRY,
  });
}
