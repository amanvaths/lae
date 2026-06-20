"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Layers,
  Users,
  TrendingUp,
  Share2,
  ArrowUpRight,
  Crown,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { StatCard, Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { MatrixVisualizer } from "@/components/lae-club/MatrixVisualizer";
import {
  useLaeUser,
  useLaeAllMatrixLevels,
  useLaeIncomeEvents,
  useLaeRecycleCount,
  useLaeNftStatus,
  useLaeMatrixLevel,
  referralLinkByUserId,
} from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { withBasePath } from "@/lib/paths";
import { txUrl } from "@/lib/lae-club/contracts";

export default function DashboardHome() {
  const user = useLaeUser();
  const levels = useLaeAllMatrixLevels();
  const income = useLaeIncomeEvents();
  const recycles = useLaeRecycleCount();
  const nft = useLaeNftStatus();
  const matrixL1 = useLaeMatrixLevel(1);
  const recentEvents = (income.allEvents ?? []).slice(-8).reverse();

  if (user.isLoading || levels.isLoading) {
    return <QueryLoading label="Loading on-chain dashboard…" />;
  }

  if (!user.registered) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
        <Panel className="mt-6" title="Not registered">
          <p className="text-sm text-slate-400">
            Connect your wallet and complete registration to view live matrix data.
          </p>
          <Link href={withBasePath("/register")} className="btn-primary mt-4 inline-flex">
            Register on LAE Club
          </Link>
        </Panel>
      </div>
    );
  }

  const royalRank = nft.royalRank4
    ? 4
    : nft.royalRank3
      ? 3
      : nft.royalRank2
        ? 2
        : nft.royalRank1
          ? 1
          : 0;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl md:text-3xl">
            User #{String(user.userId)} ·{" "}
            <span className="text-gradient font-mono">
              {truncateAddress(user.userAddress ?? "", 6, 4)}
            </span>
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            Sponsor ID #{String(user.sponsorId ?? "—")} ·{" "}
            {user.sponsorAddress ? truncateAddress(user.sponsorAddress, 6, 4) : "—"}
            <Pill tone="emerald" className="ml-2">
              {levels.activeCount} active levels
            </Pill>
          </p>
        </div>
        <Link href={withBasePath("/dashboard/share")} className="btn-primary justify-center">
          <Share2 className="h-4 w-4" /> Share referral
        </Link>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="User ID"
          value={String(user.userId ?? "—")}
          sub={`Sponsor #${String(user.sponsorId ?? "—")}`}
          icon={Layers}
          accent="brand"
        />
        <StatCard
          label="Direct Team"
          value={String(user.directCount ?? 0n)}
          sub={`Total team ${String(user.teamSize ?? 0n)}`}
          icon={Users}
          accent="violet"
        />
        <StatCard
          label="Matrix Income"
          value={fmtEther(income.totalMatrixIncome || user.totalIncome || 0n)}
          sub={`Royal ${fmtEther(income.totalRoyalIncome)}`}
          icon={TrendingUp}
          accent="gold"
        />
        <StatCard
          label="Recycles"
          value={String(recycles.count)}
          sub={`NFT rank ${royalRank > 0 ? `Royal ${royalRank}` : "Registration pass"}`}
          icon={RefreshCw}
          accent="emerald"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Active levels (on-chain)">
          <div className="flex flex-wrap gap-1.5">
            {(levels.levels ?? []).map((l) => (
              <span
                key={l.level}
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  l.active
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-white/5 text-slate-500"
                }`}
              >
                L{l.level}
              </span>
            ))}
          </div>
        </Panel>
        <Panel title="NFT status">
          <div className="space-y-1 text-sm">
            <p className={nft.registrationPass ? "text-emerald-400" : "text-slate-500"}>
              Registration pass · {nft.registrationPass ? "Active" : "—"}
            </p>
            <p className={nft.royalRank1 ? "text-brand-300" : "text-slate-500"}>
              Royal 1 (L3+) · {nft.royalRank1 ? "Eligible" : "—"}
            </p>
            <p className={nft.royalRank4 ? "text-brand-300" : "text-slate-500"}>
              Royal 4 (L12) · {nft.royalRank4 ? "Eligible" : "—"}
            </p>
          </div>
        </Panel>
        <Panel title="Referral link">
          <code className="block break-all rounded bg-black/30 p-2 text-xs text-brand-200">
            {referralLinkByUserId(user.userId) || "—"}
          </code>
        </Panel>
      </div>

      <Panel title="Level 1 matrix (live placements)" className="mt-4">
        {matrixL1.isLoading ? (
          <QueryLoading label="Loading matrix…" />
        ) : (
          <MatrixVisualizer
            referrals={matrixL1.referrals}
            level={1}
            reinvestCount={matrixL1.reinvestCount}
            totalEarning={matrixL1.totalEarning}
          />
        )}
      </Panel>

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
        {income.isLoading ? (
          <p className="text-sm text-slate-500">Loading events from chain…</p>
        ) : recentEvents.length === 0 ? (
          <p className="text-sm text-slate-500">No events yet for this user</p>
        ) : (
          <div className="divide-y divide-white/5">
            {recentEvents.map((e, i) => {
              const row = e as {
                transactionHash: string;
                eventName?: string;
                args?: Record<string, unknown>;
              };
              const amount = row.args?.amount;
              return (
              <div key={`${row.transactionHash}-${i}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <Pill tone="brand">{row.eventName}</Pill>
                  <a
                    href={txUrl(row.transactionHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-xs text-brand-300 hover:underline"
                  >
                    {truncateAddress(row.transactionHash)}
                  </a>
                </div>
                {typeof amount === "bigint" && (
                  <span className="text-emerald-400">+{fmtEther(amount)}</span>
                )}
              </div>
            );})}
          </div>
        )}
      </Panel>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/dashboard/matrix", icon: Layers, label: "Matrix", desc: "15 levels · 14 spots" },
          { href: "/dashboard/income", icon: TrendingUp, label: "Income", desc: "TokenReceived events" },
          { href: "/dashboard/royal-pool", icon: Crown, label: "Royal Pool", desc: "TreasuryPool income" },
          { href: "/dashboard/rewards", icon: Sparkles, label: "Rewards", desc: "LAE token rewards" },
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
    </div>
  );
}
