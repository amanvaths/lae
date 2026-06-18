import type { TransactionClient } from "../lib/prisma.js";
import type { MatrixType } from "@prisma/client";
import { placeInClubMatrix } from "./placement.engine.js";
import { placeInPilotMatrix } from "./pilot.engine.js";

/**
 * Auto-place rebirth owner back into the matrix network under their sponsor.
 * Ensures rebirth entries participate in spillover/direct placement and BFS discovery.
 */
export async function autoPlaceRebirthInNetwork(
  tx: TransactionClient,
  ownerId: string,
  packageLevel: number,
  matrixType: MatrixType,
  rebirthMatrixId: string
): Promise<void> {
  const owner = await tx.user.findUnique({
    where: { id: ownerId },
    select: { sponsorId: true },
  });

  if (!owner?.sponsorId) return;

  const idempotencyKey = `rebirth-placement:${rebirthMatrixId}`;

  const existing = await tx.matrixPlacement.findFirst({
    where: { idempotencyKey },
  });
  if (existing) return;

  if (matrixType === "CLUB") {
    await placeInClubMatrix(tx, {
      userId: ownerId,
      sponsorId: owner.sponsorId,
      packageLevel,
      isRebirth: true,
      rebirthMatrixId,
      idempotencyKey,
    });
  } else {
    await placeInPilotMatrix(tx, ownerId, owner.sponsorId, packageLevel, {
      isRebirth: true,
      rebirthMatrixId,
      idempotencyKey,
    });
  }
}
