import { prisma } from "../../lib/prisma.js";
import { serializeForJson } from "../../lib/serialize.js";
function normalizeWallet(wallet) {
    return wallet.toLowerCase();
}
function toWeiBigInt(amount) {
    const s = amount.toString();
    if (!s.includes("."))
        return BigInt(s || "0");
    const [whole, frac = ""] = s.split(".");
    const padded = frac.padEnd(18, "0").slice(0, 18);
    return BigInt(whole + padded);
}
function incomeToEvent(row) {
    if (row.incomeKind === "royal") {
        return {
            transactionHash: row.txHash,
            logIndex: row.logIndex,
            eventName: "ClubPoolPayment",
            blockNumber: row.blockNumber.toString(),
            args: {
                refId: BigInt(row.receiverUserId),
                userId: row.fromUserId != null ? BigInt(row.fromUserId) : 0n,
                level: row.level,
                amount: toWeiBigInt(row.amount),
            },
        };
    }
    return {
        transactionHash: row.txHash,
        logIndex: row.logIndex,
        eventName: "TokenReceived",
        blockNumber: row.blockNumber.toString(),
        args: {
            receiverId: BigInt(row.receiverUserId),
            fromId: row.fromUserId != null ? BigInt(row.fromUserId) : 0n,
            level: row.level,
            amount: toWeiBigInt(row.amount),
        },
    };
}
function placementToEvent(row) {
    return {
        transactionHash: row.txHash,
        logIndex: row.logIndex,
        eventName: "NewUserPlace",
        blockNumber: row.blockNumber.toString(),
        args: {
            user: BigInt(row.userId),
            referrer: BigInt(row.referrerId),
            level: row.level,
            cycle: BigInt(row.cycle),
            spot: row.spot,
        },
    };
}
function chainEventToRow(e) {
    const payload = (e.payload ?? {});
    const args = {};
    for (const [k, v] of Object.entries(payload)) {
        if (typeof v === "number")
            args[k] = BigInt(v);
        else if (typeof v === "string" && /^\d+$/.test(v))
            args[k] = BigInt(v);
        else
            args[k] = v;
    }
    return {
        transactionHash: e.txHash,
        logIndex: e.logIndex,
        eventName: e.eventName,
        blockNumber: e.blockNumber?.toString() ?? "0",
        args,
    };
}
/** Fast indexed user events — avoids slow eth_getLogs on the frontend. */
export async function getLaeUserEvents(wallet, limit = 150) {
    const w = normalizeWallet(wallet);
    const user = await prisma.indexedLaeUser.findUnique({ where: { walletAddress: w } });
    if (!user)
        return [];
    const perSource = Math.ceil(limit / 3);
    const [incomes, placements, chainEvents] = await Promise.all([
        prisma.indexedLaeIncome.findMany({
            where: { receiverAddress: w },
            orderBy: { blockNumber: "desc" },
            take: perSource,
        }),
        prisma.indexedLaePlacement.findMany({
            where: { OR: [{ userId: user.userId }, { referrerId: user.userId }] },
            orderBy: { blockNumber: "desc" },
            take: perSource,
        }),
        prisma.chainEvent.findMany({
            where: {
                walletAddress: w,
                eventName: { in: ["Reinvest", "Upgrade", "Spillover", "Registration", "MissedIncome"] },
            },
            orderBy: { blockNumber: "desc" },
            take: perSource,
        }),
    ]);
    const rows = [
        ...incomes.map(incomeToEvent),
        ...placements.map(placementToEvent),
        ...chainEvents.map(chainEventToRow),
    ];
    rows.sort((a, b) => {
        const ba = BigInt(a.blockNumber || "0");
        const bb = BigInt(b.blockNumber || "0");
        if (ba === bb)
            return b.logIndex - a.logIndex;
        return ba > bb ? 1 : -1;
    });
    const seen = new Set();
    const deduped = [];
    for (const row of rows) {
        const key = `${row.transactionHash}:${row.logIndex}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        deduped.push(row);
        if (deduped.length >= limit)
            break;
    }
    return serializeForJson(deduped);
}
export async function getLaeUserIncome(wallet, kind, limit = 100) {
    const w = normalizeWallet(wallet);
    return serializeForJson(await prisma.indexedLaeIncome.findMany({
        where: {
            receiverAddress: w,
            ...(kind ? { incomeKind: kind } : {}),
        },
        orderBy: { blockNumber: "desc" },
        take: limit,
    }));
}
//# sourceMappingURL=lae-user.service.js.map