import { api } from "@/lib/api-client";
import type { PilotMatrix, UserPilotPackage } from "@/lib/api/types";

export async function fetchPilotMatrices() {
  return api.get<PilotMatrix[]>("/api/pilot/matrices");
}

export async function fetchPilotPackages() {
  return api.get<UserPilotPackage[]>("/api/pilot/packages");
}
