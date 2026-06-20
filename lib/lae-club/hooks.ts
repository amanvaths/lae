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
import { LOG_LOOKBACK_BLOCKS } from "@/lib/contracts/config";
import { LAE_CONTRACTS } from "./contracts";
import {
  erc20BalanceAbi,
  laeClubMatrixAbi,
  laeCoinAbi,
  laeStakingAbi,
} from "./abis";
import { LAE_LEVELS } from "./constants";
import { withBasePath } from "@/lib/paths";
import { matrixEventMatchesUser } from "./event-filter";

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

export function useLaeUser() {
  const { address } = useAccount();

  const identity = useReadContracts({
    contracts: address
      ? [
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "isUserExists" as const,
            args: [address] as [Address],
          },
          {
            address: LAE_CONTRACTS.matrix,
            abi: laeClubMatrixAbi,
            functionName: "addressToId" as const,
            args: [address] as [Address],
          },
        ]
      : [],
    query: { enabled: !!address, staleTime: 30_000, retry: 1 },
  });

  const exists = identity.data?.[0]?.result as boolean | undefined;
  const userId = identity.data?.[1]?.result as bigint | undefined;
  const hasUserId = userId !== undefined && userId > 0n;

  const details = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getUserDetails",
    args: hasUserId ? [userId] : undefined,
    query: { enabled: hasUserId, staleTime: 30_000, retry: 1 },
  });

  const registered = exists === true && hasUserId;
  const d = details.data as LaeUserDetails | undefined;

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
    isLoading:
      !!address &&
      (identity.isLoading || (registered && details.isLoading)),
    isError: identity.isError || details.isError,
    refetch: () => {
      void identity.refetch();
      void details.refetch();
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

  const matrix = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "usersXMatrix",
    args: address && level >= 1 && level <= LAE_LEVELS ? [address, level] : undefined,
    query: { enabled: !!address && user.registered, staleTime: 15_000 },
  });
  const referrals = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "usersXMatrixReferrals",
    args: address && level >= 1 && level <= LAE_LEVELS ? [address, level] : undefined,
    query: { enabled: !!address && user.registered, staleTime: 15_000 },
  });
  const slotActive = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "isUserSlotActive",
    args: user.userId && level >= 1 ? [user.userId, level] : undefined,
    query: { enabled: !!user.userId && user.userId > 0n, staleTime: 15_000 },
  });

  const m = matrix.data;
  const refs = (referrals.data as Address[] | undefined) ?? [];

  return {
    active: slotActive.data === true,
    currentReferrer: m?.[0] as Address | undefined,
    reinvestCount: m?.[1] ?? 0n,
    heldForUpgrade: m?.[2] ?? 0n,
    totalTeamSize: m?.[4] ?? 0n,
    totalEarning: m?.[5] ?? 0n,
    referrals: refs,
    filledSpots: refs.length,
    isLoading: matrix.isLoading || referrals.isLoading || slotActive.isLoading,
    isError: matrix.isError || referrals.isError,
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
  const directs = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getDirectPartnerAddresses",
    args: user.userId && user.userId > 0n ? [user.userId] : undefined,
    query: { enabled: !!user.userId && user.userId > 0n, staleTime: 15_000 },
  });
  const directIds = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getDirectPartnerIds",
    args: user.userId && user.userId > 0n ? [user.userId] : undefined,
    query: { enabled: !!user.userId && user.userId > 0n, staleTime: 15_000 },
  });
  return {
    addresses: (directs.data as Address[] | undefined) ?? [],
    ids: (directIds.data as bigint[] | undefined) ?? [],
    isLoading: user.isLoading || directs.isLoading,
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

  return useQuery({
    queryKey: ["lae-events", user.userId?.toString(), user.userAddress, LAE_CONTRACTS.matrix],
    enabled: !!client && !!user.userId && user.userId > 0n,
    staleTime: 120_000,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!client || !user.userId) return [];
      const uid = user.userId;
      const head = await client.getBlockNumber();
      const fromBlock =
        head > LOG_LOOKBACK_BLOCKS ? head - LOG_LOOKBACK_BLOCKS : 0n;
      const logs = await client.getContractEvents({
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        fromBlock,
        toBlock: head,
      });
      return logs.filter((log) =>
        matrixEventMatchesUser(
          { eventName: log.eventName, args: log.args as Record<string, unknown> },
          uid,
          user.userAddress
        )
      );
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
    isError: events.isError,
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
  const summary = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getLaeRewardSummary",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 15_000 },
  });
  const directs = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getDirectPartnerCount",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 15_000 },
  });

  const s = summary.data as readonly [bigint, bigint, bigint, bigint, bigint] | undefined;
  const allocated = s?.[0] ?? 0n;
  const released = s?.[1] ?? 0n;
  const claimable = s?.[2] ?? 0n;
  const claimed = s?.[3] ?? 0n;
  const locked = s?.[4] ?? 0n;
  const directCount = (directs.data as bigint | undefined) ?? 0n;

  return {
    allocated,
    released,
    claimable,
    claimed,
    locked,
    directCount,
    nextRelease: released > claimed + claimable ? released - claimed - claimable : 0n,
    isLoading: summary.isLoading || directs.isLoading,
    refetch: () => {
      void summary.refetch();
      void directs.refetch();
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
