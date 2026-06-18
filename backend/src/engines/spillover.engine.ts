import type { MatrixPosition } from "@prisma/client";
import { CLUB_POSITIONS } from "../config/packages.js";

export interface BfsNode {
  matrixId: string;
  ownerId: string;
  filledPositions: Set<MatrixPosition>;
}

/**
 * BFS spillover engine — finds the next available position in the sponsor's downline tree.
 * Fills positions in order: LEFT → RIGHT → LEFT_CHILD → RIGHT_CHILD
 */
export function findNextAvailablePosition(
  nodes: BfsNode[]
): { matrixId: string; position: MatrixPosition } | null {
  const queue = [...nodes];

  while (queue.length > 0) {
    const node = queue.shift()!;

    for (const position of CLUB_POSITIONS) {
      if (!node.filledPositions.has(position as MatrixPosition)) {
        return { matrixId: node.matrixId, position: position as MatrixPosition };
      }
    }
  }

  return null;
}

export function getNextClubPosition(
  filledCount: number
): MatrixPosition | null {
  if (filledCount >= CLUB_POSITIONS.length) return null;
  return CLUB_POSITIONS[filledCount] as MatrixPosition;
}

export function getNextPilotPosition(
  filledCount: number
): MatrixPosition | null {
  const positions = ["SLOT_1", "SLOT_2"] as const;
  if (filledCount >= positions.length) return null;
  return positions[filledCount] as MatrixPosition;
}
