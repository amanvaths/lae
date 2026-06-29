"use client";

import { useEffect, useState } from "react";
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
  useLaeUserEvents,
  referralLinkByUserId,
} from "@/lib/lae-club/hooks";
import { useMatrixCoreTreeApi } from "@/lib/lae-club/matrix-api";
import { buildSlotsFromApi } from "@/lib/lae-club/matrix-slots";
import { sortEventsNewestFirst } from "@/lib/lae-club/event-utils";
import { fmtEther, incomeStringToWei } from "@/lib/contracts/format";
import { truncateAddress, formatUnixDate } from "@/lib/format";
import { withBasePath } from "@/lib/paths";
import {
  useDashboardViewUserId,
  withDashboardHref,
} from "@/lib/lae-club/dashboard-view-context";
import { txUrl } from "@/lib/lae-club/contracts";
import { cn } from "@/lib/utils";
import { LAE_MATRIX_SIZE } from "@/lib/lae-club/constants";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function DashboardHome() {
  const user = useLaeUser();
  const viewUserId = useDashboardViewUserId();
  const levels = useLaeAllMatrixLevels();
  const income = useLaeIncomeEvents();
  const userEvents = useLaeUserEvents();
  const recycles = useLaeRecycleCount();
  const userIdNum = user.userId ? Number(user.userId) : undefined;
  const currentCycle = levels.currentCycle ?? 1;
  const [matrixCycle, setMatrixCycle] = useState(currentCycle);

  useEffect(() => {
    setMatrixCycle(currentCycle);
  }, [currentCycle]);

  const matrixL1Api = useMatrixCoreTreeApi(userIdNum, 1, matrixCycle, {
    enabled: !!userIdNum,
  });
  const recentEvents = sortEventsNewestFirst(userEvents.data ?? []).slice(0, 8);

  if (user.isLoading) {
    return <QueryLoading label="Loading on-chain dashboard…" />;
  }

  if ("notFound" in user && user.notFound) {
    return (
      <Panel title="User not found">
        <p className="text-sm text-slate-400">This user ID is not registered on the matrix contract.</p>
      </Panel>
    );
  }

  if (!user.registered) {
    return (
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
          Dashboard
        </h1>
        <Panel className="relative mt-6 overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D4AF37]/[0.08] blur-3xl" />
          <div className="relative max-w-lg">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/[0.12] to-transparent text-[#D4AF37]">
              <Sparkles className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-white">
              Welcome to LAE Club
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
              Connect your wallet and complete registration to unlock your live matrix,
              income tracking, and rewards dashboard.
            </p>
            <Link href={withBasePath("/register")} className="btn-primary mt-5 inline-flex">
              Register on LAE Club
            </Link>
          </div>
        </Panel>
      </div>
    );
  }

  const royalRank = 0;
  const activeLevelsDisplay =
    user.isLoading || levels.isLoading
      ? "…"
      : String(user.activeLevels ?? levels.activeCount);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ── Header ── */}
      <motion.div
        variants={fadeUp}
        className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl md:text-3xl">
            User #{String(user.userId)}{" "}
            <span className="text-gradient-gold">
              · {truncateAddress(user.userAddress ?? "", 6, 4)}
            </span>
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
            Sponsor ID #{String(user.sponsorId ?? "—")}
            {user.registeredAt && user.registeredAt > 0n ? (
              <>
                {" · Registered "}
                {formatUnixDate(user.registeredAt)}
              </>
            ) : null}
            <Pill tone="gold" className="ml-2">
              {activeLevelsDisplay} active levels
            </Pill>
          </p>
        </div>
        <Link
          href={withDashboardHref("/dashboard/share", viewUserId)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#D4AF37]/60 bg-[#D4AF37]/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.12)] transition-all hover:border-[#D4AF37] hover:bg-[#D4AF37]/20 hover:text-[#ffe082]"
        >
          <Share2 className="h-4 w-4" /> Share referral
        </Link>
      </motion.div>

      {/* ── Top Stats Row ── */}
      <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Income"
          accent="gold"
          icon={TrendingUp}
          value={
            <span className="text-gradient-gold">
              {fmtEther(user.totalIncome ?? income.totalMatrixIncome ?? 0n)}
            </span>
          }
          sub={
            income.totalLapseIncome > 0n
              ? `Direct ${fmtEther(income.totalMatrixIncome)} · Lapse ${fmtEther(income.totalLapseIncome)}`
              : `Royal ${fmtEther(income.totalRoyalIncome)}`
          }
        />
        <StatCard
          label="Direct Team"
          accent="emerald"
          icon={Users}
          value={<span className="text-emerald-400">{String(user.directCount ?? 0n)}</span>}
          sub={`Total team ${String(user.teamSize ?? 0n)}`}
        />
        <StatCard
          label="Active Levels"
          accent="brand"
          icon={Layers}
          value={activeLevelsDisplay}
          sub="of 15 matrix levels"
        />
        <StatCard
          label="Recycles"
          accent="emerald"
          icon={RefreshCw}
          value={<span className="text-emerald-400">{String(recycles.count)}</span>}
          sub={`NFT rank ${royalRank > 0 ? `Royal ${royalRank}` : "Registration pass"}`}
        />
      </motion.div>

      {/* ── Matrix Visualizer ── */}
      <motion.div variants={fadeUp}>
        <Panel
          title={`Level 1 · Silver & Gold Matrix · Cycle ${matrixCycle}`}
          className="mt-5 border-[#D4AF37]/15"
          action={
            currentCycle > 1 ? (
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: currentCycle }, (_, i) => i + 1).map((c) => {
                  const oc = levels.levels.find((l) => l.level === 1);
                  const filled =
                    c === matrixCycle && matrixL1Api.tree
                      ? matrixL1Api.tree.filledSpots
                      : undefined;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setMatrixCycle(c)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
                        matrixCycle === c
                          ? "border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37]"
                          : "border-white/10 text-slate-500 hover:text-slate-300"
                      )}
                    >
                      C{c}
                      {filled != null ? ` · ${filled}/${LAE_MATRIX_SIZE}` : c === currentCycle ? " · live" : ""}
                    </button>
                  );
                })}
              </div>
            ) : undefined
          }
        >
          {matrixL1Api.isLoading && !matrixL1Api.tree ? (
            <QueryLoading label="Loading matrix…" />
          ) : (
            <MatrixVisualizer
              slots={
                matrixL1Api.tree
                  ? buildSlotsFromApi(matrixL1Api.tree.slots)
                  : undefined
              }
              levelActive={matrixL1Api.tree?.active ?? true}
              level={matrixCycle}
              reinvestCount={BigInt(Math.max(0, matrixCycle - 1))}
              totalEarning={
                matrixL1Api.tree
                  ? incomeStringToWei(matrixL1Api.tree.totalEarned)
                  : 0n
              }
            />
          )}
        </Panel>
      </motion.div>

      {/* ── Recent Activity ── */}
      <motion.div variants={fadeUp}>
        <Panel
          className="mt-4 border-white/[0.08]"
          title="Recent on-chain activity"
          action={
            <Link
              href={withDashboardHref("/dashboard/transactions", viewUserId)}
              className="text-sm font-medium text-[#D4AF37] hover:text-[#ffe082] transition-colors"
            >
              All events →
            </Link>
          }
        >
          {userEvents.isLoading ? (
            <p className="text-sm text-slate-500">Loading events from chain…</p>
          ) : recentEvents.length === 0 ? (
            <p className="text-sm text-slate-500">
              {userEvents.isFetching
                ? "Syncing on-chain events…"
                : "No indexed events yet — new activity will appear after backend sync."}
            </p>
          ) : (
            <div className="divide-y divide-white/[0.06]">
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
                      <Pill tone="gold">{row.eventName}</Pill>
                      <a
                        href={txUrl(row.transactionHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-xs text-[#D4AF37]/70 hover:text-[#D4AF37] hover:underline transition-colors"
                      >
                        {truncateAddress(row.transactionHash ?? (row as { txHash?: string }).txHash)}
                      </a>
                    </div>
                    {typeof amount === "bigint" && (
                      <span className="font-semibold text-emerald-400">+{fmtEther(amount)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </motion.div>

      {/* ── Quick Action Cards ── */}
      <motion.div variants={fadeUp} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/dashboard/matrix", icon: Layers, label: "Matrix", desc: "15 levels · 14 spots" },
          { href: "/dashboard/income", icon: TrendingUp, label: "Income", desc: "TokenReceived events" },
          { href: "/dashboard/royal-pool", icon: Crown, label: "Royal Pool", desc: "TreasuryPool income" },
          { href: "/dashboard/rewards", icon: Sparkles, label: "Rewards", desc: "LAE token rewards" },
        ].map((a) => (
          <Link
            key={a.href}
            href={withDashboardHref(a.href, viewUserId)}
            className="group glass relative overflow-hidden flex items-center gap-3 p-3.5 transition-all duration-500 hover:border-[#D4AF37]/30 hover:shadow-glow-gold sm:p-4"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 to-[#D4AF37]/0 transition-all duration-500 group-hover:from-[#D4AF37]/5 group-hover:to-transparent" />
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37] sm:h-11 sm:w-11">
              <a.icon className="h-5 w-5" />
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{a.label}</p>
              <p className="truncate text-xs text-slate-500">{a.desc}</p>
            </div>
            <ArrowUpRight className="relative ml-1 h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-[#D4AF37]" />
          </Link>
        ))}
      </motion.div>
    </motion.div>
  );
}
