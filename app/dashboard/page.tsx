"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import {
  Layers,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Share2,
  Gauge,
  Wallet,
} from "lucide-react";
import { StatCard, Panel, Pill } from "@/components/dashboard/ui";
import { ChainQueryState } from "@/components/dashboard/ChainQueryState";
import { PendingQueuePanel } from "@/components/onchain/PendingQueuePanel";
import { RegisterPanel } from "@/components/onchain/RegisterPanel";
import { useAnalyticsDashboard } from "@/lib/hooks/useAnalytics";
import {
  useWalletOnChain,
  useClubPackagesOnChain,
  usePilotPackagesOnChain,
  useReferralsOnChain,
  usePendingQueue,
  useSensoUser,
  useProtocolStatus,
} from "@/lib/contracts/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";

export default function DashboardHome() {
  const { address } = useAccount();
  const analytics = useAnalyticsDashboard();
  const wallet = useWalletOnChain();
  const club = useClubPackagesOnChain();
  const pilot = usePilotPackagesOnChain();
  const referrals = useReferralsOnChain();
  const pending = usePendingQueue();
  const user = useSensoUser();
  const protocol = useProtocolStatus();

  const useApi = analytics.isSuccess && analytics.data;

  return (
    <ChainQueryState query={wallet} label="Loading on-chain dashboard…">
      {(w) => (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            BSC Testnet · {address ? truncateAddress(address) : "—"}
            {useApi && <span className="ml-2 text-brand-300">· indexed</span>}
          </p>
        </div>
        {protocol.data && (
          <Pill tone={protocol.data.activated ? "emerald" : "red"}>
            {protocol.data.activated ? "Protocol active" : "Not activated"}
          </Pill>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Internal mDAI" value={fmtEther(w.daiInternal)} icon={Wallet} />
        <StatCard label="SLT" value={fmtEther(w.sltBalance, 0)} icon={Layers} />
        <StatCard
          label="Total earned"
          value={
            useApi
              ? fmtEther(BigInt(analytics.data!.totalIncome.split(".")[0] ?? "0"))
              : fmtEther(w.totalEarnings)
          }
          icon={TrendingUp}
        />
        <StatCard
          label="Direct refs"
          value={String(
            useApi ? analytics.data!.directReferrals : (referrals.data?.direct.length ?? 0)
          )}
          icon={Share2}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RegisterPanel />
        <PendingQueuePanel />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Club packages">
          {(club.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">None — purchase on Deposit page</p>
          ) : (
            club.data!.map((p) => (
              <p key={p.level} className="text-sm text-white">
                L{p.level} · {p.cyclesCompleted} cycles
              </p>
            ))
          )}
          <Link href="/dashboard/slots" className="mt-2 inline-block text-xs text-brand-300">
            View matrices →
          </Link>
        </Panel>
        <Panel title="Pilot packages">
          {(pilot.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">None</p>
          ) : (
            pilot.data!.map((p) => (
              <p key={p.level} className="text-sm text-white">
                L{p.level}
              </p>
            ))
          )}
          <Link href="/dashboard/slot-engine" className="mt-2 inline-block text-xs text-brand-300">
            View pilot →
          </Link>
        </Panel>
        <Panel title="Queue">
          <p className="text-2xl font-bold text-white">{String(pending.data ?? 0n)}</p>
          <p className="text-xs text-slate-500">Pending actions globally</p>
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/dashboard/deposit" className="btn-primary">
          <ArrowDownToLine className="h-4 w-4" /> Purchase
        </Link>
        <Link href="/dashboard/withdraw" className="btn-ghost">
          <ArrowUpFromLine className="h-4 w-4" /> Withdraw
        </Link>
        <Link href="/dashboard/spin" className="btn-ghost">
          <Gauge className="h-4 w-4" /> Spin
        </Link>
        <Link href="/dashboard/share" className="btn-ghost">
          <Share2 className="h-4 w-4" /> Refer
        </Link>
      </div>

      {user.data?.registered && (
        <p className="mt-4 text-xs text-slate-500">
          Registered · sponsor {truncateAddress(user.data.sponsor)}
        </p>
      )}
    </div>
      )}
    </ChainQueryState>
  );
}
