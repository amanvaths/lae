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
    const args = e.args as { receiverId?: bigint; fromId?: bigint; userId?: bigint };
    const receiver = args.receiverId ?? args.userId;
    const key =
      e.logIndex != null
        ? `${e.transactionHash}:${e.logIndex}`
        : `${e.transactionHash}:${e.eventName}:${String(receiver ?? "")}:${String(args.fromId ?? "")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
