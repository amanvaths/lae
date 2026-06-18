import type { TransactionClient } from "../lib/prisma.js";
export declare function createClubRebirth(tx: TransactionClient, ownerId: string, packageLevel: number, parentMatrixId: string, _reinvestAmount: number): Promise<string>;
export declare function createPilotRebirth(tx: TransactionClient, ownerId: string, packageLevel: number, parentMatrixId: string): Promise<string>;
//# sourceMappingURL=rebirth.engine.d.ts.map