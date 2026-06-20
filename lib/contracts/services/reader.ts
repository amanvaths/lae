import type { Address, PublicClient } from "viem";
import { getAddress, isAddressEqual } from "viem";
import { CONTRACTS, LOG_LOOKBACK_BLOCKS } from "../config";
import {
  laeLimitlessAbi,
  CLUB_LEVELS,
  PILOT_LEVELS,
} from "../abis";
import { erc20Abi } from "../abis/erc20";

function sameAddr(a: unknown, b: Address): boolean {
  if (typeof a !== "string" || !a.startsWith("0x")) return false;
  try {
    return isAddressEqual(getAddress(a as Address), getAddress(b));
  } catch {
    return false;
  }
}

async function getEventFromBlock(client: PublicClient): Promise<bigint> {
  try {
    const latest = await client.getBlockNumber();
    return latest > LOG_LOOKBACK_BLOCKS ? latest - LOG_LOOKBACK_BLOCKS : 0n;
  } catch {
    return 0n;
  }
}

export interface LaeUser {
  sponsor: Address;
  registered: boolean;
  registeredAt: bigint;
}

export interface PackageState {
  level: number;
  owned: boolean;
  isManual: boolean;
  cyclesCompleted: number;
  activeMatrixId: bigint;
}

export interface ClubMatrixView {
  matrixId: bigint;
  level: number;
  slotsFilled: number;
  active: boolean;
  cycleCompleted: boolean;
  isRebirth: boolean;
  parentMatrixId: bigint;
  cycleNumber: number;
  createdAt: bigint;
  slots: Address[];
}

export interface PilotMatrixView {
  matrixId: bigint;
  level: number;
  slotsFilled: number;
  active: boolean;
  cycleCompleted: boolean;
  isRebirth: boolean;
  parentMatrixId: bigint;
  cycleNumber: number;
  createdAt: bigint;
  slots: Address[];
}

export interface WalletSnapshot {
  daiWallet: bigint;
  daiInternal: bigint;
  sltBalance: bigint;
  totalEarnings: bigint;
  totalWithdrawals: bigint;
}

export interface ChainEventRow {
  id: string;
  eventName: string;
  blockNumber: bigint;
  transactionHash: string;
  args: Record<string, unknown>;
}

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

export async function readLaeUser(
  client: PublicClient,
  address: Address
): Promise<LaeUser> {
  const [sponsor, registered, registeredAt] = await client.readContract({
    address: CONTRACTS.lae,
    abi: laeLimitlessAbi,
    functionName: "users",
    args: [address],
  });
  return { sponsor, registered, registeredAt };
}

export async function readClubPackages(
  client: PublicClient,
  address: Address
): Promise<PackageState[]> {
  const results: PackageState[] = [];
  for (let level = 1; level <= CLUB_LEVELS; level++) {
    const [owned, isManual, cyclesCompleted] = await client.readContract({
      address: CONTRACTS.lae,
      abi: laeLimitlessAbi,
      functionName: "clubPackages",
      args: [address, level],
    });
    const activeMatrixId = owned
      ? await client.readContract({
          address: CONTRACTS.lae,
          abi: laeLimitlessAbi,
          functionName: "activeClubMatrix",
          args: [address, level],
        })
      : 0n;
    results.push({
      level,
      owned,
      isManual,
      cyclesCompleted: Number(cyclesCompleted),
      activeMatrixId,
    });
  }
  return results.filter((p) => p.owned);
}

export async function readPilotPackages(
  client: PublicClient,
  address: Address
): Promise<PackageState[]> {
  const results: PackageState[] = [];
  for (let level = 1; level <= PILOT_LEVELS; level++) {
    const [owned, isManual, cyclesCompleted] = await client.readContract({
      address: CONTRACTS.lae,
      abi: laeLimitlessAbi,
      functionName: "pilotPackages",
      args: [address, level],
    });
    const activeMatrixId = owned
      ? await client.readContract({
          address: CONTRACTS.lae,
          abi: laeLimitlessAbi,
          functionName: "activePilotMatrix",
          args: [address, level],
        })
      : 0n;
    results.push({
      level,
      owned,
      isManual,
      cyclesCompleted: Number(cyclesCompleted),
      activeMatrixId,
    });
  }
  return results.filter((p) => p.owned);
}

export async function readClubMatrix(
  client: PublicClient,
  matrixId: bigint
): Promise<ClubMatrixView | null> {
  if (matrixId === 0n) return null;
  const [
    owner,
    level,
    slotsFilled,
    active,
    cycleCompleted,
    isRebirth,
    parentMatrixId,
    cycleNumber,
    createdAt,
  ] = await client.readContract({
    address: CONTRACTS.lae,
    abi: laeLimitlessAbi,
    functionName: "clubMatrices",
    args: [matrixId],
  });
  void owner;
  const slots = await client.readContract({
    address: CONTRACTS.lae,
    abi: laeLimitlessAbi,
    functionName: "clubSlotUsers",
    args: [matrixId],
  });
  return {
    matrixId,
    level,
    slotsFilled,
    active,
    cycleCompleted,
    isRebirth,
    parentMatrixId,
    cycleNumber,
    createdAt,
    slots: [...slots],
  };
}

export async function readPilotMatrix(
  client: PublicClient,
  matrixId: bigint
): Promise<PilotMatrixView | null> {
  if (matrixId === 0n) return null;
  const [
    owner,
    level,
    slotsFilled,
    active,
    cycleCompleted,
    isRebirth,
    parentMatrixId,
    cycleNumber,
    createdAt,
  ] = await client.readContract({
    address: CONTRACTS.lae,
    abi: laeLimitlessAbi,
    functionName: "pilotMatrices",
    args: [matrixId],
  });
  void owner;
  const slots = await client.readContract({
    address: CONTRACTS.lae,
    abi: laeLimitlessAbi,
    functionName: "pilotSlotUsers",
    args: [matrixId],
  });
  return {
    matrixId,
    level,
    slotsFilled,
    active,
    cycleCompleted,
    isRebirth,
    parentMatrixId,
    cycleNumber,
    createdAt,
    slots: [...slots],
  };
}

export async function readActiveClubMatrices(
  client: PublicClient,
  address: Address
): Promise<ClubMatrixView[]> {
  const packages = await readClubPackages(client, address);
  const matrices: ClubMatrixView[] = [];
  for (const pkg of packages) {
    const matrix = await readClubMatrix(client, pkg.activeMatrixId);
    if (matrix) matrices.push(matrix);
  }
  return matrices;
}

export async function readActivePilotMatrices(
  client: PublicClient,
  address: Address
): Promise<PilotMatrixView[]> {
  const packages = await readPilotPackages(client, address);
  const matrices: PilotMatrixView[] = [];
  for (const pkg of packages) {
    const matrix = await readPilotMatrix(client, pkg.activeMatrixId);
    if (matrix) matrices.push(matrix);
  }
  return matrices;
}

export async function readReferrals(client: PublicClient, address: Address) {
  const [direct, qualifiedClub, qualifiedPilot] = await Promise.all([
    client.readContract({
      address: CONTRACTS.lae,
      abi: laeLimitlessAbi,
      functionName: "directReferrals",
      args: [address],
    }),
    client.readContract({
      address: CONTRACTS.lae,
      abi: laeLimitlessAbi,
      functionName: "countQualifiedDirectReferrals",
      args: [address, 0],
    }),
    client.readContract({
      address: CONTRACTS.lae,
      abi: laeLimitlessAbi,
      functionName: "countQualifiedDirectReferrals",
      args: [address, 1],
    }),
  ]);
  return {
    direct: direct as Address[],
    qualifiedClub: Number(qualifiedClub),
    qualifiedPilot: Number(qualifiedPilot),
  };
}

export async function readWalletSnapshot(
  client: PublicClient,
  address: Address
): Promise<WalletSnapshot> {
  const [daiWallet, daiInternal, sltBalance, earnings, withdrawals] =
    await Promise.all([
      client.readContract({
        address: CONTRACTS.dai,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      }),
      client.readContract({
        address: CONTRACTS.lae,
        abi: laeLimitlessAbi,
        functionName: "getDaiBalance",
        args: [address],
      }),
      client.readContract({
        address: CONTRACTS.lae,
        abi: laeLimitlessAbi,
        functionName: "getSltBalance",
        args: [address],
      }),
      sumIncomePaid(client, address),
      sumWithdrawals(client, address),
    ]);
  return {
    daiWallet,
    daiInternal,
    sltBalance,
    totalEarnings: earnings,
    totalWithdrawals: withdrawals,
  };
}

async function sumIncomePaid(client: PublicClient, address: Address): Promise<bigint> {
  try {
    const fromBlock = await getEventFromBlock(client);
    const logs = await client.getLogs({
      address: CONTRACTS.lae,
      event: {
        type: "event",
        name: "IncomePaid",
        inputs: [
          { name: "recipient", type: "address", indexed: true },
          { name: "payer", type: "address", indexed: true },
          { name: "incomeType", type: "uint8", indexed: false },
          { name: "matrixType", type: "uint8", indexed: false },
          { name: "level", type: "uint8", indexed: false },
          { name: "amount", type: "uint256", indexed: false },
        ],
      },
      args: { recipient: address },
      fromBlock,
      toBlock: "latest",
    });
    return logs.reduce((sum, log) => {
      const amount = (log.args as { amount?: bigint }).amount ?? 0n;
      return sum + amount;
    }, 0n);
  } catch {
    return 0n;
  }
}

async function sumWithdrawals(client: PublicClient, address: Address): Promise<bigint> {
  try {
    const fromBlock = await getEventFromBlock(client);
    const logs = await client.getLogs({
      address: CONTRACTS.lae,
      event: {
        type: "event",
        name: "Withdraw",
        inputs: [
          { name: "user", type: "address", indexed: true },
          { name: "amount", type: "uint256", indexed: false },
          { name: "withdrawRef", type: "bytes32", indexed: false },
        ],
      },
      args: { user: address },
      fromBlock,
      toBlock: "latest",
    });
    return logs.reduce((sum, log) => {
      const amount = (log.args as { amount?: bigint }).amount ?? 0n;
      return sum + amount;
    }, 0n);
  } catch {
    return 0n;
  }
}

export async function readUserEvents(
  client: PublicClient,
  address: Address
): Promise<ChainEventRow[]> {
  const eventNames = [
    "UserRegistered",
    "ClubPurchased",
    "PilotPurchased",
    "ClubPlacement",
    "PilotPlacement",
    "ClubCycleCompleted",
    "PilotCycleCompleted",
    "ClubRebirthCreated",
    "PilotRebirthCreated",
    "AutoUpgrade",
    "IncomePaid",
    "TokenReward",
    "Withdraw",
  ] as const;

  const rows: ChainEventRow[] = [];
  const fromBlock = await getEventFromBlock(client);
  const user = getAddress(address);

  function indexedArgs(
    name: (typeof eventNames)[number]
  ): Record<string, Address> | undefined {
    switch (name) {
      case "UserRegistered":
      case "ClubPurchased":
      case "PilotPurchased":
      case "ClubPlacement":
      case "PilotPlacement":
      case "AutoUpgrade":
      case "Withdraw":
        return { user };
      case "ClubCycleCompleted":
      case "PilotCycleCompleted":
      case "ClubRebirthCreated":
      case "PilotRebirthCreated":
        return { owner: user };
      case "IncomePaid":
      case "TokenReward":
        return { recipient: user };
      default:
        return undefined;
    }
  }

  async function fetchLogs(name: (typeof eventNames)[number], args?: Record<string, Address>) {
    try {
      return await client.getContractEvents({
        abi: laeLimitlessAbi,
        address: CONTRACTS.lae,
        eventName: name,
        args,
        fromBlock,
        toBlock: "latest",
      });
    } catch {
      return [];
    }
  }

  for (const name of eventNames) {
    const logs = await fetchLogs(name, indexedArgs(name));
    for (const log of logs) {
      const args = log.args as Record<string, unknown>;
      rows.push({
        id: `${log.transactionHash}-${log.logIndex}`,
        eventName: name,
        blockNumber: log.blockNumber ?? 0n,
        transactionHash: log.transactionHash ?? "",
        args: serializeArgs(args),
      });
    }
  }

  const sponsorRegs = await fetchLogs("UserRegistered", { sponsor: user });
  for (const log of sponsorRegs) {
    const args = log.args as Record<string, unknown>;
    if (sameAddr(args.user, user)) continue;
    rows.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      eventName: "UserRegistered",
      blockNumber: log.blockNumber ?? 0n,
      transactionHash: log.transactionHash ?? "",
      args: serializeArgs(args),
    });
  }

  rows.sort((a, b) => Number(b.blockNumber - a.blockNumber));
  return rows;
}

function serializeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === "bigint") out[k] = v.toString();
    else out[k] = v;
  }
  return out;
}

export async function readPackagePrices(client: PublicClient) {
  const club: { level: number; amount: bigint }[] = [];
  const pilot: { level: number; amount: bigint }[] = [];
  for (let i = 0; i < CLUB_LEVELS; i++) {
    const amount = await client.readContract({
      address: CONTRACTS.lae,
      abi: laeLimitlessAbi,
      functionName: "clubAmounts",
      args: [BigInt(i)],
    });
    club.push({ level: i + 1, amount });
  }
  for (let i = 0; i < PILOT_LEVELS; i++) {
    const amount = await client.readContract({
      address: CONTRACTS.lae,
      abi: laeLimitlessAbi,
      functionName: "pilotAmounts",
      args: [BigInt(i)],
    });
    pilot.push({ level: i + 1, amount });
  }
  return { club, pilot };
}

export async function readPendingLength(client: PublicClient): Promise<bigint> {
  return client.readContract({
    address: CONTRACTS.lae,
    abi: laeLimitlessAbi,
    functionName: "pendingLength",
  });
}

export async function readProtocolStatus(client: PublicClient) {
  const [activated, rootSponsor, pending] = await Promise.all([
    client.readContract({
      address: CONTRACTS.lae,
      abi: laeLimitlessAbi,
      functionName: "activated",
    }),
    client.readContract({
      address: CONTRACTS.lae,
      abi: laeLimitlessAbi,
      functionName: "rootSponsor",
    }),
    readPendingLength(client),
  ]);
  return { activated, rootSponsor: rootSponsor as Address, pending, rootSponsorIsZero: rootSponsor === ZERO };
}

export { CLUB_SLOTS, PILOT_SLOTS } from "../abis";
