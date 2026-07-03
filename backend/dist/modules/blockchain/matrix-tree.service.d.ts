export declare const MATRIX_SIZE = 14;
export declare const LAST_LEVEL = 15;
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
    completed: boolean;
    slot2Opened: boolean;
    totalEarned: string;
    totalCycles: number;
    slots: MatrixSlotDTO[];
}
/** Authoritative matrix tree — chain for current cycle, DB for history */
export declare function getMatrixTree(userId: number, level: number, cycleId: number): Promise<MatrixTreeDTO | {
    error: string;
}>;
export interface MatrixOverviewCycle {
    cycle: number;
    filled: number;
    completed: boolean;
    slot2Opened: boolean;
}
export interface MatrixOverviewLevel {
    level: number;
    active: boolean;
    currentCycle: number;
    cycles: MatrixOverviewCycle[];
}
export declare function getMatrixOverview(userId: number, levelFilter?: number): Promise<{
    userId: number;
    address: string;
    levels: MatrixOverviewLevel[];
} | {
    error: string;
}>;
/** All placements for a user across levels/cycles */
export declare function getUserPlacement(userId: number): Promise<{
    [k: string]: string | number | Date;
}[]>;
//# sourceMappingURL=matrix-tree.service.d.ts.map