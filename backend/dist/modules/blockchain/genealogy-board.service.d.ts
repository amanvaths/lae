import type { MatrixSlotDTO } from "./matrix-tree.service.js";
export declare const GENEALOGY_MATRIX_SIZE = 14;
export declare function walletForUserId(userId: number): Promise<string | null>;
/** Read the on-chain genealogy board (usersXMatrixReferrals) for a wallet. */
export declare function readGenealogyBoard(wallet: string, level: number): Promise<{
    filled: number;
    completed: boolean;
    slots: MatrixSlotDTO[];
}>;
export declare function chainCycleInfo(userId: number, level: number): Promise<{
    reinvestCount: number;
    currentCycle: number;
    wallet: string;
} | null>;
/** Snapshot the live genealogy board into DB when a cycle completes (Reinvest event). */
export declare function snapshotGenealogyBoard(matrixOwnerId: number, level: number, blockNumber: number, txHash: string, logIndex: number): Promise<void>;
/** After Registration, index the entrant on every ancestor genealogy board they appear on. */
export declare function syncEntrantOnGenealogyBoards(entrantId: number, entrantWallet: string, level: number, blockNumber: number, txHash: string, logIndex: number, sponsorId: number | null): Promise<void>;
//# sourceMappingURL=genealogy-board.service.d.ts.map