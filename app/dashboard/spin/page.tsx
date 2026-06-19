"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { SpinWheel } from "@/components/onchain/SpinWheel";
import { useSpinOnChain } from "@/lib/contracts/hooks";
import { useExecuteSpin } from "@/lib/contracts/hooks/useWrites";
import { fmtEther } from "@/lib/contracts/format";
import { txUrl } from "@/lib/contracts/addresses";
import { truncateAddress } from "@/lib/format";
import { Loader2 } from "lucide-react";

export default function SpinPage() {
  const { address } = useAccount();
  const { coupons, history } = useSpinOnChain();
  const spin = useExecuteSpin();
  const [spinning, setSpinning] = useState(false);
  const [lastTier, setLastTier] = useState<number | undefined>();

  const couponCount = coupons.isLoading ? null : Number(coupons.data ?? 0n);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Spin &amp; Win</h1>
      <p className="mt-1 text-sm text-slate-400">LAE Spin on BSC Testnet · coupons from referrals</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Reward wheel">
          <SpinWheel spinning={spinning} resultTier={lastTier} />
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Available coupons:{" "}
              <span className="text-xl font-bold text-white">
                {couponCount === null ? "…" : couponCount}
              </span>
            </p>
            <button
              type="button"
              disabled={spinning || couponCount === null || couponCount === 0 || !address}
              className="btn-primary mt-4 disabled:opacity-50"
              onClick={async () => {
                setSpinning(true);
                setLastTier(undefined);
                try {
                  await spin();
                  const [historyResult] = await Promise.all([
                    history.refetch(),
                    coupons.refetch(),
                  ]);
                  const latest = historyResult.data?.[0];
                  if (latest) setLastTier(latest.tier);
                } finally {
                  setTimeout(() => setSpinning(false), 3200);
                }
              }}
            >
              {spinning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Spinning…
                </>
              ) : (
                "Spin"
              )}
            </button>
          </div>
        </Panel>

        <Panel title="Spin history">
          {history.isLoading ? (
            <QueryLoading />
          ) : (history.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No spins yet — earn coupons when referrals purchase</p>
          ) : (
            <div className="divide-y divide-white/5">
              {(history.data ?? []).map((s) => (
                <div key={s.id} className="flex justify-between py-3 text-sm">
                  <div>
                    <p className="text-white">Tier {s.tier}</p>
                    <a
                      href={txUrl(s.transactionHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-300 hover:underline"
                    >
                      {truncateAddress(s.transactionHash)}
                    </a>
                  </div>
                  <p className="text-emerald-400">{fmtEther(s.sltAmount, 0)} LAE</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
