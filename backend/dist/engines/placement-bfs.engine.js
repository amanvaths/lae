import { findNextAvailablePosition } from "./spillover.engine.js";
export async function findSpilloverPlacement(tx, sponsorId, packageLevel) {
    const sponsorMatrices = await tx.clubMatrix.findMany({
        where: {
            ownerId: sponsorId,
            packageLevel,
            status: "ACTIVE",
        },
        include: { placements: true },
        orderBy: { createdAt: "asc" },
    });
    const bfsQueue = sponsorMatrices.map((m) => ({
        matrixId: m.id,
        ownerId: m.ownerId,
        filledPositions: new Set(m.placements.map((p) => p.position)),
    }));
    const visited = new Set();
    const queue = [...bfsQueue];
    while (queue.length > 0) {
        const node = queue.shift();
        if (visited.has(node.matrixId))
            continue;
        visited.add(node.matrixId);
        const result = findNextAvailablePosition([node]);
        if (result) {
            return {
                matrixId: result.matrixId,
                position: result.position,
                spilloverFrom: node.ownerId,
            };
        }
        const downlineMatrices = await tx.clubMatrix.findMany({
            where: {
                ownerId: { in: await getDownlineUserIds(tx, node.ownerId, packageLevel) },
                packageLevel,
                status: "ACTIVE",
            },
            include: { placements: true },
            orderBy: { createdAt: "asc" },
        });
        for (const m of downlineMatrices) {
            if (!visited.has(m.id)) {
                queue.push({
                    matrixId: m.id,
                    ownerId: m.ownerId,
                    filledPositions: new Set(m.placements.map((p) => p.position)),
                });
            }
        }
    }
    return null;
}
async function getDownlineUserIds(tx, ownerId, packageLevel) {
    const placements = await tx.matrixPlacement.findMany({
        where: {
            clubMatrix: { ownerId, packageLevel },
        },
        select: { userId: true },
    });
    return placements.map((p) => p.userId);
}
export async function buildSpilloverTree(tx, rootUserId, packageLevel, maxDepth = 50) {
    const nodes = [];
    const queue = [{ userId: rootUserId, depth: 0 }];
    const visited = new Set();
    while (queue.length > 0) {
        const { userId, depth } = queue.shift();
        if (depth > maxDepth || visited.has(userId))
            continue;
        visited.add(userId);
        const matrices = await tx.clubMatrix.findMany({
            where: { ownerId: userId, packageLevel, status: "ACTIVE" },
            include: { placements: true },
        });
        for (const m of matrices) {
            nodes.push({
                matrixId: m.id,
                ownerId: m.ownerId,
                filledPositions: new Set(m.placements.map((p) => p.position)),
            });
        }
        const referrals = await tx.user.findMany({
            where: { sponsorId: userId },
            select: { id: true },
        });
        for (const r of referrals) {
            queue.push({ userId: r.id, depth: depth + 1 });
        }
    }
    return nodes;
}
//# sourceMappingURL=placement-bfs.engine.js.map