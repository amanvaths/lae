import type { TransactionClient } from "../lib/prisma.js";
import type { MatrixType } from "@prisma/client";
/**
 * Marketing-cycle sponsor payment — configurable % of package to direct sponsor on purchase.
 * Tracked in IncomeLedger with SPONSOR_PAYMENT type.
 */
export declare function distributeSponsorPayment(tx: TransactionClient, buyerUserId: string, sponsorId: string, packageLevel: number, matrixType: MatrixType, purchaseRef: string): Promise<number>;
//# sourceMappingURL=sponsor-payment.engine.d.ts.map