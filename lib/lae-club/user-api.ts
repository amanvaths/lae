import { API_BASE_URL } from "@/lib/api-client";
import type { MatrixUserEvent } from "./matrix-events";

type ApiEventRow = {
  transactionHash?: string;
  txHash?: string;
  logIndex: number;
  eventName: string;
  blockNumber?: string;
  args?: Record<string, unknown>;
  payload?: Record<string, unknown>;
};

function normalizeApiEvent(row: ApiEventRow): MatrixUserEvent {
  const rawArgs = row.args ?? row.payload ?? {};
  const args: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rawArgs)) {
    if (typeof v === "number") args[k] = BigInt(v);
    else if (typeof v === "string" && /^-?\d+$/.test(v)) args[k] = BigInt(v);
    else args[k] = v;
  }
  const blockNumber =
    row.blockNumber && /^\d+$/.test(row.blockNumber) ? BigInt(row.blockNumber) : undefined;
  const hash = (row.transactionHash ?? row.txHash ?? "") as `0x${string}`;

  return {
    transactionHash: hash,
    logIndex: row.logIndex,
    eventName: row.eventName,
    blockNumber,
    args,
  } as MatrixUserEvent;
}

/** Indexed income rows from backend (matrix + club pool). */
export async function fetchLaeUserIncomeFromApi(
  wallet: string,
  kind?: "matrix" | "treasury",
  limit = 200
): Promise<MatrixUserEvent[] | null> {
  const base = API_BASE_URL.replace(/\/$/, "");
  if (!base) return null;

  const params = new URLSearchParams({ wallet, limit: String(limit) });
  if (kind) params.set("kind", kind === "treasury" ? "treasury" : "matrix");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(`${base}/api/lae/income?${params}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      incomes?: Array<{
        kind: string;
        fromUserId?: number | null;
        toUserId?: number;
        level?: number | null;
        amount: string;
        blockNumber: string | number;
        txHash: string;
        logIndex: number;
      }>;
    };

    return (data.incomes ?? []).map((row) => {
      const amountRaw = row.amount.includes(".") ? row.amount.split(".")[0] : row.amount;
      const amount = BigInt(amountRaw || "0");
      const isMatrix = row.kind === "matrix";
      return {
        transactionHash: row.txHash as `0x${string}`,
        logIndex: row.logIndex,
        eventName: isMatrix ? "TokenReceived" : "ClubPoolPayment",
        blockNumber: BigInt(row.blockNumber),
        args: isMatrix
          ? {
              amount,
              fromId: row.fromUserId ? BigInt(row.fromUserId) : undefined,
              receiverId: row.toUserId ? BigInt(row.toUserId) : undefined,
              level: row.level ?? undefined,
            }
          : {
              amount,
              userId: row.toUserId ? BigInt(row.toUserId) : undefined,
              level: row.level ?? undefined,
            },
      } as MatrixUserEvent;
    });
  } catch {
    return null;
  }
}

/** Fast path: indexed events from backend API (~100ms vs 30s+ on-chain). */
export async function fetchLaeUserEventsFromApi(
  wallet: string,
  limit = 500
): Promise<MatrixUserEvent[] | null> {
  const base = API_BASE_URL.replace(/\/$/, "");
  if (!base) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(
      `${base}/api/lae/events?wallet=${encodeURIComponent(wallet)}&limit=${limit}`,
      { signal: controller.signal, cache: "no-store" }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as { events?: ApiEventRow[] };
    return (data.events ?? []).map(normalizeApiEvent);
  } catch {
    return null;
  }
}
