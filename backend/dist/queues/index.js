import { Queue, Worker } from "bullmq";
import { bullmqConnection } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { runMatrixTransaction } from "../lib/transaction.js";
import { executePackagePurchase, executeClubPlacement } from "../services/matrix-orchestrator.service.js";
import { placeInPilotMatrix } from "../engines/pilot.engine.js";
import { debitWithdrawable } from "../engines/income.engine.js";
import { completeMaturedStakes } from "../engines/staking.engine.js";
import { withdrawalIdempotencyKey, withIdempotency } from "../lib/idempotency.js";
import { lockWithdrawal } from "../lib/row-lock.js";
import { invalidateUserCaches, invalidateLeaderboardCache } from "../lib/cache.js";
import { emitToUser } from "../socket/index.js";
const connection = bullmqConnection;
/** All background job queues backed by Redis + BullMQ */
export const placementQueue = new Queue("placement", { connection });
export const rebirthQueue = new Queue("rebirth", { connection });
export const autoUpgradeQueue = new Queue("auto-upgrade", { connection });
export const incomeQueue = new Queue("income-distribution", { connection });
export const withdrawQueue = new Queue("withdrawal", { connection });
export const notificationQueue = new Queue("notification", { connection });
export const purchaseQueue = new Queue("package-purchase", { connection });
export function startWorkers() {
    const workers = [];
    workers.push(new Worker("placement", async (job) => {
        const { userId, sponsorId, packageLevel, matrixType, idempotencyKey } = job.data;
        await runMatrixTransaction(async (tx) => {
            if (matrixType === "CLUB") {
                await executeClubPlacement(tx, userId, sponsorId, packageLevel, idempotencyKey);
            }
            else {
                await placeInPilotMatrix(tx, userId, sponsorId, packageLevel);
            }
        });
        await notificationQueue.add("notify", {
            userId,
            event: "placement_complete",
            payload: { packageLevel, matrixType },
        });
        await invalidateUserCaches(userId);
    }, { connection, concurrency: 5 }));
    workers.push(new Worker("package-purchase", async (job) => {
        await executePackagePurchase(job.data);
        await notificationQueue.add("notify", {
            userId: job.data.sponsorId,
            event: "new_referral",
            payload: {
                referralUserId: job.data.userId,
                packageLevel: job.data.packageLevel,
                matrixType: job.data.matrixType,
            },
        });
        await invalidateLeaderboardCache();
    }, { connection, concurrency: 3 }));
    workers.push(new Worker("withdrawal", async (job) => {
        const { withdrawalId, userId, amount } = job.data;
        const idempotencyKey = withdrawalIdempotencyKey(withdrawalId);
        await runMatrixTransaction(async (tx) => {
            await withIdempotency(tx, idempotencyKey, "WITHDRAWAL", async () => {
                await lockWithdrawal(tx, withdrawalId);
                const withdrawal = await tx.withdrawalRequest.findUniqueOrThrow({
                    where: { id: withdrawalId },
                });
                if (withdrawal.status === "CONFIRMED")
                    return withdrawal;
                await debitWithdrawable(tx, userId, amount, idempotencyKey);
                return tx.withdrawalRequest.update({
                    where: { id: withdrawalId },
                    data: { status: "CONFIRMED", processedAt: new Date() },
                });
            });
        });
        await notificationQueue.add("notify", {
            userId,
            event: "withdraw_approved",
            payload: { withdrawalId, amount },
        });
        await invalidateUserCaches(userId);
        await invalidateLeaderboardCache();
    }, { connection, concurrency: 2 }));
    workers.push(new Worker("income-distribution", async () => {
        await runMatrixTransaction(async (tx) => {
            await completeMaturedStakes(tx);
        });
    }, { connection, concurrency: 1 }));
    workers.push(new Worker("rebirth", async (_job) => {
        // Rebirth is handled atomically inside cycle completion transaction.
        // This queue handles deferred rebirth notifications / cache invalidation.
        await invalidateLeaderboardCache();
    }, { connection, concurrency: 2 }));
    workers.push(new Worker("auto-upgrade", async (_job) => {
        // Auto-upgrade runs atomically inside cycle completion transaction.
        await invalidateLeaderboardCache();
    }, { connection, concurrency: 2 }));
    workers.push(new Worker("notification", async (job) => {
        const { userId, event, payload } = job.data;
        await prisma.notification.create({
            data: { userId, event, payload: payload },
        });
        emitToUser(userId, event, payload);
    }, { connection, concurrency: 10 }));
    return workers;
}
// Legacy alias for blockchain service
export const rewardQueue = purchaseQueue;
//# sourceMappingURL=index.js.map