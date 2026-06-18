import { getNextPilotPosition } from "./spillover.engine.js";
import { processPilotFirstSlot, processPilotCycleCompletion } from "./cycle.engine.js";
import { AppError } from "../utils/helpers.js";
import { lockPilotMatrix } from "../lib/row-lock.js";
import { placementIdempotencyKey } from "../lib/idempotency.js";
export async function placeInPilotMatrix(tx, userId, sponsorId, packageLevel, options = {}) {
    const idempotencyKey = options.idempotencyKey ?? placementIdempotencyKey(userId, "PILOT", packageLevel);
    if (!options.isRebirth) {
        const existing = await tx.pilotSlot.findFirst({
            where: { userId, matrix: { packageLevel } },
        });
        if (existing) {
            throw new AppError(409, "User already placed in this pilot package", "DUPLICATE_PLACEMENT");
        }
    }
    else {
        const existingRebirth = await tx.pilotSlot.findFirst({
            where: { userId, matrix: { packageLevel }, idempotencyKey },
        });
        if (existingRebirth) {
            return { matrixId: existingRebirth.matrixId, position: existingRebirth.position };
        }
    }
    const sponsorMatrix = await tx.pilotMatrix.findFirst({
        where: { ownerId: sponsorId, packageLevel, status: "ACTIVE", deletedAt: null },
        include: { slots: true },
        orderBy: { createdAt: "asc" },
    });
    if (!sponsorMatrix || sponsorMatrix.slotsFilled >= 2) {
        const spilloverMatrix = await findPilotSpillover(tx, sponsorId, packageLevel);
        if (!spilloverMatrix) {
            throw new AppError(404, "No available pilot matrix position", "NO_PILOT_SLOT");
        }
        return fillPilotSlot(tx, spilloverMatrix.id, userId, sponsorId, "SPILLOVER", idempotencyKey);
    }
    return fillPilotSlot(tx, sponsorMatrix.id, userId, sponsorId, "DIRECT", idempotencyKey);
}
async function findPilotSpillover(tx, sponsorId, packageLevel) {
    const queue = [sponsorId];
    const visited = new Set();
    while (queue.length > 0) {
        const userId = queue.shift();
        if (visited.has(userId))
            continue;
        visited.add(userId);
        const matrices = await tx.pilotMatrix.findMany({
            where: { ownerId: userId, packageLevel, status: "ACTIVE", slotsFilled: { lt: 2 }, deletedAt: null },
            orderBy: { createdAt: "asc" },
        });
        if (matrices.length > 0)
            return matrices[0];
        const referrals = await tx.user.findMany({
            where: { sponsorId: userId, deletedAt: null },
            select: { id: true },
        });
        queue.push(...referrals.map((r) => r.id));
    }
    return null;
}
async function fillPilotSlot(tx, matrixId, userId, _sponsorId, placementType, idempotencyKey) {
    await lockPilotMatrix(tx, matrixId);
    const matrix = await tx.pilotMatrix.findUniqueOrThrow({
        where: { id: matrixId },
        include: { slots: true },
    });
    const nextPos = getNextPilotPosition(matrix.slotsFilled);
    if (!nextPos) {
        throw new AppError(500, "Pilot matrix full");
    }
    await tx.pilotSlot.updateMany({
        where: { matrixId, position: nextPos },
        data: { userId, placementType, filledAt: new Date(), idempotencyKey },
    });
    const isFirstSlot = matrix.slotsFilled === 0;
    if (isFirstSlot) {
        await processPilotFirstSlot(tx, matrixId, userId);
    }
    else {
        await processPilotCycleCompletion(tx, matrixId, userId);
    }
    return { matrixId, position: nextPos };
}
export async function createPilotMatrixForOwner(tx, ownerId, packageLevel) {
    const matrix = await tx.pilotMatrix.create({
        data: { ownerId, packageLevel, status: "ACTIVE" },
    });
    await tx.pilotSlot.createMany({
        data: [
            { matrixId: matrix.id, position: "SLOT_1" },
            { matrixId: matrix.id, position: "SLOT_2" },
        ],
    });
    return matrix.id;
}
//# sourceMappingURL=pilot.engine.js.map