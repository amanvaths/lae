import { Decimal } from "@prisma/client/runtime/library";
/** Convert Prisma rows (BigInt, Date, Decimal) into JSON-safe values for Fastify responses. */
export function serializeForJson(value) {
    if (value === null || value === undefined)
        return value;
    if (typeof value === "bigint")
        return value.toString();
    if (value instanceof Date)
        return value.toISOString();
    if (Decimal.isDecimal(value))
        return value.toString();
    if (Array.isArray(value))
        return value.map((item) => serializeForJson(item));
    if (typeof value === "object") {
        const out = {};
        for (const [key, val] of Object.entries(value)) {
            out[key] = serializeForJson(val);
        }
        return out;
    }
    return value;
}
//# sourceMappingURL=serialize.js.map