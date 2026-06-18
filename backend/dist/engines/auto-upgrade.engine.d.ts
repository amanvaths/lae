import type { TransactionClient } from "../lib/prisma.js";
export declare function handleClubAutoUpgrade(tx: TransactionClient, userId: string, currentLevel: number, withdrawAmount: number, idempotencyBase: string): Promise<void>;
/**
 * Pilot auto-upgrade per PDF:
 * - Cycle 1: owner already received slot-1 payment; NO additional payout on completion
 * - Cycles 2–3: auto-upgrade to next package (no incentive on auto-upgrade)
 * - Cycle 4+: wallet credit to owner
 */
export declare function handlePilotAutoUpgrade(tx: TransactionClient, userId: string, packageLevel: number, cyclesCompleted: number, idempotencyBase: string, sponsorId?: string): Promise<void>;
/** Manual pilot upgrade — applies 1 DAI incentive */
export declare function handlePilotManualUpgrade(tx: TransactionClient, userId: string, sponsorId: string, packageLevel: number, referenceId: string): Promise<void>;
//# sourceMappingURL=auto-upgrade.engine.d.ts.map