"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAccount, useBalance, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { formatEther, parseEther } from "viem";
import { Panel } from "@/components/dashboard/ui";
import { LAE_CONTRACTS } from "@/lib/lae-club/contracts";
import { laeClubMatrixAbi } from "@/lib/lae-club/abis";
import { erc20Abi } from "@/lib/contracts/abis/erc20";
import { parseLaeUserId, useLaeLevelPrices, useLaeUser } from "@/lib/lae-club/hooks";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/paths";
import { useToast } from "@/providers/ToastProvider";
import { formatWalletError } from "@/lib/wallet/errors";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { isValidReferrerId, withLookupTimeout } from "@/lib/lae-club/user-lookup";
import { cn } from "@/lib/utils";

const MAX_UINT256 = 2n ** 256n - 1n;
const REG_GAS_LIMIT = 12_000_000n;

type RegPhase = "idle" | "approve" | "register" | "verify" | "success";

const STEPS: { key: RegPhase; label: string }[] = [
  { key: "approve", label: "Approve" },
  { key: "register", label: "Registering" },
  { key: "verify", label: "Verifying" },
  { key: "success", label: "Success" },
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
  const hasGas = (nativeBalance.data?.value ?? 0n) > parseEther("0.001");

  async function validateReferrer(): Promise<boolean> {
    if (!client) return false;
    const id = parseLaeUserId(referrerId);
    if (!id) {
      setRefError("Invalid Referral ID");
      setRefValid(false);
      return false;
    }
    try {
      const valid = await withLookupTimeout(isValidReferrerId(client, id), 3_000);
      setRefValid(valid);
      if (!valid) {
        setRefError("Invalid Referral ID");
        return false;
      }
      setRefError(null);
      return true;
    } catch {
      setRefError("Could not verify referral — try again");
      setRefValid(false);
      return false;
    }
  }

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
      push("Need BNB on BSC Testnet for gas", "error");
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
          args: [LAE_CONTRACTS.matrix, MAX_UINT256],
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
      const regHash = await writeContractAsync({
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        functionName: "registrationExt",
        args: [refId],
        gas: REG_GAS_LIMIT,
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

      await new Promise((r) => setTimeout(r, 800));
      router.replace(withBasePath("/dashboard"));
    } catch (e) {
      setPhase("idle");
      push(formatWalletError(e), "error");
    } finally {
      setPending(false);
    }
  }

  const Wrap = luxury ? "div" : Panel;
  const wrapProps = luxury
    ? { className: "space-y-4" }
    : { title: "Register on LAE Club", className: undefined };

  if (prices.isLoading) {
    return luxury ? (
      <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" /> Loading…
      </div>
    ) : (
      <Panel title="Registration">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading level price…
        </div>
      </Panel>
    );
  }

  if (!address) {
    return (
      <Wrap {...(wrapProps as object)}>
        {luxury ? (
          <>
            <ConnectWallet full variant="primary" luxury />
            <Link href={withBasePath("/")} className="auth-btn-ghost w-full">
              <ArrowLeft className="h-4 w-4" /> Back Home
            </Link>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-400">Connect your wallet to register.</p>
            <ConnectWallet />
          </>
        )}
      </Wrap>
    );
  }

  if (user.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" /> Checking wallet…
      </div>
    );
  }

  if (user.registered) {
    return (
      <Wrap {...(wrapProps as object)}>
        <p className="text-center text-emerald-400">
          Registered · User ID #{String(user.userId)}
        </p>
        <Link
          href={withBasePath("/dashboard")}
          className={luxury ? "auth-btn-gold mt-4 w-full" : "btn-primary mt-4 inline-flex text-sm"}
        >
          Open your dashboard
        </Link>
      </Wrap>
    );
  }

  return (
    <Wrap {...(wrapProps as object)}>
      {luxury && <ConnectWallet full variant="primary" luxury />}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
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

      {pending && phase !== "idle" && (
        <RegProgress phase={phase} />
      )}

      <button
        type="button"
        disabled={pending || !level1Price || !hasEnoughToken}
        className={luxury ? "auth-btn-gold w-full" : "btn-primary w-full disabled:opacity-50"}
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

      {luxury && (
        <>
          <p className="text-center text-xs text-slate-500">
            Already registered?{" "}
            <Link href={withBasePath("/login")} className="text-[#D4AF37] hover:underline">
              Login
            </Link>
          </p>
          <Link href={withBasePath("/")} className="auth-btn-ghost w-full">
            <ArrowLeft className="h-4 w-4" /> Back Home
          </Link>
        </>
      )}
    </Wrap>
  );
}

function RegProgress({ phase }: { phase: RegPhase }) {
  const order: RegPhase[] = ["approve", "register", "verify", "success"];
  const currentIdx = order.indexOf(phase);

  return (
    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const done = currentIdx > i || phase === "success";
          const active = order[i] === phase;
          return (
            <div key={step.key} className="flex items-center gap-2 text-xs">
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : active ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#D4AF37]" />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border border-white/20" />
              )}
              <span
                className={cn(
                  done && "text-emerald-400",
                  active && "font-semibold text-[#D4AF37]",
                  !done && !active && "text-slate-500"
                )}
              >
                {step.label}…
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
