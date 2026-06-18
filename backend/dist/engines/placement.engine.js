import { getNextClubPosition } from "./spillover.engine.js";
import { findSpilloverPlacement } from "./placement-bfs.engine.js";
import { processClubCycleCompletion } from "./cycle.engine.js";
import { AppError } from "../utils/helpers.js";
import { lockClubMatrix } from "../lib/row-lock.js";
import { placementIdempotencyKey } from "../lib/idempotency.js";
export async function placeInClubMatrix(tx, input) {
    const idempotencyKey = input.idempotencyKey ?? placementIdempotencyKey(input.userId, "CLUB", input.packageLevel);
    const existingPlacement = await tx.matrixPlacement.findFirst({
        where: { idempotencyKey },
    });
    if (existingPlacement) {
        return {
            matrixId: existingPlacement.matrixId,
            position: existingPlacement.position,
            placementType: existingPlacement.placementType,
        };
    }
    if (!input.isRebirth) {
        const existing = await tx.matrixPlacement.findFirst({
            where: {
                userId: input.userId,
                matrixType: "CLUB",
                clubMatrix: { packageLevel: input.packageLevel, deletedAt: null },
            },
        });
        if (existing) {
            throw new AppError(409, "User already placed in this club package level", "DUPLICATE_PLACEMENT");
        }
    }
    const sponsorMatrix = await tx.clubMatrix.findFirst({
        where: {
            ownerId: input.sponsorId,
            packageLevel: input.packageLevel,
            status: "ACTIVE",
            deletedAt: null,
        },
        include: { placements: true },
        orderBy: { createdAt: "asc" },
    });
    let matrixId;
    let position;
    let placementType = input.placementType ?? "DIRECT";
    let spilloverFrom = null;
    if (sponsorMatrix && sponsorMatrix.slotsFilled < 4) {
        matrixId = sponsorMatrix.id;
        await lockClubMatrix(tx, matrixId);
        const locked = await tx.clubMatrix.findUniqueOrThrow({ where: { id: matrixId } });
        const nextPos = getNextClubPosition(locked.slotsFilled);
        if (!nextPos) {
            throw new AppError(500, "Matrix appears full but slotsFilled < 4");
        }
        position = nextPos;
        placementType = "DIRECT";
    }
    else {
        const spillover = await findSpilloverPlacement(tx, input.sponsorId, input.packageLevel);
        if (!spillover) {
            throw new AppError(404, "No available spillover position found", "NO_SPILLOVER");
        }
        matrixId = spillover.matrixId;
        position = spillover.position;
        placementType = "SPILLOVER";
        spilloverFrom = spillover.spilloverFrom;
        await lockClubMatrix(tx, matrixId);
    }
    await tx.matrixPlacement.create({
        data: {
            matrixId,
            matrixType: "CLUB",
            userId: input.userId,
            position,
            placementType,
            spilloverFrom,
            sponsorId: input.sponsorId,
            idempotencyKey,
        },
    });
    await logMatrixOperation(tx, input.userId, input.isRebirth ? "REBIRTH" : "PLACEMENT", "CLUB", matrixId, input.packageLevel, idempotencyKey, {
        position,
        placementType,
        isRebirth: input.isRebirth ?? false,
        rebirthMatrixId: input.rebirthMatrixId,
    });
    const updated = await tx.clubMatrix.update({
        where: { id: matrixId },
        data: { slotsFilled: { increment: 1 }, version: { increment: 1 } },
        include: { owner: true },
    });
    if (updated.slotsFilled >= 4) {
        await processClubCycleCompletion(tx, updated.id);
    }
    return { matrixId, position, placementType };
}
export async function createClubMatrixForOwner(tx, ownerId, packageLevel, isRebirth = false, parentMatrixId) {
    const matrix = await tx.clubMatrix.create({
        data: {
            ownerId,
            packageLevel,
            isRebirth,
            parentMatrixId,
            status: "ACTIVE",
        },
    });
    return matrix.id;
}
async function logMatrixOperation(tx, userId, operation, matrixType, matrixId, packageLevel, idempotencyKey, payload) {
    const existing = await tx.matrixOperationLog.findUnique({ where: { idempotencyKey } });
    if (existing)
        return;
    await tx.matrixOperationLog.create({
        data: {
            userId,
            operation,
            matrixType,
            matrixId,
            packageLevel,
            idempotencyKey,
            payload,
        },
    });
}
export { logMatrixOperation };
//# sourceMappingURL=placement.engine.js.map