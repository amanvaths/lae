"use client";

import { useAccount } from "wagmi";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import Link from "next/link";
import { withBasePath } from "@/lib/paths";
import { useLaeUser, referralLinkByUserId } from "@/lib/lae-club/hooks";
import { useWalletSession } from "@/providers/WalletSessionProvider";
import { truncateAddress } from "@/lib/format";
import { CHAIN_ID } from "@/lib/lae-club/contracts";

export default function SettingsPage() {
  const { address } = useAccount();
  const user = useLaeUser();
  const { disconnectWallet, isWrongNetwork } = useWalletSession();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
      <p className="mt-1 text-sm text-slate-400">Wallet session · BSC Testnet (chain {CHAIN_ID})</p>

      <Panel className="mt-6" title="Wallet">
        {user.isLoading ? (
          <QueryLoading label="Loading on-chain profile…" />
        ) : (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Address</dt>
              <dd className="font-mono text-white">{address ? truncateAddress(address) : "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Registered on-chain</dt>
              <dd className="text-white">{user.registered ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">User ID</dt>
              <dd className="text-white">{user.registered ? `#${String(user.userId)}` : "—"}</dd>
            </div>
            {isWrongNetwork && (
              <p className="text-amber-400">Wrong network — switch to BSC Testnet in your wallet.</p>
            )}
          </dl>
        )}
      </Panel>

      <Panel className="mt-4" title="Referral link">
        <code className="block break-all text-xs text-brand-200">
          {user.registered && user.userId
            ? referralLinkByUserId(user.userId)
            : "Register on LAE Club to get your referral link"}
        </code>
        <p className="mt-2 text-xs text-slate-500">Share as /register?ref=YOUR_USER_ID</p>
      </Panel>

      <Panel className="mt-4" title="Wallet actions">
        <div className="flex flex-wrap gap-3">
          <ConnectWallet />
          <button type="button" className="btn-ghost" onClick={disconnectWallet}>
            Disconnect wallet
          </button>
          <Link href={withBasePath("/admin")} className="btn-ghost">
            Admin panel
          </Link>
        </div>
      </Panel>
    </div>
  );
}
