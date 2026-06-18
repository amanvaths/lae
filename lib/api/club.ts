import { api } from "@/lib/api-client";
import type {
  ClubMatrix,
  UserClubPackage,
  ReferralTreeNode,
  DirectReferralsResponse,
} from "@/lib/api/types";

export async function fetchClubMatrices() {
  return api.get<ClubMatrix[]>("/api/club/matrices");
}

export async function fetchClubPackages() {
  return api.get<UserClubPackage[]>("/api/club/packages");
}

export async function fetchClubMatrix(id: string) {
  return api.get<ClubMatrix>(`/api/club/matrix/${id}`);
}

export async function fetchReferralTree(depth = 5) {
  return api.get<ReferralTreeNode>(`/api/referral/tree?depth=${depth}`);
}

export async function fetchDirectReferrals(page = 1, limit = 20) {
  return api.get<DirectReferralsResponse>(
    `/api/referral/direct?page=${page}&limit=${limit}`
  );
}

export async function fetchTeamSize() {
  return api.get<{ teamSize: number }>("/api/referral/team-size");
}

export async function fetchSponsorChain() {
  return api.get<Array<{ id: string; walletAddress: string; referralCode: string; level: number }>>(
    "/api/referral/sponsor-chain"
  );
}
