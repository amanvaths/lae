"use client";

import { Panel } from "@/components/dashboard/ui";
import { ChainQueryState } from "@/components/dashboard/ChainQueryState";
import { useWalletOnChain } from "@/lib/contracts/hooks";
import { fmtEther } from "@/lib/contracts/format";

export default function LiquidityPage() {
  const wallet = useWalletOnChain();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">NFT Liquidity</h1>
      <p className="mt-1 text-sm text-slate-400">Liquidity pool not deployed on testnet</p>
      <ChainQueryState query={wallet}>
        {(w) => (
          <Panel className="mt-6" title="Wallet mDAI">
            <p className="text-sm text-slate-400">Wallet balance</p>
            <p className="text-2xl font-bold text-white">{fmtEther(w.daiWallet)} mDAI</p>
            <p className="mt-4 text-sm text-slate-400">Internal (withdrawable)</p>
            <p className="text-xl font-bold text-white">{fmtEther(w.daiInternal)} mDAI</p>
          </Panel>
        )}
      </ChainQueryState>
    </div>
  );
}
