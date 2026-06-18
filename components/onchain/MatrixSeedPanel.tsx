"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { parseEther } from "viem";
import { usePublicClient } from "wagmi";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Panel, Pill } from "@/components/dashboard/ui";
import {
  useClubPackagesOnChain,
  usePackagePricesOnChain,
  usePendingQueue,
  useSensoUser,
  useWalletOnChain,
} from "@/lib/contracts/hooks";
import {
  useApproveDaiAndWait,
  useDaiAllowance,
  useDaiFaucet,
  useProcessPending,
  usePurchaseClubAndWait,
  useRegisterAndWait,
} from "@/lib/contracts/hooks/useWrites";
import { fmtEther } from "@/lib/contracts/format";
import { CONTRACTS } from "@/lib/contracts/addresses";
import { sensoLimitlessAbi } from "@/lib/contracts/abis";
import { getSponsorFromUrl } from "@/lib/contracts/services/utils";
import { readClubPackages, readSensoUser } from "@/lib/contracts/services/reader";
import { erc20Abi } from "@/lib/contracts/abis/erc20";
import { useQueryClient } from "@tanstack/react-query";
import { contractKeys } from "@/lib/contracts/query-keys";
import { useAccount } from "wagmi";
import { truncateAddress } from "@/lib/format";
import { useToast } from "@/providers/ToastProvider";

type StepKey = "register" | "faucet" | "approve" | "purchase" | "process";

function StepRow({
  index,
  done,
  active,
  label,
  hint,
  action,
}: {
  index: number;
  done: boolean;
  active: boolean;
  label: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border px-3 py-3 ${
        active ? "border-brand-500/40 bg-brand-500/5" : "border-white/5 bg-white/[0.02]"
      }`}
    >
      <div className="flex gap-3">
        {done ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        ) : (
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              active ? "bg-brand-500 text-ink-950" : "bg-white/10 text-slate-400"
            }`}
          >
            {index}
          </span>
        )}
        <div>
          <p className={`text-sm font-medium ${done ? "text-emerald-300" : "text-white"}`}>{label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
        </div>
      </div>
      {!done && action}
    </div>
  );
}

/**
 * One guided flow for every user: register (if needed) → mDAI → approve → Club L1 → process queue.
 */
export function MatrixSeedPanel() {
  const { address } = useAccount();
  const client = usePublicClient();
  const qc = useQueryClient();
  const { push: toast } = useToast();
  const urlSponsor = getSponsorFromUrl();

  const user = useSensoUser();
  const wallet = useWalletOnChain();
  const allowance = useDaiAllowance();
  const club = useClubPackagesOnChain();
  const pending = usePendingQueue();
  const prices = usePackagePricesOnChain();

  const register = useRegisterAndWait();
  const faucet = useDaiFaucet();
  const approve = useApproveDaiAndWait();
  const purchaseClub = usePurchaseClubAndWait();
  const { run: processPending, processing } = useProcessPending();

  const [busyStep, setBusyStep] = useState<StepKey | "all" | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);

  const clubL1Price = prices.data?.club.find((p) => p.level === 1)?.amount ?? parseEther("5");
  const daiWallet = wallet.data?.daiWallet ?? 0n;
  const daiAllowance = allowance.data ?? 0n;
  const ownsClubL1 = club.data?.some((p) => p.level === 1) ?? false;
  const pendingCount = Number(pending.data ?? 0n);
  const registered = user.data?.registered ?? false;

  const steps = useMemo(() => {
    const list: { key: StepKey; label: string; hint: string; done: boolean }[] = [];

    if (!registered) {
      list.push({
        key: "register",
        label: "Register your wallet",
        hint: urlSponsor
          ? `Join with sponsor ${truncateAddress(urlSponsor)}`
          : "Required once before your first purchase",
        done: false,
      });
    }

    list.push(
      {
        key: "faucet",
        label: "Get test mDAI",
        hint: `Free 100 mDAI — Club L1 costs ${fmtEther(clubL1Price)} mDAI`,
        done: daiWallet >= clubL1Price,
      },
      {
        key: "approve",
        label: "Allow contract to spend mDAI",
        hint: "One-time wallet approval (safe on testnet)",
        done: daiAllowance >= clubL1Price,
      },
      {
        key: "purchase",
        label: "Buy Club Level 1",
        hint: `${fmtEther(clubL1Price)} mDAI deducted from your wallet`,
        done: ownsClubL1,
      },
      {
        key: "process",
        label: "Activate your matrix",
        hint: "Places you in the Club matrix on-chain",
        done: ownsClubL1 && pendingCount === 0,
      }
    );

    return list;
  }, [
    registered,
    urlSponsor,
    clubL1Price,
    daiWallet,
    daiAllowance,
    ownsClubL1,
    pendingCount,
  ]);

  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.done).length;
  const allDone = completedSteps === totalSteps;
  const running = busyStep !== null || processing;
  const currentStep = steps.find((s) => !s.done);

  async function refresh() {
    if (!address) return;
    await Promise.all([
      qc.invalidateQueries({ queryKey: contractKeys.wallet(address) }),
      qc.invalidateQueries({ queryKey: contractKeys.user(address) }),
      qc.invalidateQueries({ queryKey: contractKeys.club(address) }),
      qc.invalidateQueries({ queryKey: contractKeys.pending() }),
    ]);
    await Promise.all([allowance.refetch(), user.refetch(), club.refetch(), wallet.refetch()]);
  }

  async function readFreshState() {
    if (!client || !address) {
      return {
        registered,
        daiWallet,
        daiAllowance,
        ownsClubL1,
        pendingCount,
      };
    }
    const [u, bal, allow, pendingLen, packages] = await Promise.all([
      readSensoUser(client, address),
      client.readContract({
        address: CONTRACTS.dai,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      }),
      client.readContract({
        address: CONTRACTS.dai,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, CONTRACTS.senso],
      }),
      client.readContract({
        address: CONTRACTS.senso,
        abi: sensoLimitlessAbi,
        functionName: "pendingLength",
      }),
      readClubPackages(client, address),
    ]);
    return {
      registered: u.registered,
      daiWallet: bal,
      daiAllowance: allow,
      ownsClubL1: packages.some((p) => p.level === 1),
      pendingCount: Number(pendingLen),
    };
  }


  async function runStep(key: StepKey) {
    setBusyStep(key);
    try {
      if (key === "register") {
        await register(urlSponsor);
      } else if (key === "faucet") {
        await faucet("100");
      } else if (key === "approve") {
        await approve();
      } else if (key === "purchase") {
        if (!registered) throw new Error("Register first");
        await purchaseClub(1);
      } else if (key === "process") {
        if (!ownsClubL1) throw new Error("Purchase Club L1 first");
        await processPending();
      }
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Step failed", "error");
    } finally {
      setBusyStep(null);
    }
  }

  function canRunStep(key: StepKey): boolean {
    if (key === "register") return !registered;
    if (key === "faucet") return daiWallet < clubL1Price;
    if (key === "approve") return daiAllowance < clubL1Price && daiWallet >= clubL1Price;
    if (key === "purchase") return registered && daiAllowance >= clubL1Price && !ownsClubL1;
    if (key === "process") return ownsClubL1 && pendingCount > 0;
    return false;
  }

  async function activateAll() {
    setBusyStep("all");
    try {
      let state = await readFreshState();

      if (!state.registered) {
        setStatusLabel("Step 1 — Registering your wallet…");
        await register(urlSponsor);
        await refresh();
        state = await readFreshState();
      }

      if (state.daiWallet < clubL1Price) {
        setStatusLabel(`Step ${registered ? 1 : 2} — Getting test mDAI…`);
        await faucet("100");
        await refresh();
        state = await readFreshState();
      }

      if (state.daiAllowance < clubL1Price) {
        setStatusLabel("Allowing contract to use mDAI…");
        await approve();
        await refresh();
        state = await readFreshState();
      }

      if (!state.ownsClubL1) {
        setStatusLabel("Buying Club Level 1…");
        await purchaseClub(1);
        await refresh();
        state = await readFreshState();
      }

      if (state.pendingCount > 0 || !state.ownsClubL1) {
        setStatusLabel("Activating your matrix…");
        await processPending();
        await refresh();
      }

      toast("Club Level 1 activated!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Activation failed", "error");
    } finally {
      setBusyStep(null);
      setStatusLabel(null);
    }
  }

  return (
    <Panel
      title="Activate Club Level 1"
      desc="New users: one button does everything. Confirm each popup in your wallet."
      action={allDone ? <Pill tone="emerald">Active</Pill> : <Pill tone="gold">{completedSteps}/{totalSteps} done</Pill>}
    >
      {!allDone && (
        <div className="mb-5 rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-transparent p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">
                {currentStep ? `Next: ${currentStep.label}` : "Almost there"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                MetaMask / Trust Wallet will ask you to confirm {totalSteps - completedSteps} or fewer
                transactions. You need a little test BNB for gas.
              </p>
              {statusLabel && (
                <p className="mt-2 flex items-center gap-2 text-xs text-brand-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {statusLabel}
                </p>
              )}
              <button
                type="button"
                disabled={running}
                onClick={activateAll}
                className="btn-primary mt-4 w-full disabled:opacity-50 sm:w-auto"
              >
                {busyStep === "all" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Activating…
                  </>
                ) : (
                  "Activate Club L1 — start"
                )}
              </button>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-brand-400 transition-all duration-500"
              style={{ width: `${Math.round((completedSteps / totalSteps) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <dl className="mb-4 grid gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Your mDAI</dt>
          <dd className="font-mono text-white">{fmtEther(daiWallet)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Approved</dt>
          <dd className="font-mono text-white">{fmtEther(daiAllowance)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Queue</dt>
          <dd className="font-mono text-white">{pendingCount}</dd>
        </div>
      </dl>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <StepRow
            key={step.key}
            index={i + 1}
            done={step.done}
            active={!running && currentStep?.key === step.key}
            label={step.label}
            hint={step.hint}
            action={
              !step.done && canRunStep(step.key) ? (
                <button
                  type="button"
                  disabled={running}
                  className="btn-ghost text-xs disabled:opacity-50"
                  onClick={() => runStep(step.key)}
                >
                  {busyStep === step.key ? "Please wait…" : "Do this step"}
                </button>
              ) : undefined
            }
          />
        ))}
      </div>

      {allDone && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
          <p className="font-medium text-emerald-300">You&apos;re in the Club L1 matrix.</p>
          <p className="mt-1 text-emerald-200/80">
            View your slots, share your referral link, or buy higher levels below.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dashboard/slots" className="btn-primary text-xs">
              View my slots
            </Link>
            <Link href="/dashboard/share" className="btn-ghost text-xs">
              Share referral link
            </Link>
          </div>
        </div>
      )}

      {registered && !allDone && (
        <p className="mt-4 text-xs text-slate-500">
          Already registered{user.data?.sponsor ? ` under ${truncateAddress(user.data.sponsor)}` : ""}.
          Stuck on a step? Use &quot;Do this step&quot; for that row only.
        </p>
      )}
    </Panel>
  );
}
