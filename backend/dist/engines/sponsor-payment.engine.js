import { creditWallet, appendLedgerEntry } from "./income.engine.js";
import { calcSponsorPaymentAmount, getSponsorPaymentConfig, } from "../services/admin-config.service.js";
import { getClubPackageAmount, getPilotPackageAmount, } from "../config/packages.js";
import { incomeIdempotencyKey } from "../lib/idempotency.js";
/**
 * Marketing-cycle sponsor payment — configurable % of package to direct sponsor on purchase.
 * Tracked in IncomeLedger with SPONSOR_PAYMENT type.
 */
export async function distributeSponsorPayment(tx, buyerUserId, sponsorId, packageLevel, matrixType, purchaseRef) {
    const config = await getSponsorPaymentConfig(tx);
    const packageAmount = matrixType === "CLUB"
        ? getClubPackageAmount(packageLevel)
        : getPilotPackageAmount(packageLevel);
    const amount = calcSponsorPaymentAmount(config, matrixType, packageAmount);
    if (amount <= 0)
        return 0;
    const idempotencyKey = incomeIdempotencyKey("SPONSOR_PAYMENT", purchaseRef, `${sponsorId}-${packageLevel}`);
    await creditWallet(tx, {
        userId: sponsorId,
        amount,
        type: "SPONSOR_PAYMENT",
        packageLevel,
        matrixType,
        sourceUserId: buyerUserId,
        idempotencyKey,
    });
    await appendLedgerEntry(tx, {
        userId: sponsorId,
        amount,
        type: "SPONSOR_PAYMENT",
        packageLevel,
        matrixType,
        sourceUserId: buyerUserId,
        idempotencyKey: `ledger-${idempotencyKey}`,
        metadata: { purchaseRef, configPercent: matrixType === "CLUB" ? config.clubPercent : config.pilotPercent },
    });
    return amount;
}
//# sourceMappingURL=sponsor-payment.engine.js.map