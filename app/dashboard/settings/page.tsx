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
  const { isReady } = useWalletSession();
  const { address } = useAccount();
  const user = useLaeUser();
  const { disconnectWallet, isWrongNetwork } = useWalletSession();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Settings</h1>
      <p className="mt-1.5 text-sm text-slate-400">Wallet session · BSC Testnet (chain {CHAIN_ID})</p>

      <Panel className="mt-6 border-[#D4AF37]/15" title="Wallet">
        {user.isLoading ? (
          <QueryLoading label="Loading on-chain profile…" />
        ) : (
          <dl className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <dt className="text-slate-500">Address</dt>
              <dd className="font-mono text-[#D4AF37]">{isReady && address ? truncateAddress(address) : "—"}</dd>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <dt className="text-slate-500">Registered on-chain</dt>
              <dd className={user.registered ? "font-semibold text-emerald-400" : "text-white"}>{user.registered ? "Yes" : "No"}</dd>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <dt className="text-slate-500">User ID</dt>
              <dd className="font-semibold text-gradient-gold">{user.registered ? `#${String(user.userId)}` : "—"}</dd>
            </div>
            {isWrongNetwork && (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-400">
                Wrong network — switch to BSC Testnet in your wallet.
              </p>
            )}
          </dl>
        )}
      </Panel>

      <Panel className="mt-4 border-[#D4AF37]/15" title="Referral link">
        <code className="block break-all rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-3 text-xs text-[#D4AF37]">
          {user.registered && user.userId
            ? referralLinkByUserId(user.userId)
            : "Register on LAE Club to get your referral link"}
        </code>
        <p className="mt-2 text-xs text-slate-500">Share as /register?ref=YOUR_USER_ID</p>
      </Panel>

      <Panel className="mt-4 border-white/[0.08]" title="Wallet actions">
        <div className="flex flex-wrap gap-3">
          <ConnectWallet />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#D4AF37]/20 hover:text-[#D4AF37]"
            onClick={disconnectWallet}
          >
            Disconnect wallet
          </button>
          <Link
            href={withBasePath("/admin")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#D4AF37]/20 hover:text-[#D4AF37]"
          >
            Admin panel
          </Link>
        </div>
      </Panel>
    </div>
  );
}
