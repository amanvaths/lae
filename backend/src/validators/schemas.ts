import { z } from "zod";

export const registerSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  referralCode: z.string().min(4).max(20),
  username: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/).optional(),
  nonce: z.string().min(8).optional(),
});

export const loginSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/).optional(),
  nonce: z.string().min(8).optional(),
});

export const authSignatureSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  nonce: z.string().min(8),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const purchaseSchema = z.object({
  packageLevel: z.number().int().min(1).max(12),
  matrixType: z.enum(["CLUB", "PILOT"]),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export const withdrawSchema = z.object({
  amount: z.number().positive(),
});

export const spinSchema = z.object({
  couponId: z.string().cuid(),
});

export const womSubmitSchema = z.object({
  socialLink: z.string().url(),
  contentLink: z.string().url().optional(),
  screenshot: z.string().url().optional(),
});

export const stakeSchema = z.object({
  amount: z.number().positive(),
  round: z.number().int().positive().optional(),
});

export const womReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  daiAmount: z.number().nonnegative().optional(),
  tokenAmount: z.number().nonnegative().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
