import { api } from "@/lib/api-client";
import type { WalletBalance, IncomeLedgerEntry, LedgerResponse } from "@/lib/api/types";

export async function fetchWalletBalance() {
  return api.get<WalletBalance>("/api/wallet/balance");
}

export async function fetchWalletLedger(page = 1, limit = 50) {
  return api.get<LedgerResponse>(`/api/wallet/ledger?page=${page}&limit=${limit}`);
}

export function groupLedgerByType(entries: IncomeLedgerEntry[]) {
  const groups: Record<string, number> = {};
  for (const e of entries) {
    const key = e.type;
    const amt = Number(e.amount ?? 0);
    groups[key] = (groups[key] ?? 0) + (e.direction === "DEBIT" ? -amt : amt);
  }
  return groups;
}
