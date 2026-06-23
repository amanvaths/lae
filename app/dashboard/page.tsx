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
  useLaeUserEvents,
  useLaeIdsForAddresses,
  referralLinkByUserId,
} from "@/lib/lae-club/hooks";
import { useLaeMatrixTreeApi } from "@/lib/lae-club/matrix-api";
import { buildSlotsFromApi, buildMatrixSlots } from "@/lib/lae-club/matrix-slots";
import { sortEventsNewestFirst } from "@/lib/lae-club/event-utils";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress, formatUnixDate } from "@/lib/format";
import { withBasePath } from "@/lib/paths";
import { txUrl } from "@/lib/lae-club/contracts";

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
  const levels = useLaeAllMatrixLevels();
  const income = useLaeIncomeEvents();
  const userEvents = useLaeUserEvents();
  const recycles = useLaeRecycleCount();
  const nft = useLaeNftStatus();
  const matrixL1 = useLaeMatrixLevel(1);
  const userIdNum = user.userId ? Number(user.userId) : undefined;
  const matrixL1Api = useLaeMatrixTreeApi(userIdNum, 1);
  const matrixL1FallbackIds = useLaeIdsForAddresses(matrixL1.referrals);
  const recentEvents = sortEventsNewestFirst(userEvents.data ?? []).slice(0, 8);

  if (user.isLoading) {
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
              {levels.isLoading ? "…" : `${levels.activeCount} active levels`}
            </Pill>
          </p>
        </div>
        <Link
          href={withBasePath("/dashboard/share")}
          className="btn-primary justify-center gap-2 border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/20 to-[#B8860B]/20 hover:from-[#D4AF37]/30 hover:to-[#B8860B]/30"
        >
          <Share2 className="h-4 w-4" /> Share referral
        </Link>
      </motion.div>

      {/* ── Top Stats Row ── */}
      <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-ink-900/80 p-4 backdrop-blur-xl transition-all duration-500 hover:border-[#D4AF37]/40 hover:shadow-glow-gold sm:p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#D4AF37]/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-[#D4AF37]/70 sm:text-xs">Total Income</p>
              <p className="mt-1.5 truncate font-display text-xl font-bold text-gradient-gold sm:mt-2 sm:text-2xl">
                {fmtEther(user.totalIncome ?? income.totalMatrixIncome ?? 0n)}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">Royal {fmtEther(income.totalRoyalIncome)}</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37] sm:h-11 sm:w-11">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-ink-900/80 p-4 backdrop-blur-xl transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] sm:p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-emerald-400/70 sm:text-xs">Direct Team</p>
              <p className="mt-1.5 truncate font-display text-xl font-bold text-emerald-400 sm:mt-2 sm:text-2xl">
                {String(user.directCount ?? 0n)}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">Total team {String(user.teamSize ?? 0n)}</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 sm:h-11 sm:w-11">
              <Users className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-ink-900/80 p-4 backdrop-blur-xl transition-all duration-500 hover:border-[#D4AF37]/40 hover:shadow-glow-gold sm:p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/25 via-[#D4AF37]/15 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-[#D4AF37]/70 sm:text-xs">Active Levels</p>
              <p className="mt-1.5 truncate font-display text-xl font-bold text-white sm:mt-2 sm:text-2xl">
                {levels.isLoading ? "…" : levels.activeCount}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">of 15 matrix levels</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37] sm:h-11 sm:w-11">
              <Layers className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-ink-900/80 p-4 backdrop-blur-xl transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] sm:p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-emerald-400/70 sm:text-xs">Recycles</p>
              <p className="mt-1.5 truncate font-display text-xl font-bold text-emerald-400 sm:mt-2 sm:text-2xl">
                {String(recycles.count)}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">NFT rank {royalRank > 0 ? `Royal ${royalRank}` : "Registration pass"}</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 sm:h-11 sm:w-11">
              <RefreshCw className="h-5 w-5" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Matrix Visualizer ── */}
      <motion.div variants={fadeUp}>
        <Panel
          title="Level 1 · Silver & Gold Matrix"
          className="mt-5 border-[#D4AF37]/15"
        >
          {matrixL1Api.isLoading && matrixL1.isLoading ? (
            <QueryLoading label="Loading matrix…" />
          ) : (
            <MatrixVisualizer
              slots={
                matrixL1Api.tree
                  ? buildSlotsFromApi(matrixL1Api.tree.slots)
                  : buildMatrixSlots(
                      matrixL1.referrals,
                      matrixL1.active,
                      matrixL1FallbackIds.idByAddress
                    )
              }
              levelActive={matrixL1Api.tree?.active ?? matrixL1.active}
              level={1}
              reinvestCount={
                matrixL1Api.tree
                  ? BigInt(Math.max(0, matrixL1Api.tree.cycle - 1))
                  : matrixL1.reinvestCount
              }
              totalEarning={
                matrixL1Api.tree
                  ? BigInt(matrixL1Api.tree.totalEarning || "0")
                  : matrixL1.totalEarning
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
              href={withBasePath("/dashboard/transactions")}
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
                        {truncateAddress(row.transactionHash)}
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
            href={withBasePath(a.href)}
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
