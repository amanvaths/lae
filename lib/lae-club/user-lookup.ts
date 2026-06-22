import type { PublicClient, Address } from "viem";
import { getAddress, isAddress } from "viem";
import { LAE_CONTRACTS } from "./contracts";
import { laeClubMatrixAbi } from "./abis";

export type LaeUserLookup = {
  userId: bigint;
  wallet: Address;
  referrerId: bigint;
  activeLevels: number;
  teamSize: bigint;
  directCount: bigint;
  totalIncome: bigint;
};

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

function mapDetails(userId: bigint, d: readonly [Address, Address, bigint, bigint, number, bigint, bigint, bigint]): LaeUserLookup | null {
  const wallet = d[0];
  if (!wallet || wallet.toLowerCase() === ZERO.toLowerCase()) return null;
  return {
    userId,
    wallet,
    referrerId: d[2],
    directCount: d[3],
    activeLevels: d[4],
    teamSize: d[5],
    totalIncome: d[7],
  };
}

export async function lookupLaeUserById(
  client: PublicClient,
  userId: bigint
): Promise<LaeUserLookup | null> {
  const wallet = (await client.readContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "idToAddress",
    args: [userId],
  })) as Address;

  if (!wallet || wallet.toLowerCase() === ZERO.toLowerCase()) return null;

  const details = (await client.readContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getUserDetails",
    args: [userId],
  })) as readonly [Address, Address, bigint, bigint, number, bigint, bigint, bigint];

  return mapDetails(userId, details);
}

export async function lookupLaeUserByAddress(
  client: PublicClient,
  rawAddress: string
): Promise<LaeUserLookup | null> {
  if (!isAddress(rawAddress)) return null;
  const wallet = getAddress(rawAddress);

  const exists = (await client.readContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "isUserExists",
    args: [wallet],
  })) as boolean;

  if (!exists) return null;

  const userId = (await client.readContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "addressToId",
    args: [wallet],
  })) as bigint;

  if (!userId || userId === 0n) return null;

  const details = (await client.readContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "getUserDetails",
    args: [userId],
  })) as readonly [Address, Address, bigint, bigint, number, bigint, bigint, bigint];

  return mapDetails(userId, details);
}

export async function isValidReferrerId(
  client: PublicClient,
  referrerId: bigint
): Promise<boolean> {
  if (referrerId <= 0n) return false;
  const wallet = (await client.readContract({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "idToAddress",
    args: [referrerId],
  })) as Address;
  return !!wallet && wallet.toLowerCase() !== ZERO.toLowerCase();
}

export async function withLookupTimeout<T>(
  promise: Promise<T>,
  ms = 3_000
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Lookup timed out — try again")), ms);
    }),
  ]).finally(() => clearTimeout(timer!));
}
