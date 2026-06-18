"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { CHAIN_ID } from "@/lib/contracts/addresses";
import { useClientMounted } from "@/lib/useClientMounted";
import { AlertTriangle } from "lucide-react";

/** Non-blocking wrong-network banner — does not hide page content. */
export function NetworkBanner() {
  const mounted = useClientMounted();
  const chainId = useChainId();
  const { isConnected, status } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!mounted || !isConnected || status !== "connected") return null;
  if (chainId === CHAIN_ID) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-medium text-amber-200">Wrong network</p>
            <p className="mt-1 text-sm text-amber-200/80">
              Switch to BSC Testnet (chain {CHAIN_ID}) to use LAE contracts.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => switchChain({ chainId: CHAIN_ID })}
          className="btn-primary shrink-0 text-sm"
        >
          {isPending ? "Switching…" : "Switch network"}
        </button>
      </div>
    </div>
  );
}
