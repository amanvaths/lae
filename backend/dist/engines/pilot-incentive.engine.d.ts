import type { TransactionClient } from "../lib/prisma.js";
export interface PilotIncentiveInput {
    buyerUserId: string;
    sponsorId: string;
    packageLevel: number;
    isManual: boolean;
    source: "purchase" | "manual_upgrade";
    referenceId: string;
}
/**
 * Route 1 DAI incentive on manual Pilot purchases/upgrades only.
 * Auto-upgrades pass isManual=false and skip incentive.
 */
export declare function routePilotIncentive(tx: TransactionClient, input: PilotIncentiveInput): Promise<{
    routed: boolean;
    recipientId?: string;
    amount: number;
}>;
//# sourceMappingURL=pilot-incentive.engine.d.ts.map