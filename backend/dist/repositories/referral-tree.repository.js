import { prisma } from "../lib/prisma.js";
/**
 * Recursive CTE — fetch full downline tree up to maxDepth levels.
 * Uses PostgreSQL WITH RECURSIVE for efficient tree traversal.
 */
export async function getDownlineRecursive(userId, maxDepth = 10) {
    return prisma.$queryRaw `
    WITH RECURSIVE downline AS (
      SELECT
        u.id,
        u.wallet_address AS "walletAddress",
        u.referral_code AS "referralCode",
        u.tree_path AS "treePath",
        u.tree_depth AS "treeDepth",
        0 AS "relativeDepth"
      FROM users u
      WHERE u.id = ${userId} AND u.deleted_at IS NULL

      UNION ALL

      SELECT
        u.id,
        u.wallet_address,
        u.referral_code,
        u.tree_path,
        u.tree_depth,
        d."relativeDepth" + 1
      FROM users u
      INNER JOIN downline d ON u.sponsor_id = d.id
      WHERE d."relativeDepth" < ${maxDepth}
        AND u.deleted_at IS NULL
    )
    SELECT * FROM downline ORDER BY "treeDepth", "relativeDepth"
  `;
}
/**
 * Recursive CTE — fetch sponsor upline chain.
 */
export async function getUplineRecursive(userId, maxDepth = 100) {
    return prisma.$queryRaw `
    WITH RECURSIVE upline AS (
      SELECT
        u.id,
        u.sponsor_id,
        u.wallet_address AS "walletAddress",
        u.referral_code AS "referralCode",
        u.tree_depth AS "treeDepth",
        0 AS level
      FROM users u
      WHERE u.id = ${userId} AND u.deleted_at IS NULL

      UNION ALL

      SELECT
        u.id,
        u.sponsor_id,
        u.wallet_address,
        u.referral_code,
        u.tree_depth,
        ul.level + 1
      FROM users u
      INNER JOIN upline ul ON u.id = ul.sponsor_id
      WHERE ul.level < ${maxDepth}
        AND u.deleted_at IS NULL
    )
    SELECT id, "walletAddress", "referralCode", "treeDepth", level
    FROM upline
    WHERE level > 0
    ORDER BY level ASC
  `;
}
/**
 * Materialized path — parse upline IDs from treePath without recursive query.
 * Path format: /rootId/sponsorId/userId/
 */
export function parseUplineFromPath(treePath, excludeUserId) {
    const segments = treePath.split("/").filter(Boolean);
    if (excludeUserId) {
        const idx = segments.indexOf(excludeUserId);
        return idx > 0 ? segments.slice(0, idx) : segments.slice(0, -1);
    }
    return segments.slice(0, -1);
}
/**
 * Materialized path — find all descendants via prefix match (B-tree index on tree_path).
 */
export async function getDescendantsByPath(userTreePath, maxDepth) {
    const prefix = userTreePath.endsWith("/") ? userTreePath : `${userTreePath}/`;
    const baseDepth = userTreePath.split("/").filter(Boolean).length;
    return prisma.user.findMany({
        where: {
            treePath: { startsWith: prefix },
            deletedAt: null,
            ...(maxDepth !== undefined ? { treeDepth: { lte: baseDepth + maxDepth } } : {}),
        },
        select: {
            id: true,
            walletAddress: true,
            referralCode: true,
            treePath: true,
            treeDepth: true,
            sponsorId: true,
            createdAt: true,
        },
        orderBy: [{ treeDepth: "asc" }, { createdAt: "asc" }],
    });
}
/** Build nested tree from flat downline result */
export function buildNestedTree(flat, rootId) {
    const map = new Map();
    let root = null;
    for (const node of flat) {
        map.set(node.id, { ...node, children: [] });
    }
    for (const node of flat) {
        const current = map.get(node.id);
        if (node.id === rootId) {
            root = current;
            continue;
        }
        const parentId = parseUplineFromPath(node.treePath).at(-1);
        if (parentId && map.has(parentId)) {
            map.get(parentId).children.push(current);
        }
    }
    return root;
}
/** Compute team size for a user using materialized path prefix count */
export async function getTeamSize(userId, treePath) {
    const prefix = treePath.endsWith("/") ? treePath : `${treePath}/`;
    return prisma.user.count({
        where: {
            treePath: { startsWith: prefix },
            id: { not: userId },
            deletedAt: null,
        },
    });
}
/** Leaderboard query — top earners with team stats */
export async function computeLeaderboard(limit = 100) {
    return prisma.$queryRaw `
    SELECT
      u.id AS "userId",
      u.wallet_address AS "walletAddress",
      COALESCE(w.total_earned, 0)::text AS "totalEarned",
      (SELECT COUNT(*) FROM users dr WHERE dr.sponsor_id = u.id AND dr.deleted_at IS NULL) AS "directCount",
      (SELECT COUNT(*) FROM users tm
        WHERE tm.tree_path LIKE u.tree_path || u.id || '/%'
        AND tm.deleted_at IS NULL) AS "teamSize"
    FROM users u
    LEFT JOIN wallets w ON w.user_id = u.id
    WHERE u.deleted_at IS NULL
    ORDER BY w.total_earned DESC NULLS LAST
    LIMIT ${limit}
  `;
}
export function buildTreePath(sponsorPath, userId) {
    const base = sponsorPath.endsWith("/") ? sponsorPath : `${sponsorPath}/`;
    return `${base}${userId}/`;
}
export function computeTreeDepth(treePath) {
    return treePath.split("/").filter(Boolean).length;
}
//# sourceMappingURL=referral-tree.repository.js.map