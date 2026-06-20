"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import { Loader2 } from "lucide-react";
import { Panel } from "@/components/dashboard/ui";
import { LAE_CONTRACTS } from "@/lib/lae-club/contracts";
import { laeClubMatrixAbi } from "@/lib/lae-club/abis";
import { erc20Abi } from "@/lib/contracts/abis/erc20";
import { useLaeLevelPrices, useLaeUser } from "@/lib/lae-club/hooks";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/paths";
import { useToast } from "@/providers/ToastProvider";

export function LaeRegisterPanel() {
  const { address } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const user = useLaeUser();
  const prices = useLaeLevelPrices();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState(false);
  const [referrerId, setReferrerId] = useState("1");

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

  async function handleRegister() {
    if (!address || !level1Price) return;
    setPending(true);
    try {
      const refId = BigInt(referrerId || "1");
      push("Approve payment token…", "info");
      await writeContractAsync({
        address: LAE_CONTRACTS.payment,
        abi: erc20Abi,
        functionName: "approve",
        args: [LAE_CONTRACTS.matrix, level1Price],
      });
      push("Register on LAE Club…", "info");
      const hash = await writeContractAsync({
        address: LAE_CONTRACTS.matrix,
        abi: laeClubMatrixAbi,
        functionName: "registrationExt",
        args: [refId],
      });
      push(`Registration submitted: ${hash.slice(0, 10)}…`, "success");
      user.refetch();
      router.replace(withBasePath("/dashboard"));
    } catch (e) {
      push(e instanceof Error ? e.message : "Registration failed", "error");
    } finally {
      setPending(false);
    }
  }

  const priceLabel = prices.prices?.find((p) => p.level === 1)?.priceFormatted ?? "—";

  return (
    <Panel title="Register on LAE Club">
      <p className="mb-3 text-sm text-slate-400">
        Connected: <span className="font-mono text-white">{address}</span>
      </p>
      <label className="mb-3 block text-xs text-slate-500">
        Sponsor ID (referrer user ID on-chain)
        <input
          type="number"
          min={1}
          value={referrerId}
          onChange={(e) => setReferrerId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-white outline-none focus:border-brand-500/50"
        />
      </label>
      <button
        type="button"
        disabled={pending || !address || !level1Price}
        className="btn-primary w-full disabled:opacity-50"
        onClick={handleRegister}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Registering…
          </>
        ) : (
          `Register (${priceLabel} payment token · levelTokenCost(1))`
        )}
      </button>
    </Panel>
  );
}
