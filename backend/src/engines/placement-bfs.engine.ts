import type { TransactionClient } from "../lib/prisma.js";
import type { MatrixPosition } from "@prisma/client";
import { findNextAvailablePosition, type BfsNode } from "./spillover.engine.js";

export async function findSpilloverPlacement(
  tx: TransactionClient,
  sponsorId: string,
  packageLevel: number
): Promise<{ matrixId: string; position: MatrixPosition; spilloverFrom: string } | null> {
  const sponsorMatrices = await tx.clubMatrix.findMany({
    where: {
      ownerId: sponsorId,
      packageLevel,
      status: "ACTIVE",
    },
    include: { placements: true },
    orderBy: { createdAt: "asc" },
  });

  const bfsQueue: BfsNode[] = sponsorMatrices.map((m) => ({
    matrixId: m.id,
    ownerId: m.ownerId,
    filledPositions: new Set(m.placements.map((p) => p.position)),
  }));

  const visited = new Set<string>();
  const queue = [...bfsQueue];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node.matrixId)) continue;
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

async function getDownlineUserIds(
  tx: TransactionClient,
  ownerId: string,
  packageLevel: number
): Promise<string[]> {
  const placements = await tx.matrixPlacement.findMany({
    where: {
      clubMatrix: { ownerId, packageLevel },
    },
    select: { userId: true },
  });
  return placements.map((p) => p.userId);
}

export async function buildSpilloverTree(
  tx: TransactionClient,
  rootUserId: string,
  packageLevel: number,
  maxDepth = 50
): Promise<BfsNode[]> {
  const nodes: BfsNode[] = [];
  const queue: { userId: string; depth: number }[] = [{ userId: rootUserId, depth: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { userId, depth } = queue.shift()!;
    if (depth > maxDepth || visited.has(userId)) continue;
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
