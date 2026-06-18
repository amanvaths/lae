import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    walletAddress: z.ZodString;
    referralCode: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    signature: z.ZodOptional<z.ZodString>;
    nonce: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    walletAddress: string;
    referralCode: string;
    username?: string | undefined;
    email?: string | undefined;
    nonce?: string | undefined;
    signature?: string | undefined;
}, {
    walletAddress: string;
    referralCode: string;
    username?: string | undefined;
    email?: string | undefined;
    nonce?: string | undefined;
    signature?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    walletAddress: z.ZodString;
    signature: z.ZodOptional<z.ZodString>;
    nonce: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    walletAddress: string;
    nonce?: string | undefined;
    signature?: string | undefined;
}, {
    walletAddress: string;
    nonce?: string | undefined;
    signature?: string | undefined;
}>;
export declare const authSignatureSchema: z.ZodObject<{
    walletAddress: z.ZodString;
    signature: z.ZodString;
    nonce: z.ZodString;
}, "strip", z.ZodTypeAny, {
    walletAddress: string;
    nonce: string;
    signature: string;
}, {
    walletAddress: string;
    nonce: string;
    signature: string;
}>;
export declare const refreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const purchaseSchema: z.ZodObject<{
    packageLevel: z.ZodNumber;
    matrixType: z.ZodEnum<["CLUB", "PILOT"]>;
    txHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    packageLevel: number;
    txHash: string;
    matrixType: "CLUB" | "PILOT";
}, {
    packageLevel: number;
    txHash: string;
    matrixType: "CLUB" | "PILOT";
}>;
export declare const withdrawSchema: z.ZodObject<{
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amount: number;
}, {
    amount: number;
}>;
export declare const spinSchema: z.ZodObject<{
    couponId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    couponId: string;
}, {
    couponId: string;
}>;
export declare const womSubmitSchema: z.ZodObject<{
    socialLink: z.ZodString;
    contentLink: z.ZodOptional<z.ZodString>;
    screenshot: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    socialLink: string;
    contentLink?: string | undefined;
    screenshot?: string | undefined;
}, {
    socialLink: string;
    contentLink?: string | undefined;
    screenshot?: string | undefined;
}>;
export declare const stakeSchema: z.ZodObject<{
    amount: z.ZodNumber;
    round: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    round?: number | undefined;
}, {
    amount: number;
    round?: number | undefined;
}>;
export declare const womReviewSchema: z.ZodObject<{
    status: z.ZodEnum<["APPROVED", "REJECTED"]>;
    daiAmount: z.ZodOptional<z.ZodNumber>;
    tokenAmount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "APPROVED" | "REJECTED";
    tokenAmount?: number | undefined;
    daiAmount?: number | undefined;
}, {
    status: "APPROVED" | "REJECTED";
    tokenAmount?: number | undefined;
    daiAmount?: number | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map