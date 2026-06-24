"use client";

import { useAccount, useReadContract } from "wagmi";
import { LAE_CONTRACTS } from "./contracts";
import { laeClubMatrixAbi } from "./matrix-core-abi";

/** LAEClubMatrix user identity — addressToId + getUserDetails. */
export function useMatrixCoreUser() {
  const { address } = useAccount();

  const idRead = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "addressToId",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const userId = idRead.data ? Number(idRead.data) : 0;
  const registered = userId > 0;

  const detailsRead = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getUserDetails",
    args: registered ? [BigInt(userId)] : undefined,
    query: { enabled: registered },
  });

  const d = detailsRead.data;
  return {
    address,
    registered,
    userId: registered ? BigInt(userId) : undefined,
    wallet: d?.[0],
    sponsorId: d ? d[2] : undefined,
    currentCycle: 1,
    directReferrals: d ? Number(d[3]) : 0,
    highestSlot: d ? Number(d[4]) : 1,
    totalEarned: d ? (d[7] as bigint) : 0n,
    totalCycles: 0,
    teamSize: d ? (d[5] as bigint) : 0n,
    isLoading: idRead.isLoading || (registered && detailsRead.isLoading),
    isError: idRead.isError || detailsRead.isError,
  };
}

/** Alias for LAEClubMatrix */
export const useLaeMatrixUser = useMatrixCoreUser;

export function useMatrixCoreEntryPrice() {
  return useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "levelTokenCost",
    args: [1],
  });
}
