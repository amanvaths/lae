export interface TreeNode {
    id: string;
    walletAddress: string;
    referralCode: string;
    treePath: string;
    treeDepth: number;
    relativeDepth: number;
    directCount?: number;
    children?: TreeNode[];
}
export interface SponsorChainEntry {
    id: string;
    walletAddress: string;
    referralCode: string;
    treeDepth: number;
    level: number;
}
/**
 * Recursive CTE — fetch full downline tree up to maxDepth levels.
 * Uses PostgreSQL WITH RECURSIVE for efficient tree traversal.
 */
export declare function getDownlineRecursive(userId: string, maxDepth?: number): Promise<TreeNode[]>;
/**
 * Recursive CTE — fetch sponsor upline chain.
 */
export declare function getUplineRecursive(userId: string, maxDepth?: number): Promise<SponsorChainEntry[]>;
/**
 * Materialized path — parse upline IDs from treePath without recursive query.
 * Path format: /rootId/sponsorId/userId/
 */
export declare function parseUplineFromPath(treePath: string, excludeUserId?: string): string[];
/**
 * Materialized path — find all descendants via prefix match (B-tree index on tree_path).
 */
export declare function getDescendantsByPath(userTreePath: string, maxDepth?: number): Promise<{
    id: string;
    walletAddress: string;
    sponsorId: string | null;
    referralCode: string;
    treePath: string;
    treeDepth: number;
    createdAt: Date;
}[]>;
/** Build nested tree from flat downline result */
export declare function buildNestedTree(flat: TreeNode[], rootId: string): TreeNode | null;
/** Compute team size for a user using materialized path prefix count */
export declare function getTeamSize(userId: string, treePath: string): Promise<number>;
/** Leaderboard query — top earners with team stats */
export declare function computeLeaderboard(limit?: number): Promise<{
    userId: string;
    walletAddress: string;
    totalEarned: string;
    directCount: bigint;
    teamSize: bigint;
}[]>;
export declare function buildTreePath(sponsorPath: string, userId: string): string;
export declare function computeTreeDepth(treePath: string): number;
//# sourceMappingURL=referral-tree.repository.d.ts.map