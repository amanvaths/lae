import type { Prisma } from "@prisma/client";
export declare const userRepository: {
    findByWallet(walletAddress: string): Prisma.Prisma__UserClient<({
        sponsor: {
            id: string;
            walletAddress: string;
            referralCode: string;
        } | null;
        wallet: {
            version: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            availableBalance: Prisma.Decimal;
            lockedBalance: Prisma.Decimal;
            withdrawableBalance: Prisma.Decimal;
            totalEarned: Prisma.Decimal;
            totalWithdrawn: Prisma.Decimal;
            tokenBalance: Prisma.Decimal;
        } | null;
    } & {
        id: string;
        walletAddress: string;
        username: string | null;
        email: string | null;
        sponsorId: string | null;
        referralCode: string;
        treePath: string;
        treeDepth: number;
        status: import("@prisma/client").$Enums.UserStatus;
        isAdmin: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findByReferralCode(referralCode: string): Prisma.Prisma__UserClient<{
        id: string;
        walletAddress: string;
        username: string | null;
        email: string | null;
        sponsorId: string | null;
        referralCode: string;
        treePath: string;
        treeDepth: number;
        status: import("@prisma/client").$Enums.UserStatus;
        isAdmin: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findById(id: string): Prisma.Prisma__UserClient<({
        wallet: {
            version: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            availableBalance: Prisma.Decimal;
            lockedBalance: Prisma.Decimal;
            withdrawableBalance: Prisma.Decimal;
            totalEarned: Prisma.Decimal;
            totalWithdrawn: Prisma.Decimal;
            tokenBalance: Prisma.Decimal;
        } | null;
    } & {
        id: string;
        walletAddress: string;
        username: string | null;
        email: string | null;
        sponsorId: string | null;
        referralCode: string;
        treePath: string;
        treeDepth: number;
        status: import("@prisma/client").$Enums.UserStatus;
        isAdmin: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    create(data: Prisma.UserCreateInput): Prisma.Prisma__UserClient<{
        wallet: {
            version: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            availableBalance: Prisma.Decimal;
            lockedBalance: Prisma.Decimal;
            withdrawableBalance: Prisma.Decimal;
            totalEarned: Prisma.Decimal;
            totalWithdrawn: Prisma.Decimal;
            tokenBalance: Prisma.Decimal;
        } | null;
    } & {
        id: string;
        walletAddress: string;
        username: string | null;
        email: string | null;
        sponsorId: string | null;
        referralCode: string;
        treePath: string;
        treeDepth: number;
        status: import("@prisma/client").$Enums.UserStatus;
        isAdmin: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    countDirectReferrals(userId: string): Prisma.PrismaPromise<number>;
    getDirectReferrals(userId: string, skip?: number, take?: number): Prisma.PrismaPromise<({
        wallet: {
            version: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            availableBalance: Prisma.Decimal;
            lockedBalance: Prisma.Decimal;
            withdrawableBalance: Prisma.Decimal;
            totalEarned: Prisma.Decimal;
            totalWithdrawn: Prisma.Decimal;
            tokenBalance: Prisma.Decimal;
        } | null;
    } & {
        id: string;
        walletAddress: string;
        username: string | null;
        email: string | null;
        sponsorId: string | null;
        referralCode: string;
        treePath: string;
        treeDepth: number;
        status: import("@prisma/client").$Enums.UserStatus;
        isAdmin: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    })[]>;
    getSponsorChain(userId: string, maxDepth?: number): Promise<{
        id: string;
        walletAddress: string;
        referralCode: string;
        depth: number;
    }[]>;
    getReferralTree(userId: string, maxDepth?: number): Promise<unknown>;
};
export declare const walletRepository: {
    findByUserId(userId: string): Prisma.Prisma__WalletClient<{
        version: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        availableBalance: Prisma.Decimal;
        lockedBalance: Prisma.Decimal;
        withdrawableBalance: Prisma.Decimal;
        totalEarned: Prisma.Decimal;
        totalWithdrawn: Prisma.Decimal;
        tokenBalance: Prisma.Decimal;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    getLedger(userId: string, skip?: number, take?: number): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        userId: string;
        packageLevel: number | null;
        txHash: string | null;
        sequenceNum: bigint;
        type: import("@prisma/client").$Enums.IncomeType;
        direction: import("@prisma/client").$Enums.LedgerDirection;
        amount: Prisma.Decimal;
        tokenAmount: Prisma.Decimal | null;
        balanceAfter: Prisma.Decimal | null;
        matrixType: import("@prisma/client").$Enums.MatrixType | null;
        sourceUserId: string | null;
        matrixId: string | null;
        idempotencyKey: string | null;
        metadata: Prisma.JsonValue | null;
    }[]>;
};
export declare const clubRepository: {
    getUserMatrices(userId: string): Prisma.PrismaPromise<({
        placements: ({
            user: {
                id: string;
                walletAddress: string;
            };
        } & {
            id: string;
            sponsorId: string | null;
            createdAt: Date;
            userId: string;
            matrixType: import("@prisma/client").$Enums.MatrixType;
            matrixId: string;
            idempotencyKey: string | null;
            position: import("@prisma/client").$Enums.MatrixPosition;
            placementType: import("@prisma/client").$Enums.PlacementType;
            spilloverFrom: string | null;
        })[];
    } & {
        version: number;
        id: string;
        status: import("@prisma/client").$Enums.MatrixEntryStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        ownerId: string;
        packageLevel: number;
        cycleNumber: number;
        isRebirth: boolean;
        parentMatrixId: string | null;
        slotsFilled: number;
        completedAt: Date | null;
    })[]>;
    getMatrixById(matrixId: string): Prisma.Prisma__ClubMatrixClient<({
        placements: ({
            user: {
                id: string;
                walletAddress: string;
                referralCode: string;
            };
        } & {
            id: string;
            sponsorId: string | null;
            createdAt: Date;
            userId: string;
            matrixType: import("@prisma/client").$Enums.MatrixType;
            matrixId: string;
            idempotencyKey: string | null;
            position: import("@prisma/client").$Enums.MatrixPosition;
            placementType: import("@prisma/client").$Enums.PlacementType;
            spilloverFrom: string | null;
        })[];
        owner: {
            id: string;
            walletAddress: string;
        };
    } & {
        version: number;
        id: string;
        status: import("@prisma/client").$Enums.MatrixEntryStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        ownerId: string;
        packageLevel: number;
        cycleNumber: number;
        isRebirth: boolean;
        parentMatrixId: string | null;
        slotsFilled: number;
        completedAt: Date | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    getUserPackages(userId: string): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        packageLevel: number;
        purchasedAt: Date;
        isManual: boolean;
        cyclesCompleted: number;
        txHash: string | null;
    }[]>;
};
export declare const pilotRepository: {
    getUserMatrices(userId: string): Prisma.PrismaPromise<({
        slots: {
            id: string;
            createdAt: Date;
            userId: string | null;
            matrixId: string;
            idempotencyKey: string | null;
            position: import("@prisma/client").$Enums.MatrixPosition;
            placementType: import("@prisma/client").$Enums.PlacementType | null;
            filledAt: Date | null;
        }[];
    } & {
        version: number;
        id: string;
        status: import("@prisma/client").$Enums.MatrixEntryStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        ownerId: string;
        packageLevel: number;
        cycleNumber: number;
        isRebirth: boolean;
        parentMatrixId: string | null;
        slotsFilled: number;
        completedAt: Date | null;
    })[]>;
    getUserPackages(userId: string): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        packageLevel: number;
        purchasedAt: Date;
        isManual: boolean;
        cyclesCompleted: number;
        txHash: string | null;
    }[]>;
};
//# sourceMappingURL=index.d.ts.map