"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { WalletGuard } from "@/components/auth/WalletGuard";
import { RegistrationCheckSpinner } from "@/components/auth/RegistrationCheckBanner";
import {
  DashboardViewProvider,
  clearDashboardViewUserId,
  parseDashboardViewUserId,
  persistDashboardViewUserId,
  readDashboardViewUserId,
} from "@/lib/lae-club/dashboard-view-context";

function DashboardGateInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const { status, address } = useAccount();
  const urlViewUserId = parseDashboardViewUserId(searchParams.get("viewUserId"));
  const [viewUserId, setViewUserId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (urlViewUserId != null) {
      persistDashboardViewUserId(urlViewUserId);
      setViewUserId(urlViewUserId);
      setReady(true);
      return;
    }

    if (status === "connected" && address) {
      clearDashboardViewUserId();
      setViewUserId(null);
      setReady(true);
      return;
    }

    setViewUserId(readDashboardViewUserId());
    setReady(true);
  }, [urlViewUserId, status, address]);

  if (!ready) {
    return <RegistrationCheckSpinner label="Loading dashboard…" />;
  }

  const inViewMode = viewUserId != null;

  return (
    <DashboardViewProvider viewUserId={viewUserId}>
      {inViewMode ? children : <WalletGuard>{children}</WalletGuard>}
    </DashboardViewProvider>
  );
}

export function DashboardGate({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<RegistrationCheckSpinner label="Loading dashboard…" />}>
      <DashboardGateInner>{children}</DashboardGateInner>
    </Suspense>
  );
}
