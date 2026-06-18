"use client";

import { useSensoEventWatcher, useInvalidateOnChain } from "@/lib/contracts/hooks";
import { useWatchContractEvent } from "wagmi";
import { CONTRACTS } from "@/lib/contracts/addresses";
import { sensoSpinAbi } from "@/lib/contracts/abis/sensoSpin";
import { sensoStakingAbi } from "@/lib/contracts/abis/sensoStaking";

export function ContractEventsProvider({ children }: { children: React.ReactNode }) {
  useSensoEventWatcher();
  const invalidate = useInvalidateOnChain();

  useWatchContractEvent({
    address: CONTRACTS.spin,
    abi: sensoSpinAbi,
    onLogs: () => invalidate(),
  });

  useWatchContractEvent({
    address: CONTRACTS.staking,
    abi: sensoStakingAbi,
    onLogs: () => invalidate(),
  });

  return <>{children}</>;
}
