import { CLUB_POSITIONS } from "../config/packages.js";
/**
 * BFS spillover engine — finds the next available position in the sponsor's downline tree.
 * Fills positions in order: LEFT → RIGHT → LEFT_CHILD → RIGHT_CHILD
 */
export function findNextAvailablePosition(nodes) {
    const queue = [...nodes];
    while (queue.length > 0) {
        const node = queue.shift();
        for (const position of CLUB_POSITIONS) {
            if (!node.filledPositions.has(position)) {
                return { matrixId: node.matrixId, position: position };
            }
        }
    }
    return null;
}
export function getNextClubPosition(filledCount) {
    if (filledCount >= CLUB_POSITIONS.length)
        return null;
    return CLUB_POSITIONS[filledCount];
}
export function getNextPilotPosition(filledCount) {
    const positions = ["SLOT_1", "SLOT_2"];
    if (filledCount >= positions.length)
        return null;
    return positions[filledCount];
}
//# sourceMappingURL=spillover.engine.js.map