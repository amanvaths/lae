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

/** Income credited TO `userId` — excludes TokenReceived where user was only the payer (fromId). */
export function splitIncomeEvents(events: MatrixUserEvent[], userId: bigint | undefined) {
  if (!userId || userId <= 0n) {
    return {
      incomeEvents: [] as MatrixUserEvent[],
      lapseEvents: [] as MatrixUserEvent[],
      treasuryEvents: [] as MatrixUserEvent[],
      totalMatrixIncome: 0n,
      totalLapseIncome: 0n,
      totalRoyalIncome: 0n,
    };
  }

  const lapse = events.filter((e) => {
    if ((e.eventName as string) !== "LapseIncome") return false;
    const a = e.args as { receiverId?: bigint };
    return a.receiverId === userId;
  });

  const lapseTxKeys = new Set(
    lapse.map((e) => {
      const a = e.args as { receiverId?: bigint; fromId?: bigint };
      return `${e.transactionHash}:${String(a.receiverId ?? "")}:${String(a.fromId ?? "")}`;
    })
  );

  const income = events.filter((e) => {
    if (e.eventName !== "TokenReceived") return false;
    const a = e.args as { receiverId?: bigint; fromId?: bigint };
    if (a.receiverId !== userId) return false;
    const pairKey = `${e.transactionHash}:${String(a.receiverId ?? "")}:${String(a.fromId ?? "")}`;
    return !lapseTxKeys.has(pairKey);
  });

  // One registration tx can pay the same receiver multiple times (L1 slots + L2+ recycle).
  const seenMatrix = new Set<string>();
  const uniqueIncome = income.filter((e) => {
    const key =
      e.logIndex != null
        ? `${e.transactionHash}:${e.logIndex}`
        : `${e.transactionHash}:${userId}:${String((e.args as { amount?: bigint }).amount ?? "")}`;
    if (seenMatrix.has(key)) return false;
    seenMatrix.add(key);
    return true;
  });

  const treasury = events.filter((e) => {
    if (e.eventName !== "ClubPoolPayment") return false;
    const a = e.args as { userId?: bigint };
    return a.userId === userId;
  });

  const sumAmount = (rows: MatrixUserEvent[]) =>
    rows.reduce((s, e) => s + ((e.args as { amount?: bigint }).amount ?? 0n), 0n);

  return {
    incomeEvents: uniqueIncome,
    lapseEvents: lapse,
    treasuryEvents: treasury,
    totalMatrixIncome: sumAmount(uniqueIncome),
    totalLapseIncome: sumAmount(lapse),
    totalRoyalIncome: sumAmount(treasury),
  };
}
