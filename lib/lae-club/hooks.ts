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
import { formatEther, type Address, type PublicClient } from "viem";
import { LAE_CONTRACTS } from "./contracts";
import { erc20BalanceAbi, laeCoinAbi, laeStakingAbi } from "./abis";
import { laeClubMatrixAbi } from "./matrix-core-abi";
import { LAE_MATRIX_SIZE, LAE_LAST_LEVEL, MATRIX_SUPPORTS_LAE_REWARDS } from "./constants";
import { siteOrigin, withBasePath } from "@/lib/paths";
import { incomeStringToWei } from "@/lib/contracts/format";
import { fetchMatrixUserEvents, type MatrixUserEvent } from "./matrix-events";
import { dedupeEvents, sortEventsNewestFirst, splitIncomeEvents } from "./event-utils";
import { fetchLaeUserEventsFromApi, fetchLaeUserIncomeFromApi } from "./user-api";
import { LAE_USER_QUERY_KEY } from "./query-keys";
import {
  useLaeMatrixOverviewApi,
  useLaeMatrixTreeApi,
} from "./matrix-api";
import { useDashboardViewUserId } from "./dashboard-view-context";

type UserDetailsRow = readonly [
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
  details: UserDetailsRow | undefined;
};

function mapMatrixUser({ registered, userId, details }: LaeUserSnapshot) {
  const d = details;
  return {
    registered,
    userId,
    details: undefined,
    userAddress: d?.[0],
    sponsorAddress: d?.[1] as Address | undefined,
    sponsorId: d?.[2],
    directCount: d?.[3] ?? 0n,
    activeLevels: d?.[4] ?? 0,
    currentCycle: 1,
    highestSlot: d?.[4] ?? 1,
    teamSize: d?.[5] ?? 0n,
    registeredAt: d?.[6] ?? 0n,
    totalIncome: d?.[7] ?? 0n,
    totalCycles: 0,
  };
}

/** LAEClubMatrix identity — addressToId + getUserDetails (connected wallet). */
function useLaeUserFromWallet() {
  const { address } = useAccount();
  const client = usePublicClient();

  const q = useQuery({
    queryKey: [LAE_USER_QUERY_KEY, address, LAE_CONTRACTS.matrix],
    enabled: !!address && !!client,
    staleTime: 5_000,
    gcTime: 300_000,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    queryFn: async (): Promise<LaeUserSnapshot> => {
      if (!address || !client) {
        return { registered: false, userId: undefined, details: undefined };
      }

      const userId = (await client.readContract({
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        functionName: "addressToId",
        args: [address],
      })) as bigint;

      if (!userId || userId === 0n) {
        return { registered: false, userId: undefined, details: undefined };
      }

      const details = (await client.readContract({
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        functionName: "getUserDetails",
        args: [userId],
      })) as UserDetailsRow;

      return { registered: true, userId, details };
    },
  });

  const empty = mapMatrixUser({ registered: false, userId: undefined, details: undefined });

  if (!address) {
    return { ...empty, isLoading: false, isError: false, refetch: () => {} };
  }

  const snapshot = q.data ? mapMatrixUser(q.data) : empty;

  return {
    ...snapshot,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: () => void q.refetch(),
  };
}

/** Dashboard subject — connected wallet or ?viewUserId= read-only viewer. */
export function useLaeUser() {
  const viewUserId = useDashboardViewUserId();
  const walletUser = useLaeUserFromWallet();
  const viewUser = useLaeUserById(viewUserId ?? undefined);

  if (viewUserId != null && viewUserId > 0) {
    return {
      ...viewUser,
      isViewMode: true as const,
    };
  }

  return {
    ...walletUser,
    isViewMode: false as const,
  };
}

/** LAEClubMatrix level prices (slots 1–15). */
export function useLaeLevelPrices() {
  const reads = useReadContracts({
    contracts: Array.from({ length: LAE_LAST_LEVEL }, (_, i) => ({
      address: LAE_CONTRACTS.matrix,
      abi: laeClubMatrixAbi,
      functionName: "levelTokenCost" as const,
      args: [i + 1] as [number],
    })),
    query: { staleTime: 60_000 },
  });

  const prices = reads.data
    ?.map((r, i) => {
      const price = r.result as bigint | undefined;
      if (price == null) return null;
      return {
        level: i + 1,
        price,
        priceFormatted: formatEther(price),
      };
    })
    .filter(Boolean) as { level: number; price: bigint; priceFormatted: string }[] | undefined;

  return {
    prices,
    isLoading: reads.isLoading,
    isError: reads.isError,
  };
}

/** Level matrix tree — API (usersXMatrixReferrals via backend). */
export function useLaeMatrixLevel(
  level: number,
  cycle: number,
  options?: { enabled?: boolean }
) {
  const user = useLaeUser();
  const userIdNum = user.userId ? Number(user.userId) : undefined;
  const enabled =
    (options?.enabled !== false) &&
    !!userIdNum &&
    level >= 1 &&
    cycle >= 1;

  const treeApi = useLaeMatrixTreeApi(userIdNum, level, cycle, { enabled });
  const tree = treeApi.tree;

  return {
    active: tree?.active ?? true,
    reinvestCount: BigInt(Math.max(0, cycle - 1)),
    heldForUpgrade: 0n,
    totalTeamSize: 0n,
    totalEarning: tree ? incomeStringToWei(tree.totalEarned) : user.totalIncome,
    referrals: [] as Address[],
    filledSpots: tree?.filledSpots ?? 0,
    slots: tree?.slots,
    isLoading: enabled && treeApi.isLoading,
    isError: treeApi.isError,
  };
}

export function useLaeMatrixFillCounts(level = 1) {
  const user = useLaeUser();
  const userIdNum = user.userId ? Number(user.userId) : undefined;
  const overview = useLaeMatrixOverviewApi(userIdNum, level);
  const levelData = overview.overview?.levels.find((l) => l.level === level);

  return {
    fills: levelData?.cycles?.map((c) => c.filled) ?? [],
    isLoading: overview.isLoading,
    isError: overview.isError,
  };
}

export function useLaeIdsForAddresses(addresses: readonly (Address | undefined)[]) {
  const ZERO = "0x0000000000000000000000000000000000000000";
  const unique = Array.from(
    new Set(
      addresses
        .filter((a): a is Address => !!a && a.toLowerCase() !== ZERO)
        .map((a) => a.toLowerCase() as Address)
    )
  );

  const reads = useReadContracts({
    contracts: unique.map((a) => ({
      address: LAE_CONTRACTS.matrix,
      abi: laeClubMatrixAbi,
      functionName: "addressToId" as const,
      args: [a] as [Address],
    })),
    query: { enabled: unique.length > 0, staleTime: 60_000, retry: 1 },
  });

  const idByAddress = new Map<string, number>();
  unique.forEach((a, i) => {
    const raw = reads.data?.[i]?.result as bigint | undefined;
    if (raw && raw > 0n) idByAddress.set(a, Number(raw));
  });

  return { idByAddress, isLoading: unique.length > 0 && reads.isLoading };
}

export function useLaeAddressesForIds(ids: readonly (number | bigint | undefined)[]) {
  const unique = Array.from(
    new Set(
      ids
        .map((v) => (v == null ? 0 : Number(v)))
        .filter((n) => Number.isFinite(n) && n > 0)
    )
  );

  const reads = useReadContracts({
    contracts: unique.map((id) => ({
      address: LAE_CONTRACTS.matrix,
      abi: laeClubMatrixAbi,
      functionName: "idToAddress" as const,
      args: [BigInt(id)] as [bigint],
    })),
    query: { enabled: unique.length > 0, staleTime: 300_000, retry: 1 },
  });

  const addressById = new Map<number, Address>();
  unique.forEach((id, i) => {
    const addr = reads.data?.[i]?.result as Address | undefined;
    if (addr) addressById.set(id, addr);
  });

  return { addressById, isLoading: unique.length > 0 && reads.isLoading };
}

export function useLaeAllMatrixLevels() {
  const user = useLaeUser();
  const userIdNum = user.userId ? Number(user.userId) : undefined;
  const overview = useLaeMatrixOverviewApi(userIdNum);
  const levels = overview.overview?.levels ?? [];
  const overviewActiveCount = levels.filter((l) => l.active).length;
  // Prefer on-chain activeSlotsCount from getUserDetails — stable vs backend overview
  // (overview can briefly report 1 when RPC calls fail server-side).
  const activeCount =
    user.activeLevels && user.activeLevels > 0
      ? user.activeLevels
      : overviewActiveCount;

  return {
    levels: levels.map((l) => {
      const cycles = l.cycles ?? [];
      const last = cycles[cycles.length - 1];
      return {
        level: l.level,
        active: l.active,
        filled: last?.filled ?? 0,
        completed: last?.completed ?? false,
        currentCycle: l.currentCycle,
      };
    }),
    activeCount,
    currentCycle: levels[0]?.currentCycle ?? 1,
    isLoading: user.isLoading || overview.isLoading,
  };
}

export function useLaeDirectTeam() {
  const user = useLaeUser();
  const enabled = !!user.userId && user.userId > 0n;

  const refs = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getDirectPartnerIds",
    args: enabled ? [user.userId!] : undefined,
    query: { enabled, staleTime: 15_000 },
  });

  const ids = ((refs.data as bigint[] | undefined) ?? []).map((id) => BigInt(id));
  const addrReads = useReadContracts({
    contracts: ids.map((id) => ({
      address: LAE_CONTRACTS.matrix,
      abi: laeClubMatrixAbi,
      functionName: "idToAddress" as const,
      args: [id] as [bigint],
    })),
    query: { enabled: ids.length > 0, staleTime: 15_000 },
  });

  const addresses =
    addrReads.data?.map((r) => r.result as Address | undefined).filter(Boolean) as
      | Address[]
      | undefined;

  return {
    addresses: addresses ?? [],
    ids,
    isLoading: user.isLoading || refs.isLoading || (ids.length > 0 && addrReads.isLoading),
  };
}

export function useLaeProtocolStats() {
  const reads = useReadContracts({
    contracts: [
      { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "lastUserId" },
      { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "levelTokenCost", args: [1] },
      { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "BTCB_TOKEN_ADDRESS" },
    ],
    query: { staleTime: 30_000 },
  });
  const [lastId, entryPrice, paymentToken] = reads.data ?? [];
  return {
    lastUserId: lastId?.result != null ? BigInt(lastId.result as bigint) : undefined,
    totalUsers: lastId?.result ? Number(lastId.result as bigint) : 0,
    entryPrice: entryPrice?.result as bigint | undefined,
    totalInvestment: undefined,
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
  const token = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "BTCB_TOKEN_ADDRESS",
    query: { staleTime: 60_000 },
  });

  const addr = poolAddress;
  const payment = (token.data as Address | undefined) ?? LAE_CONTRACTS.payment;

  const balance = useReadContract({
    address: payment,
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
    paymentToken: payment,
    balance: balance.data ?? 0n,
    isLoading: token.isLoading || balance.isLoading,
  };
}

async function loadUserEvents(
  client: PublicClient,
  userId: bigint,
  userAddress: Address
): Promise<MatrixUserEvent[]> {
  const apiEvents = await fetchLaeUserEventsFromApi(userAddress);
  if (apiEvents && apiEvents.length > 0) {
    return sortEventsNewestFirst(dedupeEvents(apiEvents));
  }

  // Income API is a fallback only — never merge with events (duplicate TokenReceived rows).
  const apiIncome = await fetchLaeUserIncomeFromApi(userAddress);
  if (apiIncome && apiIncome.events.length > 0) {
    return sortEventsNewestFirst(dedupeEvents(apiIncome.events));
  }

  const chainResult = await fetchMatrixUserEvents(client, userId, userAddress, {
    timeoutMs: 8_000,
  });
  return sortEventsNewestFirst(dedupeEvents(chainResult.events));
}

export function useLaeUserEvents() {
  const client = usePublicClient();
  const user = useLaeUser();

  return useQuery<MatrixUserEvent[]>({
    queryKey: ["lae-events", user.userId?.toString(), user.userAddress, LAE_CONTRACTS.matrix],
    enabled: !!client && !!user.userId && user.userId > 0n && !!user.userAddress,
    staleTime: 60_000,
    gcTime: 600_000,
    retry: 1,
    refetchOnWindowFocus: true,
    throwOnError: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (!client || !user.userId || !user.userAddress) return [];
      return loadUserEvents(client, user.userId, user.userAddress);
    },
  });
}

export function useLaeIncomeEvents() {
  const user = useLaeUser();
  const events = useLaeUserEvents();
  const split = splitIncomeEvents(events.data ?? [], user.userId);
  return {
    incomeEvents: split.incomeEvents,
    lapseEvents: split.lapseEvents,
    royalEvents: split.treasuryEvents,
    allEvents: events.data ?? [],
    spillEvents: [] as MatrixUserEvent[],
    placementEvents: (events.data ?? []).filter((e) => e.eventName === "NewUserPlace"),
    reinvestEvents: (events.data ?? []).filter((e) => e.eventName === "Reinvest"),
    upgradeEvents: (events.data ?? []).filter((e) => e.eventName === "Upgrade"),
    totalMatrixIncome: split.totalMatrixIncome,
    totalLapseIncome: split.totalLapseIncome,
    totalRoyalIncome: split.totalRoyalIncome,
    isLoading: events.isLoading,
    isFetching: events.isFetching,
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
  return {
    registrationPass: user.registered,
    royalRank1: false,
    royalRank2: false,
    royalRank3: false,
    royalRank4: false,
    activeLevels: user.highestSlot ?? 0,
    isLoading: user.isLoading,
  };
}

export function referralLinkByUserId(userId: bigint | number | undefined) {
  if (userId === undefined || userId === 0n || userId === 0) return "";
  return `${siteOrigin}${withBasePath("/register")}?ref=${String(userId)}`;
}

export function useLaeRewardSummary() {
  const { address } = useAccount();
  const user = useLaeUser();

  const summary = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getLaeRewardSummary" as never,
    args: address ? [address] : undefined,
    query: { enabled: false, staleTime: 15_000 },
  });

  const s = summary.data as readonly [bigint, bigint, bigint, bigint, bigint] | undefined;

  return {
    allocated: s?.[0] ?? 0n,
    released: s?.[1] ?? 0n,
    claimable: s?.[2] ?? 0n,
    claimed: s?.[3] ?? 0n,
    locked: s?.[4] ?? 0n,
    directCount: user.directCount ?? 0n,
    nextRelease: 0n,
    supported: MATRIX_SUPPORTS_LAE_REWARDS,
    isLoading: user.isLoading,
    refetch: () => void summary.refetch(),
  };
}

export function useLaeVestingDirectRequirement(_registrationTimestamp?: bigint) {
  return {
    month: 1,
    requiredDirects: 2n,
    supported: MATRIX_SUPPORTS_LAE_REWARDS,
    isLoading: false,
  };
}

export function useClaimLaeRewards() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  async function claim() {
    return writeContractAsync({
      address: LAE_CONTRACTS.matrix,
      abi: laeClubMatrixAbi,
      functionName: "claimLaeRewards" as never,
    });
  }

  return {
    claim,
    hash,
    isPending,
    isConfirming: receipt.isLoading,
    error,
    receipt,
    supported: MATRIX_SUPPORTS_LAE_REWARDS,
  };
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

export function useLaeUserById(userIdInput: string | number | null | undefined) {
  const userId = parseLaeUserId(userIdInput);

  const reads = useReadContracts({
    contracts: userId
      ? [
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

  const d = reads.data?.[0]?.result as UserDetailsRow | undefined;
  const walletAddress = d?.[0];
  const exists = !!walletAddress && walletAddress.toLowerCase() !== ZERO_ADDRESS.toLowerCase();

  return {
    ...mapMatrixUser({
      registered: exists,
      userId: userId ?? undefined,
      details: exists ? d : undefined,
    }),
    walletAddress: exists ? walletAddress : undefined,
    isLoading: !!userId && reads.isLoading,
    isError: reads.isError,
    notFound: !!userId && !reads.isLoading && !exists,
    refetch: () => void reads.refetch(),
  };
}

export function useLaeMatrixLevelForUser(
  _userAddress: Address | undefined,
  userId: bigint | undefined,
  level: number,
  cycle: number
) {
  const userIdNum = userId ? Number(userId) : undefined;
  const enabled = !!userIdNum && level >= 1 && cycle >= 1;
  const treeApi = useLaeMatrixTreeApi(userIdNum, level, cycle, { enabled });
  const tree = treeApi.tree;

  return {
    active: tree?.active ?? true,
    reinvestCount: BigInt(Math.max(0, cycle - 1)),
    heldForUpgrade: 0n,
    totalTeamSize: 0n,
    totalEarning: tree ? incomeStringToWei(tree.totalEarned) : 0n,
    referrals: [] as Address[],
    filledSpots: tree?.filledSpots ?? 0,
    slots: tree?.slots,
    isLoading: enabled && treeApi.isLoading,
  };
}

export function useLaeAllMatrixLevelsForUser(userId: bigint | undefined) {
  const userIdNum = userId ? Number(userId) : undefined;
  const overview = useLaeMatrixOverviewApi(userIdNum);
  const levels = overview.overview?.levels ?? [];
  const overviewActiveCount = levels.filter((l) => l.active).length;

  const detailsRead = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getUserDetails",
    args: userId && userId > 0n ? [userId] : undefined,
    query: { enabled: !!userId && userId > 0n, staleTime: 15_000 },
  });
  const chainActiveCount = detailsRead.data
    ? Number((detailsRead.data as UserDetailsRow)[4]) || 0
    : 0;
  const activeCount =
    chainActiveCount > 0 ? chainActiveCount : overviewActiveCount;

  return {
    levels: levels.map((l) => {
      const cycles = l.cycles ?? [];
      return {
        level: l.level,
        active: l.active,
        filled: cycles[cycles.length - 1]?.filled ?? 0,
        currentCycle: l.currentCycle,
      };
    }),
    activeCount,
    isLoading: overview.isLoading || detailsRead.isLoading,
  };
}

export function useLaeDirectTeamForUser(userId: bigint | undefined) {
  const enabled = !!userId && userId > 0n;

  const refs = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getDirectPartnerIds",
    args: enabled ? [userId] : undefined,
    query: { enabled, staleTime: 15_000 },
  });

  const ids = ((refs.data as bigint[] | undefined) ?? []).map((id) => BigInt(id));
  const addrReads = useReadContracts({
    contracts: ids.map((id) => ({
      address: LAE_CONTRACTS.matrix,
      abi: laeClubMatrixAbi,
      functionName: "idToAddress" as const,
      args: [id] as [bigint],
    })),
    query: { enabled: ids.length > 0, staleTime: 15_000 },
  });

  const addresses =
    addrReads.data?.map((r) => r.result as Address | undefined).filter(Boolean) as
      | Address[]
      | undefined;

  return {
    addresses: addresses ?? [],
    ids,
    isLoading: enabled && (refs.isLoading || (ids.length > 0 && addrReads.isLoading)),
  };
}

export function useLaeRewardSummaryForAddress(userAddress: Address | undefined) {
  const summary = useReadContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getLaeRewardSummary" as never,
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: false, staleTime: 15_000 },
  });

  const s = summary.data as readonly [bigint, bigint, bigint, bigint, bigint] | undefined;

  return {
    allocated: s?.[0] ?? 0n,
    released: s?.[1] ?? 0n,
    claimable: s?.[2] ?? 0n,
    claimed: s?.[3] ?? 0n,
    locked: s?.[4] ?? 0n,
    supported: MATRIX_SUPPORTS_LAE_REWARDS,
    isLoading: summary.isLoading,
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
      return loadUserEvents(client, userId, userAddress);
    },
  });
}
