"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Hexagon, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { useWeb3Loaded } from "@/app/providers";
import { withBasePath } from "@/lib/paths";

const ease = [0.22, 1, 0.36, 1] as const;

const wallets = ["MetaMask", "WalletConnect", "Coinbase", "Rabby", "Ledger"];

function ConnectedStatus() {
  const web3Ready = useWeb3Loaded();
  if (!web3Ready) return null;

  const { isConnected, address } = useAccount();
  if (!isConnected) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        Wallet connected
        {address ? (
          <span className="font-mono text-emerald-400/80">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        ) : null}
      </div>
      <Link href="/dashboard" className="btn-primary w-full justify-center">
        Enter Dashboard <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-lines bg-[size:56px_56px] [mask-image:radial-gradient(60%_55%_at_50%_40%,black,transparent)]" />
        <div className="absolute left-1/2 top-1/4 h-[460px] w-[680px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent-500/15 blur-[110px]" />
      </div>

      {/* brand mark top-left */}
      <Link
        href={withBasePath("/home")}
        className="absolute left-6 top-6 flex items-center gap-2.5"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-600 shadow-glow">
          <Hexagon className="h-5 w-5 text-white" strokeWidth={2.4} />
        </span>
        <span className="font-display text-xl font-bold text-white">LAE</span>
      </Link>

      {/* centered card */}
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease }}
        className="glass relative w-full max-w-md p-8 text-center sm:p-10"
      >
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-400/30 to-accent-600/30 shadow-glow">
          <Hexagon className="h-7 w-7 text-white" strokeWidth={2.2} />
        </div>

        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Welcome back
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
          Connect your wallet to sign in to LAE — track your downline, claim
          rewards and manage your&nbsp;$LAE.
        </p>

        {/* wallet connect — the only sign-in path */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="w-full [&_button]:w-full [&_button]:justify-center [&>div]:w-full">
            <ConnectWallet full variant="primary" />
          </div>

          <ConnectedStatus />
        </div>

        {/* supported wallets */}
        <div className="mt-7">
          <p className="text-[11px] uppercase tracking-widest text-slate-600">
            Supported wallets
          </p>
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
            {wallets.map((w, i) => (
              <span key={w} className="flex items-center gap-3">
                {i > 0 && <span className="text-slate-700">·</span>}
                {w}
              </span>
            ))}
          </div>
        </div>

        {/* trust badges */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/5 pt-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-400" /> CertiK Audited
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Non-custodial
          </span>
          <span>124,800+ members</span>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-slate-600">
          By connecting you agree to our{" "}
          <Link href="/terms" className="underline hover:text-slate-400">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-slate-400">
            Privacy Policy
          </Link>
          .
        </p>
      </motion.div>

      <p className="absolute bottom-6 text-xs text-slate-600">
        New to Web3 wallets?{" "}
        <a
          href="https://ethereum.org/en/wallets/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-300 hover:text-brand-200"
        >
          Learn how to get one
        </a>
      </p>
    </main>
  );
}
