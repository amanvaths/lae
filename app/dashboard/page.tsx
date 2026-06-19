"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import {
  Layers,
  Users,
  TrendingUp,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Share2,
  Gauge,
  ArrowUpRight,
} from "lucide-react";
import { StatCard, Panel, Pill } from "@/components/dashboard/ui";
import { ChainQueryState } from "@/components/dashboard/ChainQueryState";
import { CoinShowcase } from "@/components/dashboard/CoinShowcase";
import { PendingQueuePanel } from "@/components/onchain/PendingQueuePanel";
import { useAnalyticsDashboard } from "@/lib/hooks/useAnalytics";
import {
  useWalletOnChain,
  useClubPackagesOnChain,
  usePilotPackagesOnChain,
  useReferralsOnChain,
  usePendingQueue,
  useSensoUser,
  useProtocolStatus,
  useUserEventsOnChain,
} from "@/lib/contracts/hooks";
import { fmtEther, parseApiWei } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { withBasePath } from "@/lib/paths";

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
  const events = useUserEventsOnChain();

  const useApi = analytics.isSuccess && analytics.data;
  const displayName = address ? truncateAddress(address, 6, 4) : "member";
  const clubCount = club.data?.length ?? 0;
  const pilotCount = pilot.data?.length ?? 0;
  const directRefs = useApi
    ? analytics.data!.directReferrals
    : (referrals.data?.direct.length ?? 0);
  const totalEarned = useApi
    ? parseApiWei(analytics.data!.totalIncome)
    : (wallet.data?.totalEarnings ?? 0n);

  const recentEvents = (events.data ?? []).slice(0, 5);

  return (
    <ChainQueryState query={wallet} label="Loading on-chain dashboard…">
      {(w) => (
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold text-white sm:text-2xl md:text-3xl">
                Welcome back,{" "}
                <span className="text-gradient font-mono">{displayName}</span>
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                Your LAE Club + Pilot matrix on BSC Testnet{" "}
                {protocol.data && (
                  <Pill tone={protocol.data.activated ? "emerald" : "gold"}>
                    {protocol.data.activated ? "Active" : "Setup needed"}
                  </Pill>
                )}
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <Link
                href={withBasePath("/dashboard/deposit")}
                className="btn-ghost justify-center !px-3 !py-2.5 sm:!px-4"
              >
                <ArrowDownToLine className="h-4 w-4" /> Deposit
              </Link>
              <Link
                href={withBasePath("/dashboard/withdraw")}
                className="btn-primary justify-center !px-3 !py-2.5 sm:!px-4"
              >
                <ArrowUpFromLine className="h-4 w-4" /> Withdraw
              </Link>
            </div>
          </motion.div>

          <CoinShowcase />

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Total Earned"
              value={fmtEther(totalEarned)}
              sub="mDAI from matrix contract"
              icon={TrendingUp}
              accent="gold"
            />
            <StatCard
              label="Club / Pilot"
              value={`${clubCount} / ${pilotCount}`}
              sub={`${clubCount + pilotCount} packages owned`}
              icon={Layers}
              accent="brand"
            />
            <StatCard
              label="Direct Team"
              value={String(directRefs)}
              sub={`${referrals.data?.qualifiedClub ?? 0} qualified club`}
              icon={Users}
              accent="violet"
            />
            <StatCard
              label="Wallet Balance"
              value={fmtEther(w.daiInternal)}
              sub={`${fmtEther(w.sltBalance, 0)} LAE · wallet ${fmtEther(w.daiWallet)} mDAI`}
              icon={Wallet}
              accent="emerald"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <PendingQueuePanel />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Panel title="Club packages">
              {(club.data ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">None — activate on Deposit</p>
              ) : (
                club.data!.map((p) => (
                  <p key={p.level} className="text-sm text-white">
                    L{p.level} · {p.cyclesCompleted} cycles
                  </p>
                ))
              )}
              <Link
                href={withBasePath("/dashboard/slots")}
                className="mt-2 inline-block text-xs text-brand-300"
              >
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
              <Link
                href={withBasePath("/dashboard/slot-engine")}
                className="mt-2 inline-block text-xs text-brand-300"
              >
                View pilot →
              </Link>
            </Panel>
            <Panel title="Pending queue">
              <p className="text-2xl font-bold text-white">{String(pending.data ?? 0n)}</p>
              <p className="text-xs text-slate-500">Global actions waiting</p>
            </Panel>
          </div>

          <Panel
            className="mt-4"
            title="Recent on-chain activity"
            action={
              <Link
                href={withBasePath("/dashboard/transactions")}
                className="text-sm font-medium text-brand-300 hover:text-brand-200"
              >
                All events →
              </Link>
            }
          >
            {events.isLoading ? (
              <p className="text-sm text-slate-500">Loading events…</p>
            ) : recentEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No events yet — register &amp; deposit to start</p>
            ) : (
              <div className="divide-y divide-white/5">
                {recentEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <Pill tone="brand">{e.eventName}</Pill>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {truncateAddress(e.transactionHash)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                href: "/dashboard/share",
                icon: Share2,
                label: "Share referral link",
                desc: "Grow your direct team",
              },
              {
                href: "/dashboard/slots",
                icon: Layers,
                label: "Club matrices",
                desc: `${clubCount} active packages`,
              },
              {
                href: "/dashboard/spin",
                icon: Gauge,
                label: "Spin & Win",
                desc: "LAE rewards from referrals",
              },
            ].map((a) => (
              <Link
                key={a.href}
                href={withBasePath(a.href)}
                className="glass glass-hover flex items-center gap-3 p-3.5 sm:p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-brand-300 sm:h-10 sm:w-10">
                  <a.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{a.label}</p>
                  <p className="truncate text-xs text-slate-500">{a.desc}</p>
                </div>
                <ArrowUpRight className="ml-1 h-4 w-4 shrink-0 text-slate-500" />
              </Link>
            ))}
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
