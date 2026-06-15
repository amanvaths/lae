"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bitcoin,
  Layers,
  Users,
  TrendingUp,
  Crown,
  ArrowUpRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Share2,
  Gauge,
} from "lucide-react";
import {
  StatCard,
  Panel,
  Pill,
  Progress,
  Sparkline,
} from "@/components/dashboard/ui";
import { CoinShowcase } from "@/components/dashboard/CoinShowcase";
import {
  slots,
  wallet,
  teamStats,
  incomeTypes,
  totalEarned,
  transactions,
  ranks,
  user,
  earningsSeries,
  btcToUsd,
  fmtBtc,
  TOTAL_MATRIX_POTENTIAL,
} from "@/lib/dashboard-data";

const activeSlots = slots.filter((s) => s.active).length;
const nextRank = ranks.find((r) => !r.achieved);
const maxIncome = Math.max(...incomeTypes.map((i) => i.earned));

export default function DashboardHome() {
  return (
    <div>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl md:text-3xl">
            Welcome back, <span className="text-gradient">@{user.username}</span>
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            Here&apos;s your Bitcoin co-matrix at a glance · Rank{" "}
            <Pill tone="gold">{user.rank}</Pill>
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Link href="/dashboard/deposit" className="btn-ghost justify-center !px-3 !py-2.5 sm:!px-4">
            <ArrowDownToLine className="h-4 w-4" /> Deposit
          </Link>
          <Link href="/dashboard/withdraw" className="btn-primary justify-center !px-3 !py-2.5 sm:!px-4">
            <ArrowUpFromLine className="h-4 w-4" /> Withdraw
          </Link>
        </div>
      </motion.div>

      {/* $LAE coin showcase */}
      <CoinShowcase />

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Earned"
          value={fmtBtc(totalEarned, 4)}
          sub={btcToUsd(totalEarned)}
          icon={Bitcoin}
          accent="gold"
          trend={{ value: "+12.4% this week", up: true }}
        />
        <StatCard
          label="Active Slots"
          value={`${activeSlots} / 12`}
          sub={`Highest: Slot ${user.highestSlot}`}
          icon={Layers}
          accent="brand"
        />
        <StatCard
          label="Team Size"
          value={teamStats.total.toLocaleString()}
          sub={`${teamStats.directs} direct · ${teamStats.todayJoins} today`}
          icon={Users}
          accent="violet"
          trend={{ value: `+${teamStats.todayJoins} today`, up: true }}
        />
        <StatCard
          label="Wallet Balance"
          value={fmtBtc(wallet.available, 4)}
          sub={btcToUsd(wallet.available)}
          icon={Bitcoin}
          accent="emerald"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Earnings chart */}
        <Panel className="lg:col-span-2" title="Earnings — last 14 days" desc="Daily Bitcoin income across all active slots">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="font-display text-2xl font-bold text-white sm:text-3xl">
                {fmtBtc(earningsSeries.reduce((a, b) => a + b, 0), 4)}
              </p>
              <p className="mt-1 text-sm text-emerald-400">
                ▲ {btcToUsd(earningsSeries.reduce((a, b) => a + b, 0))} earned
              </p>
            </div>
            <Pill tone="brand" className="w-fit shrink-0">
              <TrendingUp className="h-3.5 w-3.5" /> Auto-compounding
            </Pill>
          </div>
          <div className="mt-4 min-w-0">
            <Sparkline data={earningsSeries} height={120} stroke="#48bcff" />
          </div>
        </Panel>

        {/* Matrix potential */}
        <Panel title="Matrix Potential" desc="Total via 12-slot recycling">
          <div className="flex flex-col items-center py-2 text-center">
            <div className="relative grid h-36 w-36 place-items-center">
              <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="url(#g)" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - totalEarned / TOTAL_MATRIX_POTENTIAL)}`}
                />
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1e9bff" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <p className="font-display text-xl font-bold text-white">
                  {((totalEarned / TOTAL_MATRIX_POTENTIAL) * 100).toFixed(1)}%
                </p>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  unlocked
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              <span className="font-semibold text-white">{fmtBtc(totalEarned, 4)}</span>{" "}
              of {fmtBtc(TOTAL_MATRIX_POTENTIAL)}
            </p>
            <Link href="/dashboard/slot-engine" className="btn-ghost mt-4 w-full justify-center !px-4 !py-2 sm:w-auto">
              <Gauge className="h-4 w-4" /> View slot engine
            </Link>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Income breakdown */}
        <Panel className="lg:col-span-2" title="Income breakdown" desc="By income type — B-Titan pays on every level">
          <div className="flex flex-col gap-4">
            {incomeTypes.map((it) => (
              <div key={it.key} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center justify-between gap-2 sm:w-28 sm:shrink-0 md:w-32">
                  <p className="text-sm font-medium text-white">{it.label}</p>
                  <p className="font-mono text-sm font-semibold text-white sm:hidden">
                    {it.earned.toFixed(4)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <Progress value={(it.earned / maxIncome) * 100} />
                </div>
                <p className="hidden shrink-0 text-right font-mono text-sm font-semibold text-white sm:block sm:w-20 md:w-24">
                  {it.earned.toFixed(4)}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/income"
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-300 hover:text-brand-200"
          >
            Full income report <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Panel>

        {/* Rank progress */}
        <Panel title="Rank progress">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-gold-400/30 to-accent-500/20 text-gold-300">
              <Crown className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-white">{user.rank}</p>
              <p className="text-xs text-slate-400">Current rank · 25% reward</p>
            </div>
          </div>
          {nextRank && (
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-slate-400">Next: {nextRank.name}</span>
                <span className="text-slate-500">Slot {nextRank.targetSlot}</span>
              </div>
              <Progress value={62} tone="gold" />
              <p className="mt-2 text-xs text-slate-500">{nextRank.requirement}</p>
            </div>
          )}
          <Link href="/dashboard/ranks" className="btn-ghost mt-5 w-full justify-center !py-2">
            View all ranks
          </Link>
        </Panel>
      </div>

      {/* Active slots strip */}
      <Panel className="mt-4" title="Active slots" desc="Your 12-slot power system" action={
        <Link href="/dashboard/slots" className="text-sm font-medium text-brand-300 hover:text-brand-200">
          Manage →
        </Link>
      }>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-6">
          {slots.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl border p-3 text-center transition-colors ${
                s.active
                  ? "border-brand-500/40 bg-brand-500/10"
                  : "border-white/8 bg-white/[0.02] opacity-60"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Slot {s.id}
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-white">{s.price}</p>
              <p className="text-[10px] text-slate-500">BTC</p>
              {s.active ? (
                <Pill tone="emerald" className="mt-1.5 !px-2 !py-0 !text-[10px]">
                  ×{s.cycles}
                </Pill>
              ) : (
                <Pill tone="slate" className="mt-1.5 !px-2 !py-0 !text-[10px]">
                  locked
                </Pill>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* Recent transactions */}
      <Panel className="mt-4" title="Recent activity" action={
        <Link href="/dashboard/transactions" className="text-sm font-medium text-brand-300 hover:text-brand-200">
          All transactions →
        </Link>
      }>
        <div className="flex flex-col divide-y divide-white/5">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="flex items-start justify-between gap-3 py-3 sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tx.amount >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {tx.amount >= 0 ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{tx.label}</p>
                  <p className="text-xs text-slate-500">{tx.date}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className={`font-mono text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-400" : "text-red-300"}`}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(4)}
                </p>
                <p className="text-xs text-slate-500">{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Quick actions */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/dashboard/share", icon: Share2, label: "Share referral link", desc: "Grow your direct team" },
          { href: "/dashboard/slots", icon: Layers, label: "Activate next slot", desc: `Slot ${user.highestSlot + 1} · ${slots[user.highestSlot].price} BTC` },
          { href: "/dashboard/royal-pool", icon: Crown, label: "Royal Pool", desc: "Passive pool income" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="glass glass-hover flex items-center gap-3 p-3.5 sm:p-4">
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
