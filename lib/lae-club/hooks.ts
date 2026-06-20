"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, type Address } from "viem";
import { LAE_CONTRACTS } from "./contracts";
import {
  erc20BalanceAbi,
  laeClubMatrixAbi,
  laeCoinAbi,
  laeStakingAbi,
} from "./abis";
import { LAE_LEVELS } from "./constants";
import { withBasePath } from "@/lib/paths";
import { fetchMatrixUserEvents, type MatrixUserEvent } from "./matrix-events";
import { LAE_USER_QUERY_KEY } from "./query-keys";

export type LaeUserDetails = readonly [
  Address,
  Address,
  bigint,
  bigint,
  number,
  bigint,
  bigint,
  bigint,
];

type LaeUserSnapshot = {
  registered: boolean;
  userId: bigint | undefined;
  details: LaeUserDetails | undefined;
};

function mapLaeUserSnapshot({ registered, userId, details }: LaeUserSnapshot) {
  const d = details;
  return {
    registered,
    userId,
    details: d,
    userAddress: d?.[0],
    sponsorAddress: d?.[1],
    sponsorId: d?.[2],
    directCount: d?.[3],
    activeLevels: d?.[4] ?? 0,
    teamSize: d?.[5] ?? 0n,
    registeredAt: d?.[6],
    totalIncome: d?.[7] ?? 0n,
  };
}

/** Single cached identity read shared across all auth gates and dashboard pages. */
export function useLaeUser() {
  const { address } = useAccount();
  const client = usePublicClient();

  const q = useQuery({
    queryKey: [LAE_USER_QUERY_KEY, address, LAE_CONTRACTS.matrix],
    enabled: !!address && !!client,
    staleTime: 30_000,
    gcTime: 300_000,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<LaeUserSnapshot> => {
      if (!address || !client) {
        return { registered: false, userId: undefined, details: undefined };
      }

      const identity = await client.multicall({
        contracts: [
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "isUserExists",
            args: [address],
          },
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "addressToId",
            args: [address],
          },
        ],
      });

      const exists = identity[0]?.result as boolean | undefined;
      const userId = identity[1]?.result as bigint | undefined;
      const hasUserId = userId !== undefined && userId > 0n;
      const registered = exists === true && hasUserId;

      if (!registered || !hasUserId) {
        return { registered: false, userId, details: undefined };
      }

      const details = (await client.readContract({
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        functionName: "getUserDetails",
        args: [userId],
      })) as LaeUserDetails;

      return { registered: true, userId, details };
    },
  });

  const empty = mapLaeUserSnapshot({
    registered: false,
    userId: undefined,
    details: undefined,
  });

  if (!address) {
    return {
      ...empty,
      isLoading: false,
      isError: false,
      refetch: () => {},
    };
  }

  const snapshot = q.data
    ? mapLaeUserSnapshot(q.data)
    : empty;

  return {
    ...snapshot,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => {
      void q.refetch();
    },
  };
}

export function useLaeLevelPrices() {
  const contracts = Array.from({ length: LAE_LEVELS }, (_, i) => ({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "levelTokenCost" as const,
    args: [i + 1] as [number],
  }));
  const q = useReadContracts({ contracts, query: { staleTime: 60_000 } });
  return {
    prices: q.data?.map((r, i) => ({
      level: i + 1,
      price: r.result as bigint | undefined,
      priceFormatted: r.result ? formatEther(r.result as bigint) : "—",
    })),
    isLoading: q.isLoading,
    isError: q.isError,
  };
}

export function useLaeMatrixLevel(level: number) {
  const { address } = useAccount();
  const user = useLaeUser();
  const enabled =
    !!address &&
    user.registered &&
    !!user.userId &&
    user.userId > 0n &&
    level >= 1 &&
    level <= LAE_LEVELS;

  const reads = useReadContracts({
    contracts: enabled
      ? [
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "usersXMatrix" as const,
            args: [address, level] as [Address, number],
          },
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "usersXMatrixReferrals" as const,
            args: [address, level] as [Address, number],
          },
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "isUserSlotActive" as const,
            args: [user.userId!, level] as [bigint, number],
          },
        ]
      : [],
    query: { enabled, staleTime: 15_000, retry: 1 },
  });

  const m = reads.data?.[0]?.result as readonly [Address, bigint, bigint, bigint, bigint, bigint] | undefined;
  const refs = (reads.data?.[1]?.result as Address[] | undefined) ?? [];
  const slotActive = reads.data?.[2]?.result === true;

  return {
    active: slotActive,
    currentReferrer: m?.[0] as Address | undefined,
    reinvestCount: m?.[1] ?? 0n,
    heldForUpgrade: m?.[2] ?? 0n,
    totalTeamSize: m?.[4] ?? 0n,
    totalEarning: m?.[5] ?? 0n,
    referrals: refs,
    filledSpots: refs.length,
    isLoading: enabled && reads.isLoading,
    isError: reads.isError,
  };
}

export function useLaeAllMatrixLevels() {
  const { address } = useAccount();
  const user = useLaeUser();
  const contracts = Array.from({ length: LAE_LEVELS }, (_, i) => ({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "isUserSlotActive" as const,
    args: user.userId ? [user.userId, i + 1] : ([0n, i + 1] as [bigint, number]),
  }));

  const activeSlots = useReadContracts({
    contracts,
    query: { enabled: !!user.userId && user.userId > 0n, staleTime: 30_000, retry: 1 },
  });

  return {
    levels: Array.from({ length: LAE_LEVELS }, (_, i) => ({
      level: i + 1,
      active: activeSlots.data?.[i]?.result === true,
    })),
    activeCount: activeSlots.data?.filter((r) => r.result === true).length ?? 0,
    isLoading: activeSlots.isLoading,
  };
}

export function useLaeDirectTeam() {
  const user = useLaeUser();
  const enabled = !!user.userId && user.userId > 0n;

  const reads = useReadContracts({
    contracts: enabled
      ? [
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "getDirectPartnerAddresses" as const,
            args: [user.userId!] as [bigint],
          },
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "getDirectPartnerIds" as const,
            args: [user.userId!] as [bigint],
          },
        ]
      : [],
    query: { enabled, staleTime: 15_000, retry: 1 },
  });

  return {
    addresses: (reads.data?.[0]?.result as Address[] | undefined) ?? [],
    ids: (reads.data?.[1]?.result as bigint[] | undefined) ?? [],
    isLoading: user.isLoading || (enabled && reads.isLoading),
  };
}

export function useLaeProtocolStats() {
  const reads = useReadContracts({
    contracts: [
      { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "lastUserId" },
      { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "totalProjectInvestment" },
      { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "PAYMENT_TOKEN" },
    ],
    query: { staleTime: 30_000 },
  });
  const [lastId, investment, paymentToken] = reads.data ?? [];
  return {
    lastUserId: lastId?.result as bigint | undefined,
    totalUsers: lastId?.result ? Number(lastId.result as bigint) - 1 : 0,
    totalInvestment: investment?.result as bigint | undefined,
    paymentToken: paymentToken?.result as Address | undefined,
    isLoading: reads.isLoading,
  };
}

export function useLaeCoinStats() {
  const reads = useReadContracts({
    contracts: [
      { address: LAE_CONTRACTS.laeCoin, abi: laeCoinAbi, functionName: "totalSupply" },
      { address: LAE_CONTRACTS.laeCoin, abi: laeCoinAbi, functionName: "totalBurned" },
      { address: LAE_CONTRACTS.laeCoin, abi: laeCoinAbi, functionName: "maxSupply" },
      { address: LAE_CONTRACTS.laeCoin, abi: laeCoinAbi, functionName: "circulatingSupply" },
      { address: LAE_CONTRACTS.laeCoin, abi: laeCoinAbi, functionName: "treasuryWallet" },
      { address: LAE_CONTRACTS.laeCoin, abi: laeCoinAbi, functionName: "matrixContract" },
      { address: LAE_CONTRACTS.laeCoin, abi: laeCoinAbi, functionName: "liquidityWallet" },
    ],
    query: { staleTime: 30_000 },
  });
  const [supply, burned, max, circulating, treasury, matrix, liquidity] = reads.data ?? [];
  return {
    totalSupply: supply?.result as bigint | undefined,
    totalBurned: burned?.result as bigint | undefined,
    maxSupply: max?.result as bigint | undefined,
    circulating: circulating?.result as bigint | undefined,
    treasuryWallet: treasury?.result as Address | undefined,
    matrixContract: matrix?.result as Address | undefined,
    liquidityWallet: liquidity?.result as Address | undefined,
    isLoading: reads.isLoading,
  };
}

export function useLaeStaking() {
  const { address } = useAccount();
  const stake = useReadContract({
    address: LAE_CONTRACTS.staking,
    abi: laeStakingAbi,
    functionName: "stakes",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 15_000 },
  });
  const pending = useReadContract({
    address: LAE_CONTRACTS.staking,
    abi: laeStakingAbi,
    functionName: "pendingReward",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 15_000 },
  });
  const totalStaked = useReadContract({
    address: LAE_CONTRACTS.staking,
    abi: laeStakingAbi,
    functionName: "totalStaked",
    query: { staleTime: 30_000 },
  });
  const rate = useReadContract({
    address: LAE_CONTRACTS.staking,
    abi: laeStakingAbi,
    functionName: "rewardRateBps",
    query: { staleTime: 60_000 },
  });
  const s = stake.data;
  return {
    stakedAmount: s?.[0] ?? 0n,
    stakedAt: s?.[1] ?? 0n,
    lastClaim: s?.[2] ?? 0n,
    active: s?.[3] ?? false,
    pendingReward: pending.data ?? 0n,
    totalStakedGlobal: totalStaked.data ?? 0n,
    aprBps: rate.data ?? 0n,
    isLoading: stake.isLoading || pending.isLoading,
  };
}

export function useLaeRoyalPoolBalance(poolAddress?: Address) {
  const onChainPool = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "CLUB_POOL_ADDRESS",
    query: { staleTime: 60_000 },
  });
  const addr =
    poolAddress ??
    (onChainPool.data as Address | undefined) ??
    LAE_CONTRACTS.clubPool;
  const paymentToken = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "PAYMENT_TOKEN",
    query: { staleTime: 60_000 },
  });
  const token = (paymentToken.data as Address | undefined) ?? LAE_CONTRACTS.payment;
  const balance = useReadContract({
    address: token,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: addr && addr !== "0x0000000000000000000000000000000000000000" ? [addr] : undefined,
    query: {
      enabled: !!addr && addr !== "0x0000000000000000000000000000000000000000",
      staleTime: 15_000,
    },
  });
  return {
    poolAddress: addr,
    paymentToken: token,
    balance: balance.data ?? 0n,
    isLoading: paymentToken.isLoading || balance.isLoading || onChainPool.isLoading,
  };
}

/** Live matrix events from chain logs for connected user */
export function useLaeUserEvents() {
  const client = usePublicClient();
  const user = useLaeUser();

  return useQuery<MatrixUserEvent[]>({
    queryKey: ["lae-events", user.userId?.toString(), user.userAddress, LAE_CONTRACTS.matrix],
    enabled: !!client && !!user.userId && user.userId > 0n && !!user.userAddress,
    staleTime: 120_000,
    retry: 0,
    refetchOnWindowFocus: false,
    throwOnError: false,
    queryFn: async () => {
      if (!client || !user.userId || !user.userAddress) return [];
      const { events } = await fetchMatrixUserEvents(client, user.userId, user.userAddress);
      return events;
    },
  });
}

export function useLaeIncomeEvents() {
  const events = useLaeUserEvents();
  const income = (events.data ?? []).filter((e) => e.eventName === "TokenReceived");
  const royal = (events.data ?? []).filter((e) => e.eventName === "ClubPoolPayment");
  const totalMatrix = income.reduce((s, e) => s + ((e.args.amount as bigint) ?? 0n), 0n);
  const totalRoyal = royal.reduce((s, e) => s + ((e.args.amount as bigint) ?? 0n), 0n);
  return {
    incomeEvents: income,
    royalEvents: royal,
    allEvents: events.data ?? [],
    spillEvents: (events.data ?? []).filter((e) => e.eventName === "Spillover"),
    placementEvents: (events.data ?? []).filter((e) => e.eventName === "NewUserPlace"),
    reinvestEvents: (events.data ?? []).filter((e) => e.eventName === "Reinvest"),
    upgradeEvents: (events.data ?? []).filter((e) => e.eventName === "Upgrade"),
    totalMatrixIncome: totalMatrix,
    totalRoyalIncome: totalRoyal,
    isLoading: events.isLoading,
    isError: false,
    fetchFailed: events.isError,
    refetch: events.refetch,
  };
}

export function useLaeRecycleCount() {
  const events = useLaeUserEvents();
  return {
    count: (events.data ?? []).filter((e) => e.eventName === "Reinvest").length,
    isLoading: events.isLoading,
  };
}

export function useLaeNftStatus() {
  const user = useLaeUser();
  const activeLevels = user.activeLevels ?? 0;
  return {
    registrationPass: user.registered,
    royalRank1: activeLevels >= 3,
    royalRank2: activeLevels >= 6,
    royalRank3: activeLevels >= 9,
    royalRank4: activeLevels >= 12,
    activeLevels,
    isLoading: user.isLoading,
  };
}

export function referralLinkByUserId(userId: bigint | number | undefined) {
  if (typeof window === "undefined" || userId === undefined || userId === 0n || userId === 0) {
    return "";
  }
  return `${window.location.origin}${withBasePath("/register")}?ref=${String(userId)}`;
}

const MONTH_SECONDS = 30n * 24n * 60n * 60n;

export function useLaeRewardSummary() {
  const { address } = useAccount();

  const reads = useReadContracts({
    contracts: address
      ? [
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "getLaeRewardSummary" as const,
            args: [address] as [Address],
          },
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "getDirectPartnerCount" as const,
            args: [address] as [Address],
          },
        ]
      : [],
    query: { enabled: !!address, staleTime: 15_000, retry: 1 },
  });

  const s = reads.data?.[0]?.result as readonly [bigint, bigint, bigint, bigint, bigint] | undefined;
  const allocated = s?.[0] ?? 0n;
  const released = s?.[1] ?? 0n;
  const claimable = s?.[2] ?? 0n;
  const claimed = s?.[3] ?? 0n;
  const locked = s?.[4] ?? 0n;
  const directCount = (reads.data?.[1]?.result as bigint | undefined) ?? 0n;

  return {
    allocated,
    released,
    claimable,
    claimed,
    locked,
    directCount,
    nextRelease: released > claimed + claimable ? released - claimed - claimable : 0n,
    isLoading: !!address && reads.isLoading,
    refetch: () => {
      void reads.refetch();
    },
  };
}

/** Current vesting month (1–20) from registration timestamp */
export function useLaeVestingDirectRequirement(registrationTimestamp?: bigint) {
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const monthIdx =
    registrationTimestamp && registrationTimestamp > 0n
      ? Number(
          (nowSec - registrationTimestamp) / MONTH_SECONDS > 19n
            ? 19n
            : (nowSec - registrationTimestamp) / MONTH_SECONDS
        )
      : 0;

  const req = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "directRequirementByMonth",
    args: [BigInt(monthIdx)],
    query: { staleTime: 60_000 },
  });

  return {
    month: monthIdx + 1,
    requiredDirects: (req.data as bigint | undefined) ?? 0n,
    isLoading: req.isLoading,
  };
}

export function useClaimLaeRewards() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  async function claim() {
    return writeContractAsync({
      address: LAE_CONTRACTS.matrix,
      abi: laeClubMatrixAbi,
      functionName: "claimLaeRewards",
    });
  }

  return { claim, hash, isPending, isConfirming: receipt.isLoading, error, receipt };
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

export function parseLaeUserId(input: string | number | null | undefined): bigint | null {
  if (input === null || input === undefined || input === "") return null;
  try {
    const id = BigInt(String(input).trim());
    return id > 0n ? id : null;
  } catch {
    return null;
  }
}

/** Public read-only profile by numeric user ID — no wallet required. */
export function useLaeUserById(userIdInput: string | number | null | undefined) {
  const userId = parseLaeUserId(userIdInput);

  const reads = useReadContracts({
    contracts: userId
      ? [
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "idToAddress" as const,
            args: [userId] as [bigint],
          },
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "getUserDetails" as const,
            args: [userId] as [bigint],
          },
        ]
      : [],
    query: { enabled: !!userId, staleTime: 60_000, retry: 1 },
  });

  const walletAddress = reads.data?.[0]?.result as Address | undefined;
  const exists =
    !!walletAddress &&
    walletAddress.toLowerCase() !== ZERO_ADDRESS.toLowerCase();
  const d = reads.data?.[1]?.result as LaeUserDetails | undefined;
  const registered = exists && !!d?.[0];

  return {
    ...mapLaeUserSnapshot({
      registered,
      userId: userId ?? undefined,
      details: registered ? d : undefined,
    }),
    walletAddress: exists ? walletAddress : undefined,
    isLoading: !!userId && reads.isLoading,
    isError: reads.isError,
    notFound: !!userId && !reads.isLoading && !exists,
    refetch: () => void reads.refetch(),
  };
}

export function useLaeMatrixLevelForUser(
  userAddress: Address | undefined,
  userId: bigint | undefined,
  level: number
) {
  const enabled =
    !!userAddress &&
    !!userId &&
    userId > 0n &&
    level >= 1 &&
    level <= LAE_LEVELS;

  const reads = useReadContracts({
    contracts: enabled
      ? [
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "usersXMatrix" as const,
            args: [userAddress, level] as [Address, number],
          },
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "usersXMatrixReferrals" as const,
            args: [userAddress, level] as [Address, number],
          },
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "isUserSlotActive" as const,
            args: [userId, level] as [bigint, number],
          },
        ]
      : [],
    query: { enabled, staleTime: 15_000, retry: 1 },
  });

  const m = reads.data?.[0]?.result as readonly [Address, bigint, bigint, bigint, bigint, bigint] | undefined;
  const refs = (reads.data?.[1]?.result as Address[] | undefined) ?? [];

  return {
    active: reads.data?.[2]?.result === true,
    reinvestCount: m?.[1] ?? 0n,
    heldForUpgrade: m?.[2] ?? 0n,
    totalTeamSize: m?.[4] ?? 0n,
    totalEarning: m?.[5] ?? 0n,
    referrals: refs,
    filledSpots: refs.length,
    isLoading: enabled && reads.isLoading,
  };
}

export function useLaeAllMatrixLevelsForUser(userId: bigint | undefined) {
  const contracts = Array.from({ length: LAE_LEVELS }, (_, i) => ({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "isUserSlotActive" as const,
    args: userId ? [userId, i + 1] : ([0n, i + 1] as [bigint, number]),
  }));

  const activeSlots = useReadContracts({
    contracts,
    query: { enabled: !!userId && userId > 0n, staleTime: 30_000, retry: 1 },
  });

  return {
    levels: Array.from({ length: LAE_LEVELS }, (_, i) => ({
      level: i + 1,
      active: activeSlots.data?.[i]?.result === true,
    })),
    activeCount: activeSlots.data?.filter((r) => r.result === true).length ?? 0,
    isLoading: activeSlots.isLoading,
  };
}

export function useLaeDirectTeamForUser(userId: bigint | undefined) {
  const enabled = !!userId && userId > 0n;
  const reads = useReadContracts({
    contracts: enabled
      ? [
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "getDirectPartnerAddresses" as const,
            args: [userId] as [bigint],
          },
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "getDirectPartnerIds" as const,
            args: [userId] as [bigint],
          },
        ]
      : [],
    query: { enabled, staleTime: 15_000, retry: 1 },
  });

  return {
    addresses: (reads.data?.[0]?.result as Address[] | undefined) ?? [],
    ids: (reads.data?.[1]?.result as bigint[] | undefined) ?? [],
    isLoading: enabled && reads.isLoading,
  };
}

export function useLaeRewardSummaryForAddress(userAddress: Address | undefined) {
  const reads = useReadContracts({
    contracts: userAddress
      ? [
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "getLaeRewardSummary" as const,
            args: [userAddress] as [Address],
          },
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "getDirectPartnerCount" as const,
            args: [userAddress] as [Address],
          },
        ]
      : [],
    query: { enabled: !!userAddress, staleTime: 15_000, retry: 1 },
  });

  const s = reads.data?.[0]?.result as readonly [bigint, bigint, bigint, bigint, bigint] | undefined;
  const allocated = s?.[0] ?? 0n;
  const released = s?.[1] ?? 0n;
  const claimable = s?.[2] ?? 0n;
  const claimed = s?.[3] ?? 0n;
  const locked = s?.[4] ?? 0n;
  const directCount = (reads.data?.[1]?.result as bigint | undefined) ?? 0n;

  return {
    allocated,
    released,
    claimable,
    claimed,
    locked,
    directCount,
    nextRelease: released > claimed + claimable ? released - claimed - claimable : 0n,
    isLoading: !!userAddress && reads.isLoading,
  };
}

export function useLaeUserEventsForUser(
  userId: bigint | undefined,
  userAddress: Address | undefined
) {
  const client = usePublicClient();

  return useQuery<MatrixUserEvent[]>({
    queryKey: ["lae-events", userId?.toString(), userAddress, LAE_CONTRACTS.matrix, "public"],
    enabled: !!client && !!userId && userId > 0n && !!userAddress,
    staleTime: 120_000,
    retry: 0,
    refetchOnWindowFocus: false,
    throwOnError: false,
    queryFn: async () => {
      if (!client || !userId || !userAddress) return [];
      const { events } = await fetchMatrixUserEvents(client, userId, userAddress);
      return events;
    },
  });
}
