/** Shared API types mirroring backend Prisma models */

export type MatrixType = "CLUB" | "PILOT";
export type MatrixStatus = "ACTIVE" | "CYCLE_COMPLETE" | "REBIRTH" | "UPGRADED";
export type IncomeType =
  | "DIRECT"
  | "SPILLOVER"
  | "CYCLE"
  | "REBIRTH"
  | "UPGRADE"
  | "BONUS"
  | "STAKING"
  | "WITHDRAW"
  | "DEPOSIT"
  | "TOKEN_AIRDROP"
  | "SPIN_REWARD"
  | "WOM_REWARD"
  | "PILOT_CYCLE"
  | "PILOT_INCENTIVE"
  | "SPONSOR_PAYMENT"
  | "FIRST_LINE_BONUS";

export interface WalletBalance {
  availableBalance: string | number;
  lockedBalance: string | number;
  withdrawableBalance: string | number;
  totalEarned: string | number;
  totalWithdrawn: string | number;
  tokenBalance: string | number;
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  referralCode: string;
  username?: string | null;
  email?: string | null;
  isAdmin?: boolean;
  status?: string;
  treePath?: string;
  treeDepth?: number;
  directReferralCount?: number;
  wallet?: WalletBalance;
  sponsor?: { id: string; walletAddress: string; referralCode: string } | null;
}

export interface IncomeLedgerEntry {
  id: string;
  type: IncomeType;
  direction: "CREDIT" | "DEBIT";
  amount: string | number;
  tokenAmount?: string | number | null;
  packageLevel?: number | null;
  matrixType?: MatrixType | null;
  sourceUserId?: string | null;
  matrixId?: string | null;
  txHash?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface ClubMatrix {
  id: string;
  ownerId: string;
  packageLevel: number;
  status: MatrixStatus;
  cycleNumber: number;
  isRebirth: boolean;
  parentMatrixId?: string | null;
  slotsFilled: number;
  createdAt: string;
  completedAt?: string | null;
  placements?: MatrixPlacement[];
}

export interface PilotMatrix {
  id: string;
  ownerId: string;
  packageLevel: number;
  status: MatrixStatus;
  cycleNumber: number;
  isRebirth: boolean;
  parentMatrixId?: string | null;
  slotsFilled: number;
  createdAt: string;
  completedAt?: string | null;
  slots?: PilotSlot[];
}

export interface MatrixPlacement {
  id: string;
  matrixId: string;
  userId: string;
  position: string;
  placementType: "DIRECT" | "SPILLOVER";
  sponsorId?: string | null;
  createdAt: string;
  user?: { id: string; walletAddress: string; referralCode?: string };
}

export interface PilotSlot {
  id: string;
  matrixId: string;
  userId?: string | null;
  position: "SLOT_1" | "SLOT_2";
  placementType?: "DIRECT" | "SPILLOVER" | null;
  filledAt?: string | null;
}

export interface UserClubPackage {
  id: string;
  userId: string;
  packageLevel: number;
  isManual: boolean;
  cyclesCompleted: number;
  purchasedAt?: string;
}

export interface UserPilotPackage {
  id: string;
  userId: string;
  packageLevel: number;
  isManual: boolean;
  cyclesCompleted?: number;
}

export interface ReferralTreeNode {
  id: string;
  walletAddress: string;
  referralCode: string;
  treePath: string;
  treeDepth: number;
  relativeDepth?: number;
  children?: ReferralTreeNode[];
}

export interface WithdrawalRequest {
  id: string;
  amount: string | number;
  walletAddress: string;
  status: string;
  txHash?: string | null;
  createdAt: string;
}

export interface BlockchainTransaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAW" | "REWARD";
  amount: string | number;
  txHash: string;
  status: string;
  packageLevel?: number | null;
  matrixType?: MatrixType | null;
  createdAt: string;
}

export interface PackagePrice {
  level: number;
  amount: number;
}

export interface AuthTokens {
  token: string;
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface LedgerResponse {
  entries: IncomeLedgerEntry[];
  page: number;
  limit: number;
  immutable: boolean;
}

export interface DirectReferralsResponse {
  referrals: UserProfile[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardCache {
  wallet: WalletBalance;
  clubPackages: UserClubPackage[];
  pilotPackages: UserPilotPackage[];
  directCount: number;
  teamSize: number;
  cached: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  walletAddress: string;
  totalEarned: number;
  rank: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  cached: boolean;
}
