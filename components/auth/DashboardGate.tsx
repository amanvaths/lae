"use client";

import { WalletGuard } from "@/components/auth/WalletGuard";

export function DashboardGate({ children }: { children: React.ReactNode }) {
  return <WalletGuard>{children}</WalletGuard>;
}
