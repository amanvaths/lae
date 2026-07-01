import type { PublicClient, GetContractEventsReturnType } from "viem";
import type { Address } from "viem";
import { MATRIX_CORE_DEPLOY_BLOCK, LOG_CHUNK_BLOCKS } from "@/lib/contracts/config";
import { LAE_CONTRACTS } from "./contracts";
import { laeClubMatrixAbi } from "./matrix-core-abi";

export type MatrixUserEvent = GetContractEventsReturnType<
  typeof laeClubMatrixAbi
>[number];

type EventQuery = {
  eventName: string;
  args?: Record<string, bigint | number | Address>;
};

/** LAEClubMatrix user-scoped event queries. */
function userEventQueries(userId: bigint): EventQuery[] {
  const id = userId;
  return [
    { eventName: "Registration", args: { userId: id } },
    { eventName: "NewUserPlace", args: { referrer: id } },
    { eventName: "NewUserPlace", args: { user: id } },
    { eventName: "TokenReceived", args: { receiverId: id } },
    { eventName: "TreasuryPool", args: { userId: id } },
    { eventName: "Reinvest", args: { userId: id } },
    { eventName: "Upgrade", args: { userId: id } },
    { eventName: "MissedIncome", args: { receiverId: id } },
  ];
}

export function incomeEventQueries(userId: bigint): EventQuery[] {
  const id = userId;
  return [
    { eventName: "TokenReceived", args: { receiverId: id } },
    { eventName: "TreasuryPool", args: { userId: id } },
  ];
}

export function allEventQueries(userId: bigint): EventQuery[] {
  return userEventQueries(userId);
}

const CHUNK_TIMEOUT_MS = 8_000;
const FETCH_TIMEOUT_MS = 45_000;
const MAX_CONCURRENT = 3;

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

/** Fetch LAEClubMatrix logs — indexer API preferred; chain fallback when API empty. */
export async function fetchMatrixUserEvents(
  client: PublicClient,
  userId: bigint,
  _userAddress: Address,
  options?: { queries?: EventQuery[]; timeoutMs?: number }
): Promise<{ events: MatrixUserEvent[]; partial: boolean }> {
  const timeoutMs = options?.timeoutMs ?? FETCH_TIMEOUT_MS;
  const queries = options?.queries ?? userEventQueries(userId);

  const work = async (): Promise<{ events: MatrixUserEvent[]; partial: boolean }> => {
    const head = await client.getBlockNumber();
    const fromBlock = MATRIX_CORE_DEPLOY_BLOCK > 0n ? MATRIX_CORE_DEPLOY_BLOCK : 0n;

    const batches = await mapConcurrent(queries, MAX_CONCURRENT, (q) =>
      fetchChunkedEvents(client, q, fromBlock, head)
    );

    const events = dedupeEvents(batches.flat());
    return { events, partial: events.length === 0 };
  };

  const result = await withTimeout(work(), timeoutMs);
  if (result) return result;
  return { events: [], partial: true };
}
