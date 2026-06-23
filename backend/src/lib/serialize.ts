import { Decimal } from "@prisma/client/runtime/library";

/** Convert Prisma rows (BigInt, Date, Decimal) into JSON-safe values for Fastify responses. */
export function serializeForJson<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString() as T;
  if (value instanceof Date) return value.toISOString() as T;
  if (Decimal.isDecimal(value)) return value.toString() as T;
  if (Array.isArray(value)) return value.map((item) => serializeForJson(item)) as T;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = serializeForJson(val);
    }
    return out as T;
  }
  return value;
}
