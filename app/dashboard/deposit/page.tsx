"use client";

import { useState } from "react";
import { Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { MatrixSeedPanel } from "@/components/onchain/MatrixSeedPanel";
import {
  usePackagePricesOnChain,
  useClubPackagesOnChain,
  usePilotPackagesOnChain,
  useSensoUser,
} from "@/lib/contracts/hooks";
import {
  useApproveDai,
  useDaiAllowance,
  useDaiFaucet,
  usePurchaseClub,
  usePurchasePilot,
} from "@/lib/contracts/hooks/useWrites";
import { fmtEther } from "@/lib/contracts/format";
import { Loader2, ChevronDown } from "lucide-react";

export default function DepositPage() {
  const [matrixType, setMatrixType] = useState<"CLUB" | "PILOT">("CLUB");
  const [level, setLevel] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const prices = usePackagePricesOnChain();
  const club = useClubPackagesOnChain();
  const pilot = usePilotPackagesOnChain();
  const user = useSensoUser();
  const allowance = useDaiAllowance();
  const approve = useApproveDai();
  const faucet = useDaiFaucet();
  const purchaseClub = usePurchaseClub();
  const purchasePilot = usePurchasePilot();

  if (prices.isLoading) return <QueryLoading label="Loading on-chain prices…" />;

  const list = matrixType === "CLUB" ? prices.data?.club : prices.data?.pilot;
  const selected = list?.find((p) => p.level === level);
  const owned =
    matrixType === "CLUB"
      ? club.data?.some((p) => p.level === level)
      : pilot.data?.some((p) => p.level === level);

  const needsApprove =
    selected &&
    allowance.data !== undefined &&
    allowance.data < selected.amount;

  async function handlePurchase() {
    if (!selected || owned) return;
    setBusy("purchase");
    try {
      if (needsApprove) await approve();
      if (matrixType === "CLUB") await purchaseClub(level);
      else await purchasePilot(level);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Deposit &amp; Activate</h1>
      <p className="mt-1 text-sm text-slate-400">
        First time? Use the wizard below — one button, wallet confirms each step.
      </p>

      <div className="mt-6 space-y-4">
        <MatrixSeedPanel />

        <Panel title="Your packages">
          <p className="mb-2 text-xs uppercase text-slate-500">Club</p>
          {(club.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No club packages yet — activate Level 1 above</p>
          ) : (
            club.data!.map((p) => (
              <div key={p.level} className="mb-1 text-sm text-white">
                Level {p.level} · {p.cyclesCompleted} cycles · matrix #{String(p.activeMatrixId)}
              </div>
            ))
          )}
          <p className="mb-2 mt-4 text-xs uppercase text-slate-500">Pilot</p>
          {(pilot.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No pilot packages</p>
          ) : (
            pilot.data!.map((p) => (
              <div key={p.level} className="mb-1 text-sm text-white">
                Level {p.level} · matrix #{String(p.activeMatrixId)}
              </div>
            ))
          )}
        </Panel>

        <Panel className="overflow-hidden p-0">
          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-4 text-left sm:px-6"
          >
            <div>
              <p className="text-sm font-semibold text-white">Advanced — other levels &amp; Pilot</p>
              <p className="mt-0.5 text-xs text-slate-500">Buy Level 2+, Pilot matrix, or extra test mDAI</p>
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
            />
          </button>

          {advancedOpen && (
            <div className="space-y-4 border-t border-white/5 px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
              <Panel title="Extra test mDAI" className="!p-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy === "faucet1000"}
                    className="btn-ghost text-sm"
                    onClick={async () => {
                      setBusy("faucet1000");
                      try {
                        await faucet("1000");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === "faucet1000" ? "Minting…" : "Faucet 1000 mDAI"}
                  </button>
                  <button
                    type="button"
                    disabled={busy === "approve"}
                    className="btn-ghost text-sm"
                    onClick={async () => {
                      setBusy("approve");
                      try {
                        await approve();
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    Re-approve DAI
                  </button>
                </div>
              </Panel>

              <Panel title="Select package" className="!p-4">
                <div className="mb-4 flex gap-2">
                  {(["CLUB", "PILOT"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMatrixType(t)}
                      className={`rounded-lg px-4 py-2 text-sm ${matrixType === t ? "bg-brand-500/20 text-white" : "text-slate-400"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  {(list ?? []).map((p) => {
                    const isOwned =
                      matrixType === "CLUB"
                        ? club.data?.some((x) => x.level === p.level)
                        : pilot.data?.some((x) => x.level === p.level);
                    return (
                      <button
                        key={p.level}
                        type="button"
                        onClick={() => setLevel(p.level)}
                        className={`rounded-xl border p-3 text-left text-sm ${
                          level === p.level ? "border-brand-500/50 bg-brand-500/10" : "border-white/10"
                        }`}
                      >
                        <p className="font-semibold text-white">
                          Level {p.level} {isOwned && <Pill tone="emerald">Owned</Pill>}
                        </p>
                        <p className="text-slate-400">{fmtEther(p.amount)} mDAI</p>
                      </button>
                    );
                  })}
                </div>
                {selected && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-slate-300">
                      {matrixType} L{level} — {fmtEther(selected.amount)} mDAI
                    </p>
                    <button
                      type="button"
                      disabled={!user.data?.registered || owned || busy === "purchase"}
                      onClick={handlePurchase}
                      className="btn-primary disabled:opacity-50"
                    >
                      {busy === "purchase" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Purchasing…
                        </>
                      ) : owned ? (
                        "Already owned"
                      ) : needsApprove ? (
                        "Approve & Purchase"
                      ) : (
                        "Purchase"
                      )}
                    </button>
                  </div>
                )}
              </Panel>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
