import { createClubMatrixForOwner } from "./placement.engine.js";
import { rebirthIdempotencyKey } from "../lib/idempotency.js";
import { withIdempotency } from "../lib/idempotency.js";
import { autoPlaceRebirthInNetwork } from "./rebirth-placement.engine.js";
export async function createClubRebirth(tx, ownerId, packageLevel, parentMatrixId, _reinvestAmount) {
    const parent = await tx.clubMatrix.findUniqueOrThrow({ where: { id: parentMatrixId } });
    const cycleNumber = parent.cycleNumber + 1;
    const idempotencyKey = rebirthIdempotencyKey(parentMatrixId, cycleNumber);
    return withIdempotency(tx, idempotencyKey, "REBIRTH_CREATION", async () => {
        const rebirthMatrixId = await createClubMatrixForOwner(tx, ownerId, packageLevel, true, parentMatrixId);
        await tx.clubMatrix.update({
            where: { id: rebirthMatrixId },
            data: { cycleNumber },
        });
        await autoPlaceRebirthInNetwork(tx, ownerId, packageLevel, "CLUB", rebirthMatrixId);
        await tx.matrixOperationLog.create({
            data: {
                userId: ownerId,
                operation: "REBIRTH",
                matrixType: "CLUB",
                matrixId: rebirthMatrixId,
                packageLevel,
                idempotencyKey: `${idempotencyKey}-log`,
                payload: { parentMatrixId, cycleNumber, autoPlaced: true },
            },
        });
        return rebirthMatrixId;
    });
}
export async function createPilotRebirth(tx, ownerId, packageLevel, parentMatrixId) {
    const parent = await tx.pilotMatrix.findUniqueOrThrow({ where: { id: parentMatrixId } });
    const cycleNumber = parent.cycleNumber + 1;
    const idempotencyKey = rebirthIdempotencyKey(parentMatrixId, cycleNumber);
    return withIdempotency(tx, idempotencyKey, "REBIRTH_CREATION", async () => {
        const matrix = await tx.pilotMatrix.create({
            data: {
                ownerId,
                packageLevel,
                isRebirth: true,
                parentMatrixId,
                cycleNumber,
                status: "ACTIVE",
            },
        });
        await tx.pilotSlot.createMany({
            data: [
                { matrixId: matrix.id, position: "SLOT_1" },
                { matrixId: matrix.id, position: "SLOT_2" },
            ],
        });
        await autoPlaceRebirthInNetwork(tx, ownerId, packageLevel, "PILOT", matrix.id);
        await tx.matrixOperationLog.create({
            data: {
                userId: ownerId,
                operation: "REBIRTH",
                matrixType: "PILOT",
                matrixId: matrix.id,
                packageLevel,
                idempotencyKey: `${idempotencyKey}-log`,
                payload: { parentMatrixId, cycleNumber, autoPlaced: true },
            },
        });
        return matrix.id;
    });
}
//# sourceMappingURL=rebirth.engine.js.map