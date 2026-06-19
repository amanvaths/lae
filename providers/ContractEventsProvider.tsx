"use client";

import { useAccount } from "wagmi";
import { useWatchContractEvent } from "wagmi";
import { useSensoEventWatcher, useInvalidateOnChain } from "@/lib/contracts/hooks";
import { CONTRACTS } from "@/lib/contracts/addresses";
import { sensoSpinAbi } from "@/lib/contracts/abis/sensoSpin";
import { sensoStakingAbi } from "@/lib/contracts/abis/sensoStaking";

export function ContractEventsProvider({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const invalidate = useInvalidateOnChain();

  useSensoEventWatcher(isConnected);

  useWatchContractEvent({
    address: CONTRACTS.spin,
    abi: sensoSpinAbi,
    enabled: isConnected,
    onLogs: () => invalidate(),
  });

  useWatchContractEvent({
    address: CONTRACTS.staking,
    abi: sensoStakingAbi,
    enabled: isConnected,
    onLogs: () => invalidate(),
  });

  return <>{children}</>;
}
