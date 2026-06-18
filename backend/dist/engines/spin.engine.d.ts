import type { TransactionClient } from "../lib/prisma.js";
import type { SpinRewardType } from "@prisma/client";
export declare function grantSpinCouponsForQualifiedReferral(tx: TransactionClient, sponsorId: string, referralUserId: string): Promise<number>;
export declare function pickSpinReward(): {
    type: SpinRewardType;
    amount: number;
};
export declare function executeSpin(tx: TransactionClient, userId: string, couponId: string): Promise<{
    rewardType: SpinRewardType;
    tokenAmount: number;
}>;
//# sourceMappingURL=spin.engine.d.ts.map