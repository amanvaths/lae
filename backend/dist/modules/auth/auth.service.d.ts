export declare function verifyWalletSignature(walletAddress: string, signature: string, nonce: string): void;
export declare function registerUser(walletAddress: string, referralCode: string, username?: string, email?: string): Promise<{
    sponsor: {
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
    } | null;
    wallet: {
        version: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        totalEarned: import("@prisma/client/runtime/library").Decimal;
        availableBalance: import("@prisma/client/runtime/library").Decimal;
        lockedBalance: import("@prisma/client/runtime/library").Decimal;
        withdrawableBalance: import("@prisma/client/runtime/library").Decimal;
        totalWithdrawn: import("@prisma/client/runtime/library").Decimal;
        tokenBalance: import("@prisma/client/runtime/library").Decimal;
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
}>;
export declare function loginUser(walletAddress: string): Promise<{
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
        totalEarned: import("@prisma/client/runtime/library").Decimal;
        availableBalance: import("@prisma/client/runtime/library").Decimal;
        lockedBalance: import("@prisma/client/runtime/library").Decimal;
        withdrawableBalance: import("@prisma/client/runtime/library").Decimal;
        totalWithdrawn: import("@prisma/client/runtime/library").Decimal;
        tokenBalance: import("@prisma/client/runtime/library").Decimal;
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
}>;
export declare function createSession(userId: string, token: string, expiresAt: Date): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    token: string;
    expiresAt: Date;
}>;
export declare function revokeSession(token: string): Promise<void>;
export declare function getUserProfile(userId: string): Promise<{
    directReferralCount: number;
    wallet: {
        version: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        totalEarned: import("@prisma/client/runtime/library").Decimal;
        availableBalance: import("@prisma/client/runtime/library").Decimal;
        lockedBalance: import("@prisma/client/runtime/library").Decimal;
        withdrawableBalance: import("@prisma/client/runtime/library").Decimal;
        totalWithdrawn: import("@prisma/client/runtime/library").Decimal;
        tokenBalance: import("@prisma/client/runtime/library").Decimal;
    } | null;
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
}>;
//# sourceMappingURL=auth.service.d.ts.map