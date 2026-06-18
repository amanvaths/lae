"use client";

import Link from "next/link";
import { Hexagon, ShieldCheck } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { LoginGate } from "@/components/auth/LoginGate";
import { withBasePath } from "@/lib/paths";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-[460px] w-[680px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[130px]" />
      </div>

      <Link href={withBasePath("/")} className="absolute left-6 top-6 flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-600 shadow-glow">
          <Hexagon className="h-5 w-5 text-white" strokeWidth={2.4} />
        </span>
        <span className="font-display text-xl font-bold text-white">LAE</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur">
        <div className="mb-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-brand-400" />
          <h1 className="mt-3 font-display text-2xl font-bold text-white">Connect Wallet</h1>
          <p className="mt-2 text-sm text-slate-400">
            MetaMask · Trust Wallet · WalletConnect on BSC Testnet
          </p>
        </div>

        <LoginGate>
          <ConnectWallet full variant="primary" />
        </LoginGate>

        <p className="mt-6 text-center text-xs text-slate-500">
          Referral link? Use <code className="text-brand-200">?sponsor=0x…</code> to set on-chain
          sponsor at registration.
        </p>
      </div>
    </main>
  );
}
