"use client";

import { Panel } from "@/components/dashboard/ui";
import { ChainQueryState } from "@/components/dashboard/ChainQueryState";
import { useWalletOnChain } from "@/lib/contracts/hooks";
import { fmtEther } from "@/lib/contracts/format";

export default function NftPage() {
  const wallet = useWalletOnChain();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Welcome Pass NFT</h1>
      <p className="mt-1 text-sm text-slate-400">NFT contracts not deployed — LAE rewards are on-chain</p>
      <ChainQueryState query={wallet}>
        {(w) => (
          <Panel className="mt-6" title="Your LAE (on-chain)">
            <p className="text-2xl font-bold text-white">{fmtEther(w.sltBalance, 0)} LAE</p>
            <p className="mt-2 text-sm text-slate-400">
              Welcome LAE is minted via LAE on package purchase (TokenReward events).
            </p>
          </Panel>
        )}
      </ChainQueryState>
    </div>
  );
}
