import type { FastifyInstance } from "fastify";
import { getLaeUserEvents, getLaeUserIncome } from "./lae-user.service.js";

function walletFromQuery(query: Record<string, unknown>): string | null {
  const w = query.wallet ?? query.address;
  if (typeof w === "string" && w.startsWith("0x") && w.length === 42) {
    return w.toLowerCase();
  }
  return null;
}

/** Public read-only LAE user analytics from indexer DB */
export async function laeUserRoutes(app: FastifyInstance): Promise<void> {
  app.get("/lae/events", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required (0x…)" });
    const limit = Number((request.query as { limit?: string }).limit ?? 150);
    const events = await getLaeUserEvents(wallet, limit);
    return { events, source: "indexer" };
  });

  app.get("/lae/income", async (request, reply) => {
    const wallet = walletFromQuery(request.query as Record<string, unknown>);
    if (!wallet) return reply.code(400).send({ error: "wallet query required (0x…)" });
    const q = request.query as { kind?: string; limit?: string };
    const kind = q.kind === "matrix" || q.kind === "royal" ? q.kind : undefined;
    const limit = Number(q.limit ?? 100);
    const incomes = await getLaeUserIncome(wallet, kind, limit);
    return { incomes, source: "indexer" };
  });
}
