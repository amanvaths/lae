import type { TransactionClient } from "../lib/prisma.js";
import type { MatrixPosition } from "@prisma/client";
import { type BfsNode } from "./spillover.engine.js";
export declare function findSpilloverPlacement(tx: TransactionClient, sponsorId: string, packageLevel: number): Promise<{
    matrixId: string;
    position: MatrixPosition;
    spilloverFrom: string;
} | null>;
export declare function buildSpilloverTree(tx: TransactionClient, rootUserId: string, packageLevel: number, maxDepth?: number): Promise<BfsNode[]>;
//# sourceMappingURL=placement-bfs.engine.d.ts.map