"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { CHAIN_ID } from "@/lib/contracts/addresses";
import { useClientMounted } from "@/lib/useClientMounted";
import { AlertTriangle } from "lucide-react";

export function ChainGuard({ children }: { children: React.ReactNode }) {
  const mounted = useClientMounted();
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!mounted) {
    return <>{children}</>;
  }

  if (!isConnected) return <>{children}</>;

  if (chainId !== CHAIN_ID) {
    return (
      <div className="mx-auto mb-4 max-w-lg rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-medium text-amber-200">Wrong network</p>
            <p className="mt-1 text-sm text-amber-200/80">
              Switch to BSC Testnet (chain {CHAIN_ID}) to interact with LAE contracts.
            </p>
            <button
              type="button"
              disabled={isPending}
              onClick={() => switchChain({ chainId: CHAIN_ID })}
              className="btn-primary mt-3 text-sm"
            >
              {isPending ? "Switching…" : "Switch to BSC Testnet"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
