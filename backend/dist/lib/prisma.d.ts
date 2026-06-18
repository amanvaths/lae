import { PrismaClient } from "@prisma/client";
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
//# sourceMappingURL=prisma.d.ts.map