import type { MatrixPosition } from "@prisma/client";
export interface BfsNode {
    matrixId: string;
    ownerId: string;
    filledPositions: Set<MatrixPosition>;
}
/**
 * BFS spillover engine — finds the next available position in the sponsor's downline tree.
 * Fills positions in order: LEFT → RIGHT → LEFT_CHILD → RIGHT_CHILD
 */
export declare function findNextAvailablePosition(nodes: BfsNode[]): {
    matrixId: string;
    position: MatrixPosition;
} | null;
export declare function getNextClubPosition(filledCount: number): MatrixPosition | null;
export declare function getNextPilotPosition(filledCount: number): MatrixPosition | null;
//# sourceMappingURL=spillover.engine.d.ts.map