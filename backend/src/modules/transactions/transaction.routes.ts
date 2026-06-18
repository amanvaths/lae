import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { purchaseSchema, withdrawSchema } from "../../validators/schemas.js";
import { processBlockchainDeposit, initiateWithdrawTransfer } from "../blockchain/blockchain.service.js";
import { withdrawQueue } from "../../queues/index.js";
import { config } from "../../config/index.js";
import { AppError } from "../../utils/helpers.js";
import {
  getClubPackageAmount,
  getPilotPackageAmount,
  CLUB_PACKAGES,
  PILOT_PACKAGES,
} from "../../config/packages.js";

export async function transactionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/packages", {
    schema: { tags: ["Packages"] },
  }, async () => ({
    club: CLUB_PACKAGES.map((amount, i) => ({ level: i + 1, amount })),
    pilot: PILOT_PACKAGES.map((amount, i) => ({ level: i + 1, amount })),
  }));

  app.post("/purchase", {
    preHandler: [app.authenticate],
    schema: { tags: ["Transactions"] },
  }, async (request, reply) => {
    const body = purchaseSchema.parse(request.body);
    const userId = request.userId!;

    const expectedAmount =
      body.matrixType === "CLUB"
        ? getClubPackageAmount(body.packageLevel)
        : getPilotPackageAmount(body.packageLevel);

    await processBlockchainDeposit(
      userId,
      body.txHash,
      expectedAmount,
      body.packageLevel,
      body.matrixType
    );

    return reply.status(202).send({
      message: "Purchase queued for processing",
      packageLevel: body.packageLevel,
      matrixType: body.matrixType,
    });
  });

  app.post("/withdraw", {
    preHandler: [app.authenticate],
    schema: { tags: ["Transactions"] },
  }, async (request, reply) => {
    const body = withdrawSchema.parse(request.body);
    const userId = request.userId!;

    if (body.amount < config.minWithdrawDai) {
      throw new AppError(400, `Minimum withdrawal is ${config.minWithdrawDai} DAI`);
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const wallet = await prisma.wallet.findUnique({ where: { userId } });

    if (!wallet || Number(wallet.withdrawableBalance) < body.amount) {
      throw new AppError(400, "Insufficient withdrawable balance");
    }

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount: body.amount,
        walletAddress: user.walletAddress,
        status: "PENDING",
      },
    });

    await withdrawQueue.add("process", {
      withdrawalId: withdrawal.id,
      userId,
      amount: body.amount,
      walletAddress: user.walletAddress,
    });

    initiateWithdrawTransfer(user.walletAddress, body.amount).then(async (txHash) => {
      if (txHash) {
        await prisma.withdrawalRequest.update({
          where: { id: withdrawal.id },
          data: { txHash },
        });
      }
    }).catch(console.error);

    return reply.status(202).send({ withdrawalId: withdrawal.id, status: "PENDING" });
  });

  app.get("/withdrawals", {
    preHandler: [app.authenticate],
    schema: { tags: ["Transactions"] },
  }, async (request) => {
    return prisma.withdrawalRequest.findMany({
      where: { userId: request.userId! },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  });

  app.get("/deposits", {
    preHandler: [app.authenticate],
    schema: { tags: ["Transactions"] },
  }, async (request) => {
    return prisma.blockchainTransaction.findMany({
      where: { userId: request.userId!, type: "DEPOSIT" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  });
}
