import type { MatrixType } from "@prisma/client";
import type { TransactionClient } from "../lib/prisma.js";
export interface PurchaseInput {
    userId: string;
    sponsorId: string;
    packageLevel: number;
    matrixType: MatrixType;
    txHash?: string;
    isManual?: boolean;
}
/**
 * Atomic package purchase — single Serializable transaction.
 * Rolls back entirely on any failure (placement, income, rebirth, upgrade, tokens).
 */
export declare function executePackagePurchase(input: PurchaseInput): Promise<void>;
export declare function executeClubPlacement(tx: TransactionClient, userId: string, sponsorId: string, packageLevel: number, idempotencyKey?: string): Promise<{
    matrixId: string;
    position: import("@prisma/client").MatrixPosition;
    placementType: import("@prisma/client").PlacementType;
}>;
//# sourceMappingURL=matrix-orchestrator.service.d.ts.map