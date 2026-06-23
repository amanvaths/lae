export declare const MATRIX_SIZE = 14;
export declare const LAST_LEVEL = 12;
export type SlotState = "locked" | "waiting" | "open" | "filled";
export interface MatrixSlotDTO {
    position: number;
    state: SlotState;
    userId: number | null;
    address: string | null;
}
export interface MatrixTreeDTO {
    userId: number;
    address: string;
    level: number;
    cycle: number;
    active: boolean;
    filledSpots: number;
    totalEarning: string;
    totalTeamSize: number;
    slots: MatrixSlotDTO[];
}
/**
 * Build the authoritative 14-spot matrix tree for (userId, level) directly from
 * the contract (the source of truth) and persist the snapshot to the DB so the
 * frontend can render without doing any hierarchy calculation itself.
 */
export declare function getMatrixTree(userId: number, level: number): Promise<MatrixTreeDTO | {
    error: string;
}>;
export interface MatrixOverviewLevel {
    level: number;
    active: boolean;
    filled: number;
    cycle: number;
}
/** Per-level active flag + fill count for the matrix level grid (DB-served). */
export declare function getMatrixOverview(userId: number): Promise<{
    userId: number;
    address: string;
    levels: MatrixOverviewLevel[];
} | {
    error: string;
}>;
//# sourceMappingURL=matrix-tree.service.d.ts.map