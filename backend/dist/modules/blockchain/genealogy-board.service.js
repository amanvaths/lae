import { ethers } from "ethers";
import { prisma } from "../../lib/prisma.js";
import { CONTRACTS } from "../../config/chains.js";
import { getIndexerProvider } from "./rpc-providers.js";
import { LAE_MATRIX_READ_ABI } from "./matrix-core-abi.js";
export const GENEALOGY_MATRIX_SIZE = 14;
const matrixIface = new ethers.Interface([...LAE_MATRIX_READ_ABI]);
function matrixContract() {
    return new ethers.Contract(CONTRACTS.matrixCore, matrixIface, getIndexerProvider());
}
export async function walletForUserId(userId) {
    const row = await prisma.matrixCoreUser.findUnique({
        where: { userId },
        select: { walletAddress: true },
    });
    if (row?.walletAddress)
        return row.walletAddress.toLowerCase();
    try {
        const m = matrixContract();
        const wallet = String(await m.idToAddress(userId)).toLowerCase();
        return wallet && wallet !== ethers.ZeroAddress ? wallet : null;
    }
    catch {
        return null;
    }
}
async function idForAddress(address) {
    try {
        const m = matrixContract();
        const id = Number(await m.addressToId(address));
        return id > 0 ? id : null;
    }
    catch {
        return null;
    }
}
function addrAt(rawRefs, i) {
    const raw = typeof rawRefs?.getItem === "function"
        ? rawRefs.getItem(i)
        : rawRefs?.[i] ?? ethers.ZeroAddress;
    return String(raw).toLowerCase();
}
/** Read the on-chain genealogy board (usersXMatrixReferrals) for a wallet. */
export async function readGenealogyBoard(wallet, level) {
    const m = matrixContract();
    const rawRefs = await m.usersXMatrixReferrals(wallet, level);
    let filled = 0;
    let firstEmpty = 0;
    const slots = [];
    for (let p = 1; p <= GENEALOGY_MATRIX_SIZE; p++) {
        const addr = addrAt(rawRefs, p - 1);
        const occupied = Boolean(addr) && addr !== ethers.ZeroAddress.toLowerCase();
        if (occupied) {
            filled += 1;
            const occId = await idForAddress(addr);
            slots.push({
                position: p,
                state: "filled",
                userId: occId,
                address: addr,
            });
        }
        else {
            if (firstEmpty === 0)
                firstEmpty = p;
            slots.push({
                position: p,
                state: "waiting",
                userId: null,
                address: null,
            });
        }
    }
    const completed = filled >= GENEALOGY_MATRIX_SIZE;
    if (!completed && firstEmpty > 0) {
        slots[firstEmpty - 1].state = "open";
    }
    return { filled, completed, slots };
}
export async function chainCycleInfo(userId, level) {
    const wallet = await walletForUserId(userId);
    if (!wallet)
        return null;
    const m = matrixContract();
    const matrixRow = await m.usersXMatrix(wallet, level);
    const reinvestCount = Number(matrixRow.reinvestCount ?? 0);
    return { reinvestCount, currentCycle: reinvestCount + 1, wallet };
}
/** Snapshot the live genealogy board into DB when a cycle completes (Reinvest event). */
export async function snapshotGenealogyBoard(matrixOwnerId, level, blockNumber, txHash, logIndex) {
    const wallet = await walletForUserId(matrixOwnerId);
    if (!wallet)
        return;
    const m = matrixContract();
    const matrixRow = await m.usersXMatrix(wallet, level);
    const reinvestCount = Number(matrixRow.reinvestCount ?? 0);
    const completedCycleId = reinvestCount;
    if (completedCycleId < 1)
        return;
    const { slots } = await readGenealogyBoard(wallet, level);
    for (const slot of slots) {
        if (slot.state !== "filled" || !slot.userId)
            continue;
        await prisma.matrixCorePosition.upsert({
            where: {
                matrixOwnerId_level_cycleId_position: {
                    matrixOwnerId,
                    level,
                    cycleId: completedCycleId,
                    position: slot.position,
                },
            },
            create: {
                matrixOwnerId,
                level,
                cycleId: completedCycleId,
                position: slot.position,
                occupantId: slot.userId,
                blockNumber: BigInt(blockNumber),
                txHash,
                logIndex,
            },
            update: { occupantId: slot.userId },
        });
    }
    await prisma.matrixCoreCycle.upsert({
        where: {
            matrixOwnerId_level_cycleId: { matrixOwnerId, level, cycleId: completedCycleId },
        },
        create: { matrixOwnerId, level, cycleId: completedCycleId, filled: 14, completed: true },
        update: { filled: 14, completed: true },
    });
    const nextCycle = completedCycleId + 1;
    await prisma.matrixCoreCycle.upsert({
        where: {
            matrixOwnerId_level_cycleId: { matrixOwnerId, level, cycleId: nextCycle },
        },
        create: { matrixOwnerId, level, cycleId: nextCycle, filled: 0, completed: false },
        update: {},
    });
}
/** After Registration, index the entrant on every ancestor genealogy board they appear on. */
export async function syncEntrantOnGenealogyBoards(entrantId, entrantWallet, level, blockNumber, txHash, logIndex, sponsorId) {
    if (!sponsorId)
        return;
    const m = matrixContract();
    const entrantAddr = entrantWallet.toLowerCase();
    let currentId = sponsorId;
    let hops = 0;
    while (currentId > 0 && hops < 64) {
        const ownerWallet = await walletForUserId(currentId);
        if (!ownerWallet)
            break;
        const matrixRow = await m.usersXMatrix(ownerWallet, level);
        const cycleId = Number(matrixRow.reinvestCount ?? 0) + 1;
        const { slots } = await readGenealogyBoard(ownerWallet, level);
        let foundOnBoard = false;
        for (const slot of slots) {
            if (slot.address?.toLowerCase() !== entrantAddr)
                continue;
            foundOnBoard = true;
            await prisma.matrixCorePosition.upsert({
                where: {
                    matrixOwnerId_level_cycleId_position: {
                        matrixOwnerId: currentId,
                        level,
                        cycleId,
                        position: slot.position,
                    },
                },
                create: {
                    matrixOwnerId: currentId,
                    level,
                    cycleId,
                    position: slot.position,
                    occupantId: entrantId,
                    blockNumber: BigInt(blockNumber),
                    txHash,
                    logIndex,
                },
                update: { occupantId: entrantId },
            });
            const boardFilled = await prisma.matrixCorePosition.count({
                where: {
                    matrixOwnerId: currentId,
                    level,
                    cycleId,
                    position: { lte: GENEALOGY_MATRIX_SIZE },
                },
            });
            const overflowFilled = await prisma.matrixCorePosition.count({
                where: {
                    matrixOwnerId: currentId,
                    level,
                    cycleId,
                    position: { gt: GENEALOGY_MATRIX_SIZE },
                },
            });
            await prisma.matrixCoreCycle.upsert({
                where: {
                    matrixOwnerId_level_cycleId: { matrixOwnerId: currentId, level, cycleId },
                },
                create: {
                    matrixOwnerId: currentId,
                    level,
                    cycleId,
                    filled: boardFilled + overflowFilled,
                    completed: boardFilled >= GENEALOGY_MATRIX_SIZE,
                },
                update: {
                    filled: boardFilled + overflowFilled,
                    completed: boardFilled >= GENEALOGY_MATRIX_SIZE,
                },
            });
            break;
        }
        if (!foundOnBoard &&
            (await isInGenealogySubtree(entrantId, currentId, level))) {
            await recordOverflowPlacement(currentId, level, cycleId, entrantId, blockNumber, txHash, logIndex);
        }
        try {
            const details = await m.getUserDetails(currentId);
            currentId = Number(details.referrerId ?? 0);
        }
        catch {
            break;
        }
        hops++;
    }
}
/** Members in the genealogy tree but NOT in the fixed 14-position board (depth 4+). */
export async function findOffBoardGenealogyMembers(matrixOwnerId, level) {
    const m = matrixContract();
    const overflow = [];
    const wallet = await walletForUserId(matrixOwnerId);
    if (!wallet)
        return overflow;
    const board = await readGenealogyBoard(wallet, level);
    const onBoard = new Set(board.slots.filter((s) => s.userId).map((s) => s.userId));
    async function visit(nodeId, depth) {
        if (nodeId <= 0)
            return;
        try {
            const gen = await m.genealogyOf(nodeId, level);
            const leftId = Number(gen.leftChildId ?? gen[1] ?? 0);
            const rightId = Number(gen.rightChildId ?? gen[2] ?? 0);
            for (const childId of [leftId, rightId]) {
                if (childId <= 0)
                    continue;
                if (!onBoard.has(childId)) {
                    overflow.push({
                        userId: childId,
                        address: await walletForUserId(childId),
                        depth,
                    });
                }
                await visit(childId, depth + 1);
            }
        }
        catch {
            /* skip unreachable node */
        }
    }
    try {
        const rootGen = await m.genealogyOf(matrixOwnerId, level);
        const leftId = Number(rootGen.leftChildId ?? rootGen[1] ?? 0);
        const rightId = Number(rootGen.rightChildId ?? rootGen[2] ?? 0);
        if (leftId > 0)
            await visit(leftId, 1);
        if (rightId > 0)
            await visit(rightId, 1);
    }
    catch {
        return overflow;
    }
    return overflow;
}
/** Map off-board / cycle-2 members into the standard 14-position tree (pos 1, 2, 3…). */
export function mapMembersToBoardSlots(members) {
    const filled = Math.min(members.length, GENEALOGY_MATRIX_SIZE);
    const completed = filled >= GENEALOGY_MATRIX_SIZE;
    const nextOpen = completed ? 0 : filled + 1;
    const slots = [];
    for (let p = 1; p <= GENEALOGY_MATRIX_SIZE; p++) {
        const m = members[p - 1];
        if (m) {
            slots.push({
                position: p,
                state: "filled",
                userId: m.userId,
                address: m.address,
            });
        }
        else {
            slots.push({
                position: p,
                state: !completed && p === nextOpen ? "open" : "waiting",
                userId: null,
                address: null,
            });
        }
    }
    return { slots, filled };
}
async function isInGenealogySubtree(entrantId, matrixOwnerId, level) {
    if (entrantId === matrixOwnerId)
        return false;
    const m = matrixContract();
    let cur = entrantId;
    for (let hops = 0; hops < 64 && cur > 0; hops++) {
        try {
            const gen = await m.genealogyOf(cur, level);
            const parentId = Number(gen.parentId ?? gen[0] ?? 0);
            if (parentId === matrixOwnerId)
                return true;
            if (parentId <= 0)
                break;
            cur = parentId;
        }
        catch {
            break;
        }
    }
    return false;
}
/** Off-board members shown in the current cycle tree (cycle 2+ after recycle). */
export async function overflowMembersForCycle(matrixOwnerId, level, cycleId, reinvestCount, currentCycle) {
    if (reinvestCount === 0 || cycleId < currentCycle)
        return [];
    if (cycleId !== currentCycle)
        return [];
    return findOffBoardGenealogyMembers(matrixOwnerId, level);
}
async function recordOverflowPlacement(matrixOwnerId, level, cycleId, entrantId, blockNumber, txHash, logIndex) {
    const overflowCount = await prisma.matrixCorePosition.count({
        where: { matrixOwnerId, level, cycleId, position: { gt: GENEALOGY_MATRIX_SIZE } },
    });
    const position = GENEALOGY_MATRIX_SIZE + overflowCount + 1;
    await prisma.matrixCorePosition.upsert({
        where: {
            matrixOwnerId_level_cycleId_position: {
                matrixOwnerId,
                level,
                cycleId,
                position,
            },
        },
        create: {
            matrixOwnerId,
            level,
            cycleId,
            position,
            occupantId: entrantId,
            blockNumber: BigInt(blockNumber),
            txHash,
            logIndex,
        },
        update: { occupantId: entrantId },
    });
    const boardFilled = await prisma.matrixCorePosition.count({
        where: { matrixOwnerId, level, cycleId, position: { lte: GENEALOGY_MATRIX_SIZE } },
    });
    const overflowFilled = overflowCount + 1;
    const totalFilled = boardFilled + overflowFilled;
    await prisma.matrixCoreCycle.upsert({
        where: {
            matrixOwnerId_level_cycleId: { matrixOwnerId, level, cycleId },
        },
        create: {
            matrixOwnerId,
            level,
            cycleId,
            filled: totalFilled,
            completed: boardFilled >= GENEALOGY_MATRIX_SIZE,
        },
        update: {
            filled: totalFilled,
            completed: boardFilled >= GENEALOGY_MATRIX_SIZE,
        },
    });
}
//# sourceMappingURL=genealogy-board.service.js.map