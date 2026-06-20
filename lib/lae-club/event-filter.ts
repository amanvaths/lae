import type { Address } from "viem";

type MatrixLog = {
  eventName: string | undefined;
  args: Record<string, unknown>;
};

/** Whether a matrix log row belongs to the connected user (by userId + wallet address). */
export function matrixEventMatchesUser(
  log: MatrixLog,
  userId: bigint,
  userAddress?: Address
): boolean {
  const args = log.args;
  const uid = userId;
  const addr = userAddress?.toLowerCase();

  if (
    args.userId === uid ||
    args.receiverId === uid ||
    args.refId === uid ||
    args.callerId === uid ||
    args.fromId === uid ||
    args.referrer === uid ||
    args.newReferrerId === uid ||
    args.user === uid
  ) {
    return true;
  }

  if (addr && typeof args.user === "string" && args.user.toLowerCase() === addr) {
    return true;
  }
  if (addr && typeof args.userAddress === "string" && args.userAddress.toLowerCase() === addr) {
    return true;
  }

  return false;
}
