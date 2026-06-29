"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { WalletGuard } from "@/components/auth/WalletGuard";
import { ViewUserBanner } from "@/components/dashboard/ViewUserBanner";
import { RegistrationCheckSpinner } from "@/components/auth/RegistrationCheckBanner";
import {
  DashboardViewProvider,
  parseDashboardViewUserId,
} from "@/lib/lae-club/dashboard-view-context";

function DashboardGateInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const viewUserId = parseDashboardViewUserId(searchParams.get("viewUserId"));

  return (
    <DashboardViewProvider viewUserId={viewUserId}>
      {viewUserId ? (
        <>
          <ViewUserBanner userId={viewUserId} />
          {children}
        </>
      ) : (
        <WalletGuard>{children}</WalletGuard>
      )}
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
