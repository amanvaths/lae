import type { PublicClient, GetContractEventsReturnType } from "viem";
import type { Address } from "viem";
import { LAE_MATRIX_DEPLOY_BLOCK, LOG_CHUNK_BLOCKS, LOG_LOOKBACK_BLOCKS } from "@/lib/contracts/config";
import { LAE_CONTRACTS } from "./contracts";
import { laeClubMatrixAbi } from "./abis";

export type MatrixUserEvent = GetContractEventsReturnType<
  typeof laeClubMatrixAbi
>[number];

type EventQuery = {
  eventName: string;
  args?: Record<string, bigint | Address>;
};

/** User-scoped event queries — indexed filters keep RPC responses small. */
function userEventQueries(userId: bigint, userAddress: Address): EventQuery[] {
  return [
    { eventName: "Registration", args: { userId } },
    { eventName: "TokenReceived", args: { receiverId: userId } },
    { eventName: "TokenReceived", args: { fromId: userId } },
    { eventName: "ClubPoolPayment", args: { refId: userId } },
    { eventName: "ClubPoolPayment", args: { userId } },
    { eventName: "NewUserPlace", args: { user: userId } },
    { eventName: "NewUserPlace", args: { referrer: userId } },
    { eventName: "Spillover", args: { referrerId: userId } },
    { eventName: "Spillover", args: { receiverId: userId } },
    { eventName: "Reinvest", args: { userId } },
    { eventName: "Reinvest", args: { callerId: userId } },
    { eventName: "Upgrade", args: { userId } },
    { eventName: "MissedIncome", args: { receiverId: userId } },
    { eventName: "MissedIncome", args: { userId } },
  ];
}

/** Subsets for pages that only need income-related logs. */
export function incomeEventQueries(userId: bigint): EventQuery[] {
  return [
    { eventName: "TokenReceived", args: { receiverId: userId } },
    { eventName: "ClubPoolPayment", args: { refId: userId } },
  ];
}

export function allEventQueries(userId: bigint): EventQuery[] {
  return userEventQueries(userId, "0x0000000000000000000000000000000000000000");
}

const CHUNK_TIMEOUT_MS = 8_000;
const FETCH_TIMEOUT_MS = 25_000;
const MAX_CONCURRENT = 4;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

async function fetchChunkedEvents(
  client: PublicClient,
  query: EventQuery,
  fromBlock: bigint,
  toBlock: bigint
): Promise<MatrixUserEvent[]> {
  const out: MatrixUserEvent[] = [];
  for (let start = fromBlock; start <= toBlock; start += LOG_CHUNK_BLOCKS) {
    const end = start + LOG_CHUNK_BLOCKS - 1n > toBlock ? toBlock : start + LOG_CHUNK_BLOCKS - 1n;
    const logs = await withTimeout(
      client.getContractEvents({
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        eventName: query.eventName as never,
        args: query.args as never,
        fromBlock: start,
        toBlock: end,
      }),
      CHUNK_TIMEOUT_MS
    );
    if (logs) out.push(...logs);
  }
  return out;
}

async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function dedupeEvents(events: MatrixUserEvent[]): MatrixUserEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = `${e.transactionHash}:${e.logIndex ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveFromBlock(head: bigint): bigint {
  const lookbackStart = head > LOG_LOOKBACK_BLOCKS ? head - LOG_LOOKBACK_BLOCKS : 0n;
  return lookbackStart > LAE_MATRIX_DEPLOY_BLOCK ? lookbackStart : LAE_MATRIX_DEPLOY_BLOCK;
}

/** Fetch matrix logs using indexed filters + chunked getLogs. Never throws. */
export async function fetchMatrixUserEvents(
  client: PublicClient,
  userId: bigint,
  _userAddress: Address,
  options?: { queries?: EventQuery[]; timeoutMs?: number }
): Promise<{ events: MatrixUserEvent[]; partial: boolean }> {
  const timeoutMs = options?.timeoutMs ?? FETCH_TIMEOUT_MS;
  const queries = options?.queries ?? userEventQueries(userId, _userAddress);

  const work = async (): Promise<{ events: MatrixUserEvent[]; partial: boolean }> => {
    const head = await client.getBlockNumber();
    const fromBlock = resolveFromBlock(head);

    const batches = await mapConcurrent(queries, MAX_CONCURRENT, (q) =>
      fetchChunkedEvents(client, q, fromBlock, head)
    );

    const events = dedupeEvents(batches.flat());
    const partial = events.length === 0 || fromBlock > LAE_MATRIX_DEPLOY_BLOCK;
    return { events, partial };
  };

  const result = await withTimeout(work(), timeoutMs);
  if (result) return result;
  return { events: [], partial: true };
}
