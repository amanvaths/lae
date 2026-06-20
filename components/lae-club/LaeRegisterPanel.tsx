"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useBalance, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { Loader2 } from "lucide-react";
import { formatEther, parseEther } from "viem";
import { Panel } from "@/components/dashboard/ui";
import { LAE_CONTRACTS } from "@/lib/lae-club/contracts";
import { laeClubMatrixAbi } from "@/lib/lae-club/abis";
import { erc20Abi } from "@/lib/contracts/abis/erc20";
import { useLaeLevelPrices, useLaeUser } from "@/lib/lae-club/hooks";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/paths";
import { useToast } from "@/providers/ToastProvider";
import { formatWalletError } from "@/lib/wallet/errors";

const MAX_UINT256 = 2n ** 256n - 1n;
const REG_GAS_LIMIT = 12_000_000n;

async function waitForRegistration(
  refetch: () => void,
  getRegistered: () => boolean,
  maxMs = 30_000
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    refetch();
    if (getRegistered()) return true;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return getRegistered();
}

export function LaeRegisterPanel() {
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
  const nativeBalance = useBalance({ address, query: { enabled: !!address, staleTime: 10_000 } });
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState("1");
  const registeredRef = useRef(false);

  useEffect(() => {
    registeredRef.current = user.registered;
  }, [user.registered]);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && /^\d+$/.test(ref)) setReferrerId(ref);
  }, [searchParams]);

  const level1Price = prices.prices?.find((p) => p.level === 1)?.price;

  if (user.isLoading || prices.isLoading) {
    return (
      <Panel title="Registration">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading levelTokenCost(1)…
        </div>
      </Panel>
    );
  }

  if (user.registered) {
    return (
      <Panel title="Registration">
        <p className="text-emerald-400">Registered · User ID #{String(user.userId)}</p>
      </Panel>
    );
  }

  const paymentBal = tokenBalance.data ?? 0n;
  const hasEnoughToken = level1Price != null && paymentBal >= level1Price;
  const hasGas = (nativeBalance.data?.value ?? 0n) > parseEther("0.001");

  async function handleFaucet() {
    if (!address || !client) return;
    setPending(true);
    setStep("Minting test BUSD from faucet…");
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
      setStep(null);
    }
  }

  async function handleRegister() {
    if (!address || !level1Price || !client) return;

    if (!hasEnoughToken) {
      push(
        `Need at least ${formatEther(level1Price)} BUSD (testnet payment token). Balance: ${formatEther(paymentBal)}`,
        "error"
      );
      return;
    }
    if (!hasGas) {
      push("Need BNB on BSC Testnet for gas — get free test BNB from https://testnet.bnbchain.org/faucet-smart", "error");
      return;
    }

    setPending(true);
    setStep(null);
    try {
      const refId = BigInt(referrerId || "1");

      await client.simulateContract({
        account: address,
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        functionName: "registrationExt",
        args: [refId],
      });

      setStep("Approve payment token in your wallet…");
      push("Approve payment token…", "info");
      const approveHash = await writeContractAsync({
        address: LAE_CONTRACTS.payment,
        abi: erc20Abi,
        functionName: "approve",
        args: [LAE_CONTRACTS.matrix, MAX_UINT256],
      });
      await client.waitForTransactionReceipt({ hash: approveHash });

      setStep("Confirm registration in your wallet…");
      push("Register on LAE Club…", "info");
      const regHash = await writeContractAsync({
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        functionName: "registrationExt",
        args: [refId],
        gas: REG_GAS_LIMIT,
      });
      await client.waitForTransactionReceipt({ hash: regHash });
      push(`Registration confirmed: ${regHash.slice(0, 10)}…`, "success");

      setStep("Verifying on-chain registration…");
      const confirmed = await waitForRegistration(
        () => user.refetch(),
        () => registeredRef.current
      );
      if (!confirmed) {
        push("Registration confirmed on-chain but profile sync is slow — open dashboard to refresh.", "info");
      }
      router.replace(withBasePath("/dashboard"));
    } catch (e) {
      const message = formatWalletError(e);
      setStep(null);
      push(message, "error");
    } finally {
      setPending(false);
      setStep(null);
    }
  }

  const priceLabel = prices.prices?.find((p) => p.level === 1)?.priceFormatted ?? "—";

  return (
    <Panel title="Register on LAE Club">
      <p className="mb-3 text-sm text-slate-400">
        Connected: <span className="font-mono text-white">{address}</span>
      </p>
      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
        <p className="text-slate-300">
          Registration fee: <span className="font-semibold text-brand-200">{priceLabel} BUSD</span>{" "}
          <span className="text-slate-500">(levelTokenCost(1) on-chain)</span>
        </p>
        <p className="mt-1 text-slate-400">
          Your BUSD balance:{" "}
          <span className={hasEnoughToken ? "text-emerald-400" : "text-red-400"}>
            {level1Price ? formatEther(paymentBal) : "—"} BUSD
          </span>
        </p>
        {!hasEnoughToken && level1Price && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-amber-300/90">
              Approval alone is not enough — you must hold at least {priceLabel} BUSD before registering.
            </p>
            <button
              type="button"
              disabled={pending}
              className="rounded-lg border border-brand-500/40 px-3 py-1.5 text-xs text-brand-200 hover:bg-brand-500/10 disabled:opacity-50"
              onClick={() => void handleFaucet()}
            >
              Mint test BUSD (faucet)
            </button>
          </div>
        )}
      </div>
      <label className="mb-3 block text-xs text-slate-500">
        Sponsor ID (referrer user ID on-chain)
        <input
          type="number"
          min={1}
          value={referrerId}
          onChange={(e) => setReferrerId(e.target.value)}
          disabled={pending}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-white outline-none focus:border-brand-500/50 disabled:opacity-60"
        />
      </label>
      {step && (
        <p className="mb-3 flex items-center gap-2 text-sm text-brand-200">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          {step}
        </p>
      )}
      <button
        type="button"
        disabled={pending || !address || !level1Price || !hasEnoughToken}
        className="btn-primary w-full disabled:opacity-50"
        onClick={() => void handleRegister()}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Registering…
          </>
        ) : (
          `Register (${priceLabel} BUSD fee)`
        )}
      </button>
    </Panel>
  );
}
