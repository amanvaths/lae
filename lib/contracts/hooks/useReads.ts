"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWatchContractEvent } from "wagmi";
import { contractKeys } from "../query-keys";
import { CONTRACTS } from "../addresses";
import { sensoLimitlessAbi } from "../abis";
import {
  readSensoUser,
  readClubPackages,
  readPilotPackages,
  readActiveClubMatrices,
  readActivePilotMatrices,
  readReferrals,
  readWalletSnapshot,
  readUserEvents,
  readPackagePrices,
  readSpinCoupons,
  readSpinHistory,
  readStakes,
  readPendingLength,
  readProtocolStatus,
} from "../services/reader";

function useEnabledAddress() {
  const { address, isConnected } = useAccount();
  return { address, enabled: isConnected && !!address };
}

export function useInvalidateOnChain() {
  const qc = useQueryClient();
  const { address } = useAccount();
  return () => {
    qc.invalidateQueries({ queryKey: contractKeys.all });
    if (address) {
      qc.invalidateQueries({ queryKey: contractKeys.user(address) });
      qc.invalidateQueries({ queryKey: contractKeys.wallet(address) });
      qc.invalidateQueries({ queryKey: contractKeys.club(address) });
      qc.invalidateQueries({ queryKey: contractKeys.pilot(address) });
      qc.invalidateQueries({ queryKey: contractKeys.referrals(address) });
      qc.invalidateQueries({ queryKey: contractKeys.events(address) });
      qc.invalidateQueries({ queryKey: contractKeys.spin(address) });
      qc.invalidateQueries({ queryKey: contractKeys.staking(address) });
    }
    qc.invalidateQueries({ queryKey: contractKeys.pending() });
  };
}

/** Watch all SensoLimitless events and refresh queries */
export function useSensoEventWatcher() {
  const invalidate = useInvalidateOnChain();
  useWatchContractEvent({
    address: CONTRACTS.senso,
    abi: sensoLimitlessAbi,
    onLogs: () => invalidate(),
  });
}

export function useProtocolStatus() {
  const client = usePublicClient();
  return useQuery({
    queryKey: [...contractKeys.all, "protocol"],
    queryFn: () => readProtocolStatus(client!),
    enabled: !!client,
    refetchInterval: 15_000,
  });
}

export function useSensoUser() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: contractKeys.user(address),
    queryFn: () => readSensoUser(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
  });
}

export function useClubPackagesOnChain() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: [...contractKeys.club(address), "packages"],
    queryFn: () => readClubPackages(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
  });
}

export function usePilotPackagesOnChain() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: [...contractKeys.pilot(address), "packages"],
    queryFn: () => readPilotPackages(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
  });
}

export function useClubMatricesOnChain() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: [...contractKeys.club(address), "matrices"],
    queryFn: () => readActiveClubMatrices(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
  });
}

export function usePilotMatricesOnChain() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: [...contractKeys.pilot(address), "matrices"],
    queryFn: () => readActivePilotMatrices(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
  });
}

export function useReferralsOnChain() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: contractKeys.referrals(address),
    queryFn: () => readReferrals(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
  });
}

export function useWalletOnChain() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: contractKeys.wallet(address),
    queryFn: () => readWalletSnapshot(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
    refetchInterval: 20_000,
  });
}

export function useUserEventsOnChain() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: contractKeys.events(address),
    queryFn: () => readUserEvents(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
  });
}

export function usePackagePricesOnChain() {
  const client = usePublicClient();
  return useQuery({
    queryKey: contractKeys.prices(),
    queryFn: () => readPackagePrices(client!),
    enabled: !!client,
    staleTime: 60_000,
    retry: 2,
  });
}

export function usePendingQueue() {
  const client = usePublicClient();
  return useQuery({
    queryKey: contractKeys.pending(),
    queryFn: () => readPendingLength(client!),
    enabled: !!client,
    refetchInterval: 5_000,
    retry: 2,
  });
}

export function useSpinOnChain() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  const coupons = useQuery({
    queryKey: [...contractKeys.spin(address), "coupons"],
    queryFn: () => readSpinCoupons(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
  });
  const history = useQuery({
    queryKey: [...contractKeys.spin(address), "history"],
    queryFn: () => readSpinHistory(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
  });
  return { coupons, history };
}

export function useStakingOnChain() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: contractKeys.staking(address),
    queryFn: () => readStakes(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
  });
}

export function useIsRootAdmin() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: [...contractKeys.all, "root-admin", address],
    queryFn: async () => {
      const root = await client!.readContract({
        address: CONTRACTS.senso,
        abi: sensoLimitlessAbi,
        functionName: "rootSponsor",
      });
      return root.toLowerCase() === address!.toLowerCase();
    },
    enabled: enabled && !!client && !!address,
    staleTime: 60_000,
  });
}
