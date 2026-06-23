import { API_BASE_URL } from "@/lib/api-client";
import type { MatrixUserEvent } from "./matrix-events";

type ApiEventRow = {
  transactionHash: string;
  logIndex: number;
  eventName: string;
  blockNumber?: string;
  args: Record<string, unknown>;
};

function normalizeApiEvent(row: ApiEventRow): MatrixUserEvent {
  const args: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row.args ?? {})) {
    if (typeof v === "number") args[k] = BigInt(v);
    else if (typeof v === "string" && /^-?\d+$/.test(v)) args[k] = BigInt(v);
    else args[k] = v;
  }
  const blockNumber =
    row.blockNumber && /^\d+$/.test(row.blockNumber) ? BigInt(row.blockNumber) : undefined;

  return {
    transactionHash: row.transactionHash as `0x${string}`,
    logIndex: row.logIndex,
    eventName: row.eventName,
    blockNumber,
    args,
  } as MatrixUserEvent;
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
