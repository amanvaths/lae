"use client";

import { useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWatchContractEvent } from "wagmi";
import { contractKeys } from "../query-keys";
import { CONTRACTS } from "../addresses";
import { laeLimitlessAbi } from "../abis";
import {
  readLaeUser,
  readClubPackages,
  readPilotPackages,
  readActiveClubMatrices,
  readActivePilotMatrices,
  readReferrals,
  readWalletSnapshot,
  readUserEvents,
  readPackagePrices,
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      qc.invalidateQueries({ queryKey: contractKeys.all });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      if (address) {
        qc.invalidateQueries({ queryKey: contractKeys.user(address) });
        qc.invalidateQueries({ queryKey: contractKeys.wallet(address) });
        qc.invalidateQueries({ queryKey: contractKeys.club(address) });
        qc.invalidateQueries({ queryKey: contractKeys.pilot(address) });
        qc.invalidateQueries({ queryKey: contractKeys.referrals(address) });
        qc.invalidateQueries({ queryKey: contractKeys.events(address) });
      }
      qc.invalidateQueries({ queryKey: contractKeys.pending() });
    }, 2_000);
  }, [qc, address]);
}

/** Watch all LAE contract events and refresh queries */
export function useLaeEventWatcher(enabled = true) {
  const invalidate = useInvalidateOnChain();
  useWatchContractEvent({
    address: CONTRACTS.lae,
    abi: laeLimitlessAbi,
    enabled,
    onLogs: () => invalidate(),
  });
}

export function useProtocolStatus() {
  const client = usePublicClient();
  const { isConnected } = useAccount();
  return useQuery({
    queryKey: [...contractKeys.all, "protocol"],
    queryFn: () => readProtocolStatus(client!),
    enabled: !!client && isConnected,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useLaeOnChainUser() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: contractKeys.user(address),
    queryFn: () => readLaeUser(client!, address!),
    enabled: enabled && !!client,
    retry: 2,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
    staleTime: 30_000,
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
    staleTime: 30_000,
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
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

export function useUserEventsOnChain() {
  const client = usePublicClient();
  const { address, enabled } = useEnabledAddress();
  return useQuery({
    queryKey: contractKeys.events(address),
    queryFn: () => readUserEvents(client!, address!),
    enabled: enabled && !!client,
    retry: 1,
    staleTime: 60_000,
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
  const { isConnected } = useAccount();
  return useQuery({
    queryKey: contractKeys.pending(),
    queryFn: () => readPendingLength(client!),
    enabled: !!client && isConnected,
    staleTime: 10_000,
    refetchInterval: 15_000,
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
        address: CONTRACTS.lae,
        abi: laeLimitlessAbi,
        functionName: "rootSponsor",
      });
      return root.toLowerCase() === address!.toLowerCase();
    },
    enabled: enabled && !!client && !!address,
    staleTime: 60_000,
  });
}
