import type { TransactionClient } from "./prisma.js";
/** Row-level lock: club matrix — prevents concurrent placement / cycle race */
export declare function lockClubMatrix(tx: TransactionClient, matrixId: string): Promise<void>;
/** Row-level lock: pilot matrix */
export declare function lockPilotMatrix(tx: TransactionClient, matrixId: string): Promise<void>;
/** Row-level lock: user wallet — prevents double payout / double withdraw */
export declare function lockWallet(tx: TransactionClient, userId: string): Promise<void>;
/** Row-level lock: user club package */
export declare function lockClubPackage(tx: TransactionClient, userId: string, packageLevel: number): Promise<void>;
/** Row-level lock: withdrawal request */
export declare function lockWithdrawal(tx: TransactionClient, withdrawalId: string): Promise<void>;
//# sourceMappingURL=row-lock.d.ts.map