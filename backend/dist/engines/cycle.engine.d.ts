import type { TransactionClient } from "../lib/prisma.js";
export declare function processClubCycleCompletion(tx: TransactionClient, matrixId: string): Promise<void>;
export declare function processPilotCycleCompletion(tx: TransactionClient, matrixId: string, secondSlotUserId: string): Promise<void>;
export declare function processPilotFirstSlot(tx: TransactionClient, matrixId: string, slotUserId: string): Promise<void>;
//# sourceMappingURL=cycle.engine.d.ts.map