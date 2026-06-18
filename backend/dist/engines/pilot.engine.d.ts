import type { TransactionClient } from "../lib/prisma.js";
import type { MatrixPosition } from "@prisma/client";
export interface PilotPlacementOptions {
    isRebirth?: boolean;
    rebirthMatrixId?: string;
    idempotencyKey?: string;
}
export declare function placeInPilotMatrix(tx: TransactionClient, userId: string, sponsorId: string, packageLevel: number, options?: PilotPlacementOptions): Promise<{
    matrixId: string;
    position: MatrixPosition;
}>;
export declare function createPilotMatrixForOwner(tx: TransactionClient, ownerId: string, packageLevel: number): Promise<string>;
//# sourceMappingURL=pilot.engine.d.ts.map