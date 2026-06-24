import { getLaeUserEvents, getLaeUserIncome } from "./lae-user.service.js";
function walletFromQuery(query) {
    const w = query.wallet ?? query.address;
    if (typeof w === "string" && w.startsWith("0x") && w.length === 42) {
        return w.toLowerCase();
    }
    return null;
}
/** Public read-only LAE user analytics from indexer DB */
export async function laeUserRoutes(app) {
    app.get("/lae/events", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required (0x…)" });
        const limit = Number(request.query.limit ?? 150);
        const events = await getLaeUserEvents(wallet, limit);
        return { events, source: "indexer" };
    });
    app.get("/lae/income", async (request, reply) => {
        const wallet = walletFromQuery(request.query);
        if (!wallet)
            return reply.code(400).send({ error: "wallet query required (0x…)" });
        const q = request.query;
        const kind = q.kind === "matrix" || q.kind === "treasury" ? q.kind : undefined;
        const limit = Number(q.limit ?? 100);
        const incomes = await getLaeUserIncome(wallet, kind, limit);
        return { incomes, source: "indexer" };
    });
}
//# sourceMappingURL=lae-user.routes.js.map