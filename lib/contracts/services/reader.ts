import type { Address, PublicClient } from "viem";
import { getAddress, isAddressEqual } from "viem";
import { CONTRACTS, LOG_LOOKBACK_BLOCKS } from "../config";
import {
  sensoLimitlessAbi,
  CLUB_LEVELS,
  PILOT_LEVELS,
  CLUB_SLOTS,
  PILOT_SLOTS,
} from "../abis";
import { sensoSpinAbi } from "../abis/sensoSpin";
import { sensoStakingAbi } from "../abis/sensoStaking";
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

export interface SensoUser {
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

export interface StakeView {
  index: number;
  amount: bigint;
  lockEnd: bigint;
  released: boolean;
}

export interface ChainEventRow {
  id: string;
  eventName: string;
  blockNumber: bigint;
  transactionHash: string;
  args: Record<string, unknown>;
}

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

export async function readSensoUser(
  client: PublicClient,
  address: Address
): Promise<SensoUser> {
  const [sponsor, registered, registeredAt] = await client.readContract({
    address: CONTRACTS.senso,
    abi: sensoLimitlessAbi,
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
      address: CONTRACTS.senso,
      abi: sensoLimitlessAbi,
      functionName: "clubPackages",
      args: [address, level],
    });
    const activeMatrixId = owned
      ? await client.readContract({
          address: CONTRACTS.senso,
          abi: sensoLimitlessAbi,
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
      address: CONTRACTS.senso,
      abi: sensoLimitlessAbi,
      functionName: "pilotPackages",
      args: [address, level],
    });
    const activeMatrixId = owned
      ? await client.readContract({
          address: CONTRACTS.senso,
          abi: sensoLimitlessAbi,
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
    address: CONTRACTS.senso,
    abi: sensoLimitlessAbi,
    functionName: "clubMatrices",
    args: [matrixId],
  });
  void owner;
  const slots = await client.readContract({
    address: CONTRACTS.senso,
    abi: sensoLimitlessAbi,
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
    address: CONTRACTS.senso,
    abi: sensoLimitlessAbi,
    functionName: "pilotMatrices",
    args: [matrixId],
  });
  void owner;
  const slots = await client.readContract({
    address: CONTRACTS.senso,
    abi: sensoLimitlessAbi,
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
      address: CONTRACTS.senso,
      abi: sensoLimitlessAbi,
      functionName: "directReferrals",
      args: [address],
    }),
    client.readContract({
      address: CONTRACTS.senso,
      abi: sensoLimitlessAbi,
      functionName: "countQualifiedDirectReferrals",
      args: [address, 0],
    }),
    client.readContract({
      address: CONTRACTS.senso,
      abi: sensoLimitlessAbi,
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
        address: CONTRACTS.senso,
        abi: sensoLimitlessAbi,
        functionName: "getDaiBalance",
        args: [address],
      }),
      client.readContract({
        address: CONTRACTS.senso,
        abi: sensoLimitlessAbi,
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
      address: CONTRACTS.senso,
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
      address: CONTRACTS.senso,
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

  for (const name of eventNames) {
    let logs;
    try {
      logs = await client.getContractEvents({
        abi: sensoLimitlessAbi,
        address: CONTRACTS.senso,
        eventName: name,
        fromBlock,
        toBlock: "latest",
      });
    } catch {
      continue;
    }

    for (const log of logs) {
      const args = log.args as Record<string, unknown>;
      const involves =
        sameAddr(args.user, user) ||
        sameAddr(args.owner, user) ||
        sameAddr(args.recipient, user) ||
        sameAddr(args.sponsor, user);
      if (!involves) continue;
      rows.push({
        id: `${log.transactionHash}-${log.logIndex}`,
        eventName: name,
        blockNumber: log.blockNumber ?? 0n,
        transactionHash: log.transactionHash ?? "",
        args: serializeArgs(args),
      });
    }
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
      address: CONTRACTS.senso,
      abi: sensoLimitlessAbi,
      functionName: "clubAmounts",
      args: [BigInt(i)],
    });
    club.push({ level: i + 1, amount });
  }
  for (let i = 0; i < PILOT_LEVELS; i++) {
    const amount = await client.readContract({
      address: CONTRACTS.senso,
      abi: sensoLimitlessAbi,
      functionName: "pilotAmounts",
      args: [BigInt(i)],
    });
    pilot.push({ level: i + 1, amount });
  }
  return { club, pilot };
}

export async function readSpinCoupons(client: PublicClient, address: Address) {
  return client.readContract({
    address: CONTRACTS.spin,
    abi: sensoSpinAbi,
    functionName: "spinCoupons",
    args: [address],
  });
}

export async function readSpinHistory(client: PublicClient, address: Address) {
  try {
    const fromBlock = await getEventFromBlock(client);
    const logs = await client.getContractEvents({
      abi: sensoSpinAbi,
      address: CONTRACTS.spin,
      eventName: "SpinExecuted",
      args: { user: getAddress(address) },
      fromBlock,
      toBlock: "latest",
    });
    return logs
      .map((log) => ({
        id: `${log.transactionHash}-${log.logIndex}`,
        tier: Number((log.args as { tier?: number }).tier ?? 0),
        sltAmount: (log.args as { laeAmount?: bigint; sltAmount?: bigint }).laeAmount
          ?? (log.args as { sltAmount?: bigint }).sltAmount
          ?? 0n,
        nonce: (log.args as { nonce?: bigint }).nonce ?? 0n,
        transactionHash: log.transactionHash ?? "",
        blockNumber: log.blockNumber ?? 0n,
      }))
      .reverse();
  } catch {
    return [];
  }
}

export async function readStakes(
  client: PublicClient,
  address: Address
): Promise<StakeView[]> {
  const count = await client.readContract({
    address: CONTRACTS.staking,
    abi: sensoStakingAbi,
    functionName: "stakeCount",
    args: [address],
  });
  const stakes: StakeView[] = [];
  for (let i = 0; i < Number(count); i++) {
    const s = await client.readContract({
      address: CONTRACTS.staking,
      abi: sensoStakingAbi,
      functionName: "stakes",
      args: [address, BigInt(i)],
    });
    stakes.push({
      index: i,
      amount: s[0],
      lockEnd: s[1],
      released: s[2],
    });
  }
  return stakes;
}

export async function readPendingLength(client: PublicClient): Promise<bigint> {
  return client.readContract({
    address: CONTRACTS.senso,
    abi: sensoLimitlessAbi,
    functionName: "pendingLength",
  });
}

export async function readProtocolStatus(client: PublicClient) {
  const [activated, rootSponsor, pending] = await Promise.all([
    client.readContract({
      address: CONTRACTS.senso,
      abi: sensoLimitlessAbi,
      functionName: "activated",
    }),
    client.readContract({
      address: CONTRACTS.senso,
      abi: sensoLimitlessAbi,
      functionName: "rootSponsor",
    }),
    readPendingLength(client),
  ]);
  return { activated, rootSponsor: rootSponsor as Address, pending, rootSponsorIsZero: rootSponsor === ZERO };
}

export { CLUB_SLOTS, PILOT_SLOTS };
