import type { TransactionClient } from "../lib/prisma.js";
export declare function createStake(tx: TransactionClient, userId: string, amount: number, round?: number): Promise<string>;
export declare function assertStakingEligibility(tx: TransactionClient, userId: string, amount: number): Promise<void>;
export declare function completeMaturedStakes(tx: TransactionClient): Promise<number>;
//# sourceMappingURL=staking.engine.d.ts.map