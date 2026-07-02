import { API_BASE_URL } from "@/lib/api-client";
import type { MatrixUserEvent } from "./matrix-events";

export type LaeIncomeRecord = {
  kind: string;
  fromUserId?: number | null;
  toUserId?: number | null;
  matrixOwnerId?: number | null;
  boardLevel?: number | null;
  cycleId?: number | null;
  position?: number | null;
  level?: number | null;
  amount: string;
  blockNumber: string | number;
  txHash: string;
  logIndex: number;
  createdAt?: string;
};

type ApiEventRow = {
  transactionHash?: string;
  txHash?: string;
  logIndex: number;
  eventName: string;
  blockNumber?: string;
  args?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  createdAt?: string;
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
    createdAt: row.createdAt,
  } as unknown as MatrixUserEvent;
}

/** Indexed income rows from backend (matrix + lapse + club pool). */
export async function fetchLaeUserIncomeFromApi(
  wallet: string,
  kind?: "matrix" | "treasury" | "lapse",
  limit = 200
): Promise<{ events: MatrixUserEvent[]; records: LaeIncomeRecord[] } | null> {
  const base = API_BASE_URL.replace(/\/$/, "");
  if (!base) return null;

  const params = new URLSearchParams({ wallet, limit: String(limit) });
  if (kind) params.set("kind", kind);

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
      incomes?: LaeIncomeRecord[];
    };

    const records = data.incomes ?? [];
    const events = records.map((row) => {
      const amountRaw = row.amount.includes(".") ? row.amount.split(".")[0] : row.amount;
      const amount = BigInt(amountRaw || "0");
      const eventName =
        row.kind === "lapse"
          ? "LapseIncome"
          : row.kind === "matrix"
            ? "TokenReceived"
            : "ClubPoolPayment";
      const isMatrix = eventName === "TokenReceived";
      const isLapse = eventName === "LapseIncome";
      const boardMeta = {
        matrixOwnerId: row.matrixOwnerId != null ? BigInt(row.matrixOwnerId) : undefined,
        boardLevel: row.boardLevel != null ? BigInt(row.boardLevel) : undefined,
        cycleId: row.cycleId != null ? BigInt(row.cycleId) : undefined,
        spot: row.position != null ? BigInt(row.position) : undefined,
      };
      return {
        transactionHash: row.txHash as `0x${string}`,
        logIndex: row.logIndex,
        eventName,
        blockNumber: BigInt(row.blockNumber),
        createdAt: row.createdAt,
        args: isMatrix
          ? {
              amount,
              fromId: row.fromUserId ? BigInt(row.fromUserId) : undefined,
              receiverId: row.toUserId ? BigInt(row.toUserId) : undefined,
              level: row.level ?? undefined,
              ...boardMeta,
            }
          : isLapse
            ? {
                amount,
                fromId: row.fromUserId ? BigInt(row.fromUserId) : undefined,
                receiverId: row.toUserId ? BigInt(row.toUserId) : undefined,
                level: row.level ?? undefined,
                ...boardMeta,
              }
            : {
                amount,
                userId: row.toUserId ? BigInt(row.toUserId) : undefined,
                level: row.level ?? undefined,
                matrixOwnerId: row.matrixOwnerId != null ? BigInt(row.matrixOwnerId) : undefined,
              },
      } as unknown as MatrixUserEvent;
    });
    return { events, records };
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
