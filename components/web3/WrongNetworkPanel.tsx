"use client";

import { AlertTriangle } from "lucide-react";
import { useSwitchChain } from "wagmi";
import { CHAIN_ID } from "@/lib/contracts/config";

/** Full-screen wrong-network prompt with switch action (auth gates). */
export function WrongNetworkPanel() {
  const { switchChain, isPending } = useSwitchChain();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
        <h2 className="mt-4 font-display text-lg font-bold text-white">Wrong network</h2>
        <p className="mt-2 text-sm text-amber-200/80">
          Switch to BSC Testnet (chain {CHAIN_ID}) to use LAE Club contracts.
        </p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => switchChain({ chainId: CHAIN_ID })}
          className="btn-primary mx-auto mt-5 w-full max-w-xs justify-center"
        >
          {isPending ? "Switching…" : "Switch network"}
        </button>
      </div>
    </div>
  );
}
