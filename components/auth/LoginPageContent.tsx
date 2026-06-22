"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, Loader2, Wallet } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LoginConnectPanel } from "@/components/web3/LoginConnectPanel";
import { LoginGate } from "@/components/auth/LoginGate";
import { withBasePath } from "@/lib/paths";
import { parseLaeUserId } from "@/lib/lae-club/hooks";
import {
  lookupLaeUserByAddress,
  lookupLaeUserById,
  withLookupTimeout,
  type LaeUserLookup,
} from "@/lib/lae-club/user-lookup";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import { isAddress } from "viem";

type ViewMode = "id" | "wallet";

export function LoginPageContent() {
  const client = usePublicClient();
  const [viewMode, setViewMode] = useState<ViewMode>("id");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LaeUserLookup | null>(null);

  const handleView = useCallback(async () => {
    if (!client) {
      setError("Network not ready — refresh the page");
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      let user: LaeUserLookup | null = null;

      if (viewMode === "id") {
        const id = parseLaeUserId(input);
        if (!id) {
          setError("Enter a valid User ID (1, 2, 3…)");
          return;
        }
        user = await withLookupTimeout(lookupLaeUserById(client, id));
        if (!user) setError(`User ID #${id.toString()} not found on-chain`);
      } else {
        if (!isAddress(input.trim())) {
          setError("Enter a valid wallet address (0x…)");
          return;
        }
        user = await withLookupTimeout(lookupLaeUserByAddress(client, input.trim()));
        if (!user) setError("Wallet not registered on LAE Club Matrix");
      }

      if (user) setResult(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, [client, input, viewMode]);

  return (
    <>
      <div className="mb-6 text-center">
        <BrandLogo size={56} className="mx-auto" />
        <h1 className="mt-4 font-display text-xl font-bold text-white sm:text-2xl">
          Welcome Back To{" "}
          <span className="text-gradient-gold">LAE Club</span>
        </h1>
        <p className="mt-2 text-xs text-slate-500">MetaMask · WalletConnect · Trust Wallet</p>
      </div>

      <LoginGate>
        <LoginConnectPanel />
      </LoginGate>

      <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* View mode toggle */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["id", "wallet"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setViewMode(mode);
              setInput("");
              setError(null);
              setResult(null);
            }}
            className={cn(
              "rounded-xl border py-2.5 text-xs font-semibold transition-all",
              viewMode === mode
                ? "border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37]"
                : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20"
            )}
          >
            {mode === "id" ? "View By User ID" : "View By Wallet Address"}
          </button>
        ))}
      </div>

      <label className="mb-3 block text-xs font-medium text-slate-400">
        {viewMode === "id" ? "User ID" : "Wallet Address"}
        <input
          type={viewMode === "id" ? "number" : "text"}
          inputMode={viewMode === "id" ? "numeric" : "text"}
          placeholder={viewMode === "id" ? "Enter User ID" : "Enter Wallet Address"}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && void handleView()}
          className="auth-input mt-1.5"
        />
      </label>

      {error && (
        <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={loading || !input.trim()}
        onClick={() => void handleView()}
        className="auth-btn-gold mb-4 w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" /> View
          </>
        )}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5"
          >
            <div className="space-y-2 p-4 text-sm">
              <Row label="User ID" value={`#${result.userId.toString()}`} gold />
              <Row label="Wallet" value={truncateAddress(result.wallet, 6, 4)} mono />
              <Row label="Referrer ID" value={`#${result.referrerId.toString()}`} />
              <Row label="Active Levels" value={String(result.activeLevels)} />
              <Row label="Team Count" value={result.teamSize.toString()} />
              <Row label="Direct Team" value={result.directCount.toString()} />
              <Row label="Total Income" value={`${fmtEther(result.totalIncome)} BUSD`} gold />
              <Link
                href={withBasePath(`/view?id=${result.userId.toString()}`)}
                className="auth-btn-ghost mt-2 w-full !py-2.5 text-xs"
              >
                <Wallet className="h-3.5 w-3.5" /> Open Full Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mb-4 text-center text-xs text-slate-500">
        New to LAE Club?{" "}
        <Link href={withBasePath("/register")} className="font-semibold text-[#D4AF37] hover:underline">
          Register your account
        </Link>
      </p>

      <Link href={withBasePath("/")} className="auth-btn-ghost w-full">
        <ArrowLeft className="h-4 w-4" /> Back Home
      </Link>
    </>
  );
}

function Row({
  label,
  value,
  gold,
  mono,
}: {
  label: string;
  value: string;
  gold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span
        className={cn(
          "font-semibold",
          gold && "text-[#D4AF37]",
          mono && "font-mono text-xs",
          !gold && !mono && "text-white"
        )}
      >
        {value}
      </span>
    </div>
  );
}
