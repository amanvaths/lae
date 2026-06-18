import type { TransactionClient } from "../lib/prisma.js";
import type { MatrixType } from "@prisma/client";
/**
 * Auto-place rebirth owner back into the matrix network under their sponsor.
 * Ensures rebirth entries participate in spillover/direct placement and BFS discovery.
 */
export declare function autoPlaceRebirthInNetwork(tx: TransactionClient, ownerId: string, packageLevel: number, matrixType: MatrixType, rebirthMatrixId: string): Promise<void>;
//# sourceMappingURL=rebirth-placement.engine.d.ts.map