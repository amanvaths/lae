"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAccount, useBalance, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2, AlertTriangle, Wallet, ExternalLink } from "lucide-react";
import { formatEther, parseEther, type PublicClient } from "viem";
import { LAE_CONTRACTS } from "@/lib/lae-club/contracts";
import { laeClubMatrixAbi } from "@/lib/lae-club/matrix-core-abi";
import { erc20Abi } from "@/lib/contracts/abis/erc20";
import { LAE_USER_QUERY_KEY } from "@/lib/lae-club/query-keys";
import { parseLaeUserId, useLaeLevelPrices, useLaeUser } from "@/lib/lae-club/hooks";
import { withLookupTimeout, isValidReferrerId } from "@/lib/lae-club/user-lookup";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/paths";
import { useToast } from "@/providers/ToastProvider";
import { formatWalletError } from "@/lib/wallet/errors";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { truncateAddress } from "@/lib/format";

const REG_GAS_BUFFER_BPS = 1250n; // +25% over estimate
const REG_GAS_MIN = 600_000n;
const REG_GAS_MAX = 5_000_000n;

async function estimateRegistrationGas(
  client: PublicClient,
  address: `0x${string}`,
  referrerId: bigint
): Promise<bigint> {
  const estimated = await client.estimateContractGas({
    address: LAE_CONTRACTS.matrix,
    abi: laeClubMatrixAbi,
    functionName: "registrationExt",
    args: [referrerId],
    account: address,
  });
  const withBuffer = (estimated * REG_GAS_BUFFER_BPS) / 1000n;
  if (withBuffer < REG_GAS_MIN) return REG_GAS_MIN;
  if (withBuffer > REG_GAS_MAX) return REG_GAS_MAX;
  return withBuffer;
}

type RegPhase = "idle" | "approve" | "register" | "verify" | "success";

const STEPS: { key: RegPhase; label: string; desc: string }[] = [
  { key: "approve", label: "Approving", desc: "Approve BUSD token spend" },
  { key: "register", label: "Registering", desc: "Submitting registration transaction" },
  { key: "verify", label: "Verifying", desc: "Confirming on-chain registration" },
  { key: "success", label: "Success", desc: "Registration complete!" },
];

async function waitForRegistration(
  refetch: () => void,
  getRegistered: () => boolean,
  maxMs = 10_000
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    refetch();
    if (getRegistered()) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return getRegistered();
}

export function LaeRegisterPanel({ luxury = false }: { luxury?: boolean }) {
  const { address } = useAccount();
  const client = usePublicClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const user = useLaeUser();
  const prices = useLaeLevelPrices();
  const { writeContractAsync } = useWriteContract();
  const tokenBalance = useReadContract({
    address: LAE_CONTRACTS.payment,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 10_000 },
  });
  const tokenAllowance = useReadContract({
    address: LAE_CONTRACTS.payment,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, LAE_CONTRACTS.matrix] : undefined,
    query: { enabled: !!address, staleTime: 10_000 },
  });
  const nativeBalance = useBalance({ address, query: { enabled: !!address, staleTime: 10_000 } });
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<RegPhase>("idle");
  const [referrerId, setReferrerId] = useState("1");
  const [refError, setRefError] = useState<string | null>(null);
  const [refValid, setRefValid] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(false);
  const registeredRef = useRef(false);

  useEffect(() => {
    registeredRef.current = user.registered;
  }, [user.registered]);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && /^\d+$/.test(ref)) setReferrerId(ref);
  }, [searchParams]);

  const level1Price = prices.prices?.find((p) => p.level === 1)?.price;
  const priceLabel = prices.prices?.find((p) => p.level === 1)?.priceFormatted ?? "—";
  const paymentBal = tokenBalance.data ?? 0n;
  const allowance = tokenAllowance.data ?? 0n;
  const hasEnoughToken = level1Price != null && paymentBal >= level1Price;
  const hasAllowance = level1Price != null && allowance >= level1Price;
  const hasGas = (nativeBalance.data?.value ?? 0n) > parseEther("0.005");

  const validateReferrer = useCallback(async (): Promise<boolean> => {
    if (!client) return false;
    const id = parseLaeUserId(referrerId);
    if (!id) {
      setRefError("Invalid Referral ID");
      setRefValid(false);
      return false;
    }
    setValidating(true);
    try {
      const valid = await withLookupTimeout(isValidReferrerId(client, id), 3_000);
      setRefValid(valid);
      if (!valid) {
        setRefError("Referral ID not found on-chain");
        return false;
      }
      setRefError(null);
      return true;
    } catch {
      setRefError("Could not verify — try again");
      setRefValid(false);
      return false;
    } finally {
      setValidating(false);
    }
  }, [client, referrerId]);

  async function handleFaucet() {
    if (!address || !client) return;
    setPending(true);
    setPhase("idle");
    try {
      const hash = await writeContractAsync({
        address: LAE_CONTRACTS.payment,
        abi: erc20Abi,
        functionName: "faucet",
        args: [parseEther("100")],
      });
      await client.waitForTransactionReceipt({ hash });
      push("Test BUSD minted — you can register now", "success");
      await tokenBalance.refetch();
    } catch (e) {
      push(formatWalletError(e), "error");
    } finally {
      setPending(false);
    }
  }

  async function handleRegister() {
    if (!address || !level1Price || !client) return;

    if (user.registered) {
      push("This wallet is already registered — open your dashboard", "error");
      return;
    }

    const refOk = await validateReferrer();
    if (!refOk) return;

    if (!hasEnoughToken) {
      push(
        `Need at least ${formatEther(level1Price)} BUSD. Balance: ${formatEther(paymentBal)}`,
        "error"
      );
      return;
    }
    if (!hasGas) {
      push("Need BNB on BSC Testnet for gas (at least ~0.005 BNB recommended)", "error");
      return;
    }

    setPending(true);
    setPhase("idle");
    try {
      const refId = BigInt(referrerId || "1");

      let currentAllowance = allowance;
      if (currentAllowance < level1Price) {
        setPhase("approve");
        push("Confirm token approval in MetaMask…", "info");
        const approveHash = await writeContractAsync({
          address: LAE_CONTRACTS.payment,
          abi: erc20Abi,
          functionName: "approve",
          args: [LAE_CONTRACTS.matrix, level1Price],
        });
        await client.waitForTransactionReceipt({ hash: approveHash });
        currentAllowance = await client.readContract({
          address: LAE_CONTRACTS.payment,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, LAE_CONTRACTS.matrix],
        });
        await tokenAllowance.refetch();
      }

      if (currentAllowance < level1Price) {
        throw new Error("Approval did not complete — try again");
      }

      setPhase("register");
      push("Confirm registration in MetaMask…", "info");

      // Simulate first — surfaces revert reason before MetaMask opens
      await client.simulateContract({
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        functionName: "registrationExt",
        args: [refId],
        account: address,
      });

      const gasLimit = await estimateRegistrationGas(client, address, refId);

      const regHash = await writeContractAsync({
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        functionName: "registrationExt",
        args: [refId],
        gas: gasLimit,
      });
      await client.waitForTransactionReceipt({ hash: regHash });

      setPhase("verify");
      const confirmed = await waitForRegistration(
        () => user.refetch(),
        () => registeredRef.current
      );

      setPhase("success");
      push(
        confirmed
          ? `Welcome to LAE Club · User ID assigned`
          : "Registration confirmed — opening dashboard",
        "success"
      );

      await queryClient.invalidateQueries({ queryKey: [LAE_USER_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: ["lae-matrix-tree"] });
      await queryClient.invalidateQueries({ queryKey: ["lae-matrix-overview"] });
      await queryClient.invalidateQueries({ queryKey: ["lae-events"] });

      await new Promise((r) => setTimeout(r, 400));
      router.replace(withBasePath("/dashboard"));
    } catch (e) {
      setPhase("idle");
      push(formatWalletError(e), "error");
    } finally {
      setPending(false);
    }
  }

  // Loading prices
  if (prices.isLoading) {
    return luxury ? (
      <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" /> Loading registration…
      </div>
    ) : (
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading level price…
        </div>
      </div>
    );
  }

  // Wallet not connected
  if (!address) {
    return luxury ? (
      <div className="space-y-4">
        <ConnectWallet full variant="primary" luxury />
        <p className="text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link href={withBasePath("/login")} className="font-bold text-[#D4AF37] hover:underline">
            Login
          </Link>
        </p>
        <Link href={withBasePath("/")} className="auth-btn-ghost w-full">
          <ArrowLeft className="h-4 w-4" /> Back Home
        </Link>
      </div>
    ) : (
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-4 text-sm text-slate-400">Connect your wallet to register.</p>
        <ConnectWallet />
      </div>
    );
  }

  // Loading user data
  if (user.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" /> Checking wallet…
      </div>
    );
  }

  // Already registered
  if (user.registered) {
    return luxury ? (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-center"
        >
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
          <p className="mt-2 font-bold text-emerald-400">
            Already Registered
          </p>
          <p className="mt-1 text-xs text-slate-400">
            User ID #{String(user.userId)}
          </p>
        </motion.div>
        <Link
          href={withBasePath("/dashboard")}
          className="auth-btn-gold w-full"
        >
          Open Dashboard
        </Link>
        <Link href={withBasePath("/")} className="auth-btn-ghost w-full">
          <ArrowLeft className="h-4 w-4" /> Back Home
        </Link>
      </div>
    ) : (
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-center text-emerald-400">
          Registered · User ID #{String(user.userId)}
        </p>
        <Link
          href={withBasePath("/dashboard")}
          className="btn-primary mt-4 inline-flex text-sm"
        >
          Open your dashboard
        </Link>
      </div>
    );
  }

  // Main registration form
  return luxury ? (
    <div className="space-y-5">
      {/* Wallet status */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] px-4 py-3"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20">
          <Wallet className="h-4 w-4 text-[#D4AF37]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]/70">Connected Wallet</p>
          <p className="truncate font-mono text-xs font-medium text-white">{truncateAddress(address, 8, 6)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
          BSC
        </span>
      </motion.div>

      {/* Fee & balance */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Registration Fee</span>
          <span className="text-sm font-bold text-[#D4AF37]">{priceLabel} BUSD</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">Your Balance</span>
          <span className={cn(
            "text-sm font-bold",
            hasEnoughToken ? "text-emerald-400" : "text-red-400"
          )}>
            {level1Price ? formatEther(paymentBal) : "—"} BUSD
          </span>
        </div>
        {!hasGas && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Need BNB for gas fees
          </div>
        )}
        {!hasEnoughToken && level1Price && (
          <button
            type="button"
            disabled={pending}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] py-2 text-xs font-semibold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/10 disabled:opacity-50"
            onClick={() => void handleFaucet()}
          >
            <ExternalLink className="h-3 w-3" />
            Get Test BUSD (Faucet)
          </button>
        )}
      </motion.div>

      {/* Referral input */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block">
          <span className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Referral ID</span>
            <AnimatePresence mode="wait">
              {validating && (
                <motion.span
                  key="validating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-[10px] text-slate-500"
                >
                  <Loader2 className="h-3 w-3 animate-spin" /> Validating…
                </motion.span>
              )}
              {!validating && refValid === true && !refError && (
                <motion.span
                  key="valid"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-400"
                >
                  <CheckCircle2 className="h-3 w-3" /> Valid Sponsor Found
                </motion.span>
              )}
              {!validating && refError && (
                <motion.span
                  key="invalid"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-[10px] font-bold text-red-400"
                >
                  <AlertTriangle className="h-3 w-3" /> {refError}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <input
            type="number"
            min={1}
            value={referrerId}
            onChange={(e) => {
              setReferrerId(e.target.value);
              setRefError(null);
              setRefValid(null);
            }}
            onBlur={() => void validateReferrer()}
            disabled={pending}
            placeholder="Enter Referral ID (e.g. 1)"
            className={cn(
              "auth-input",
              refValid === true && !refError && "!border-emerald-500/50",
              refError && "!border-red-500/50"
            )}
          />
        </label>
      </motion.div>

      {/* Progress stepper */}
      <AnimatePresence>
        {pending && phase !== "idle" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <PremiumProgress phase={phase} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <button
          type="button"
          disabled={pending || !level1Price || !hasEnoughToken}
          className="auth-btn-gold w-full"
          onClick={() => void handleRegister()}
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />{" "}
              {phase === "approve"
                ? "Approving BUSD…"
                : phase === "register"
                  ? "Registering…"
                  : phase === "verify"
                    ? "Verifying on-chain…"
                    : phase === "success"
                      ? "Success!"
                      : "Processing…"}
            </>
          ) : (
            `Register — ${priceLabel} BUSD`
          )}
        </button>
      </motion.div>

      {/* Navigation */}
      <p className="text-center text-xs text-slate-500">
        Already registered?{" "}
        <Link href={withBasePath("/login")} className="font-bold text-[#D4AF37] hover:underline">
          Login
        </Link>
      </p>
      <Link href={withBasePath("/")} className="auth-btn-ghost w-full">
        <ArrowLeft className="h-4 w-4" /> Back Home
      </Link>
    </div>
  ) : (
    /* Non-luxury fallback — dashboard register panel */
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <ConnectWallet full variant="primary" />
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
        <p className="text-slate-300">
          Fee: <span className="font-semibold text-[#D4AF37]">{priceLabel} BUSD</span>
        </p>
        <p className="mt-1 text-slate-400">
          Balance:{" "}
          <span className={hasEnoughToken ? "text-emerald-400" : "text-red-400"}>
            {level1Price ? formatEther(paymentBal) : "—"} BUSD
          </span>
        </p>
        {!hasEnoughToken && level1Price && (
          <button
            type="button"
            disabled={pending}
            className="mt-2 text-xs text-[#D4AF37] hover:underline disabled:opacity-50"
            onClick={() => void handleFaucet()}
          >
            Get Test BUSD (faucet)
          </button>
        )}
      </div>
      <label className="block text-xs font-medium text-slate-400">
        Referral ID
        <input
          type="number"
          min={1}
          value={referrerId}
          onChange={(e) => {
            setReferrerId(e.target.value);
            setRefError(null);
            setRefValid(null);
          }}
          onBlur={() => void validateReferrer()}
          disabled={pending}
          className="auth-input mt-1.5"
        />
      </label>
      {refError && <p className="text-xs text-red-400">{refError}</p>}
      {refValid === true && !refError && (
        <p className="text-xs text-emerald-400">Referral ID verified</p>
      )}
      {pending && phase !== "idle" && <PremiumProgress phase={phase} />}
      <button
        type="button"
        disabled={pending || !level1Price || !hasEnoughToken}
        className="btn-primary w-full disabled:opacity-50"
        onClick={() => void handleRegister()}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />{" "}
            {phase === "approve"
              ? "Approve…"
              : phase === "register"
                ? "Registering…"
                : phase === "verify"
                  ? "Verifying…"
                  : "Processing…"}
          </>
        ) : (
          `Register (${priceLabel} BUSD)`
        )}
      </button>
    </div>
  );
}

function PremiumProgress({ phase }: { phase: RegPhase }) {
  const order: RegPhase[] = ["approve", "register", "verify", "success"];
  const currentIdx = order.indexOf(phase);

  return (
    <div className="rounded-xl border border-[#D4AF37]/25 bg-gradient-to-b from-[#D4AF37]/[0.06] to-transparent p-4">
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const done = currentIdx > i || phase === "success";
          const active = order[i] === phase;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                active && "bg-[#D4AF37]/10",
                done && "bg-emerald-500/5"
              )}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              ) : active ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#D4AF37]" />
              ) : (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20">
                  <span className="text-[9px] font-bold text-slate-500">{i + 1}</span>
                </div>
              )}
              <div>
                <span
                  className={cn(
                    "block text-xs font-bold",
                    done && "text-emerald-400",
                    active && "text-[#D4AF37]",
                    !done && !active && "text-slate-500"
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-600">{step.desc}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
