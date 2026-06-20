import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/helpers.js";

const DISABLED =
  "Legacy Senso purchase/withdraw routes are disabled. Matrix and payouts run on-chain via LAEClubMatrix.";

/** @deprecated Not registered in app.ts — kept for reference only. */
export async function transactionRoutes(app: FastifyInstance): Promise<void> {
  app.post("/purchase", async () => {
    throw new AppError(410, DISABLED, "LEGACY_DISABLED");
  });

  app.post("/withdraw", async () => {
    throw new AppError(410, DISABLED, "LEGACY_DISABLED");
  });

  app.get("/packages", async () => ({
    message: DISABLED,
    club: [],
    pilot: [],
  }));
}
