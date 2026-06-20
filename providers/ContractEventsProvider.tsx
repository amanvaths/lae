"use client";

import { useAccount } from "wagmi";
import { useLaeEventWatcher } from "@/lib/contracts/hooks";

export function ContractEventsProvider({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();

  useLaeEventWatcher(isConnected);

  return <>{children}</>;
}
