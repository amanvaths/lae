import type { MatrixUserEvent } from "./matrix-events";

export function eventBlockNumber(e: MatrixUserEvent): bigint {
  const bn = (e as { blockNumber?: bigint }).blockNumber;
  if (bn != null) return bn;
  const fromArgs = (e.args as { blockNumber?: unknown })?.blockNumber;
  if (typeof fromArgs === "bigint") return fromArgs;
  return 0n;
}

export function sortEventsNewestFirst(events: MatrixUserEvent[]): MatrixUserEvent[] {
  return [...events].sort((a, b) => {
    const ba = eventBlockNumber(a);
    const bb = eventBlockNumber(b);
    if (ba === bb) return (b.logIndex ?? 0) - (a.logIndex ?? 0);
    return ba > bb ? -1 : 1;
  });
}

export function dedupeEvents(events: MatrixUserEvent[]): MatrixUserEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = `${e.transactionHash}:${e.logIndex ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
