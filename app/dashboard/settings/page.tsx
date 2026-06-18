"use client";

import { useAccount } from "wagmi";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import Link from "next/link";
import { useSensoUser, useWalletOnChain, useIsRootAdmin } from "@/lib/contracts/hooks";
import { useWalletSession } from "@/providers/WalletSessionProvider";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { referralLink } from "@/lib/contracts/services/utils";
import { CHAIN_ID } from "@/lib/contracts/config";

export default function SettingsPage() {
  const { address } = useAccount();
  const user = useSensoUser();
  const wallet = useWalletOnChain();
  const admin = useIsRootAdmin();
  const { disconnectWallet, isWrongNetwork } = useWalletSession();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
      <p className="mt-1 text-sm text-slate-400">Wallet session · BSC Testnet ({CHAIN_ID})</p>

      <Panel className="mt-6" title="Wallet">
        {wallet.isLoading ? (
          <QueryLoading label="Loading balances…" />
        ) : (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Address</dt>
              <dd className="font-mono text-white">{address ? truncateAddress(address) : "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Registered on-chain</dt>
              <dd className="text-white">{user.data?.registered ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Internal mDAI</dt>
              <dd className="text-white">{fmtEther(wallet.data?.daiInternal ?? 0n)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">SLT balance</dt>
              <dd className="text-white">{fmtEther(wallet.data?.sltBalance ?? 0n, 0)}</dd>
            </div>
            {isWrongNetwork && (
              <p className="text-amber-400">Wrong network — switch to BSC Testnet in your wallet.</p>
            )}
          </dl>
        )}
      </Panel>

      <Panel className="mt-4" title="Referral link">
        <code className="block break-all text-xs text-brand-200">
          {address ? referralLink(address) : "Connect wallet"}
        </code>
      </Panel>

      <Panel className="mt-4" title="Wallet actions">
        <div className="flex flex-wrap gap-3">
          <ConnectWallet />
          <button type="button" className="btn-ghost" onClick={disconnectWallet}>
            Disconnect wallet
          </button>
          {admin.data && (
            <Link href="/dashboard/admin" className="btn-ghost">
              Protocol admin
            </Link>
          )}
        </div>
      </Panel>
    </div>
  );
}
