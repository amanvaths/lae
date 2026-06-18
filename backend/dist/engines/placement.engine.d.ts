import type { Prisma } from "@prisma/client";
import type { TransactionClient } from "../lib/prisma.js";
import type { MatrixType, MatrixOperationType } from "@prisma/client";
export interface ClubPlacementInput {
    userId: string;
    sponsorId: string;
    packageLevel: number;
    placementType?: import("@prisma/client").PlacementType;
    idempotencyKey?: string;
    isRebirth?: boolean;
    rebirthMatrixId?: string;
}
export declare function placeInClubMatrix(tx: TransactionClient, input: ClubPlacementInput): Promise<{
    matrixId: string;
    position: import("@prisma/client").MatrixPosition;
    placementType: import("@prisma/client").PlacementType;
}>;
export declare function createClubMatrixForOwner(tx: TransactionClient, ownerId: string, packageLevel: number, isRebirth?: boolean, parentMatrixId?: string): Promise<string>;
declare function logMatrixOperation(tx: TransactionClient, userId: string, operation: MatrixOperationType, matrixType: MatrixType, matrixId: string, packageLevel: number, idempotencyKey: string, payload: Prisma.InputJsonValue): Promise<void>;
export { logMatrixOperation };
//# sourceMappingURL=placement.engine.d.ts.map