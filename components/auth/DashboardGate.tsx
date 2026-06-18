"use client";

import { WalletGuard } from "@/components/auth/WalletGuard";
import { ChainGuard } from "@/components/web3/ChainGuard";

export function DashboardGate({ children }: { children: React.ReactNode }) {
  return (
    <WalletGuard>
      <ChainGuard>{children}</ChainGuard>
    </WalletGuard>
  );
}
