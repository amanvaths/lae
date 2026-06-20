import type { PublicClient, GetContractEventsReturnType } from "viem";
import type { Address } from "viem";
import { LAE_MATRIX_DEPLOY_BLOCK, LOG_CHUNK_BLOCKS } from "@/lib/contracts/config";
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
    { eventName: "Registration", args: { userAddress } },
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

async function fetchChunkedEvents(
  client: PublicClient,
  query: EventQuery,
  fromBlock: bigint,
  toBlock: bigint
): Promise<MatrixUserEvent[]> {
  const out: MatrixUserEvent[] = [];
  for (let start = fromBlock; start <= toBlock; start += LOG_CHUNK_BLOCKS) {
    const end = start + LOG_CHUNK_BLOCKS - 1n > toBlock ? toBlock : start + LOG_CHUNK_BLOCKS - 1n;
    try {
      const logs = await client.getContractEvents({
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        eventName: query.eventName as never,
        args: query.args as never,
        fromBlock: start,
        toBlock: end,
      });
      out.push(...logs);
    } catch {
      /* skip failed chunk — public RPC rate limits / archive caps */
    }
  }
  return out;
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

/** Fetch matrix logs for a user using indexed filters + chunked getLogs. Never throws. */
export async function fetchMatrixUserEvents(
  client: PublicClient,
  userId: bigint,
  userAddress: Address
): Promise<{ events: MatrixUserEvent[]; partial: boolean }> {
  const head = await client.getBlockNumber();
  const fromBlock = head > LAE_MATRIX_DEPLOY_BLOCK ? LAE_MATRIX_DEPLOY_BLOCK : 0n;

  const queries = userEventQueries(userId, userAddress);
  let partial = false;
  const batches = await Promise.all(
    queries.map(async (q) => {
      const logs = await fetchChunkedEvents(client, q, fromBlock, head);
      if (logs.length === 0) partial = true;
      return logs;
    })
  );

  return { events: dedupeEvents(batches.flat()), partial };
}
