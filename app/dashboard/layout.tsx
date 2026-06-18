import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardGate } from "@/components/auth/DashboardGate";
import { DashboardErrorBoundary } from "@/components/dashboard/DashboardErrorBoundary";

export const metadata: Metadata = {
  title: "Dashboard — LAE",
  description: "Your LAE matrix dashboard.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardErrorBoundary>
      <DashboardShell>
        <DashboardGate>{children}</DashboardGate>
      </DashboardShell>
    </DashboardErrorBoundary>
  );
}
