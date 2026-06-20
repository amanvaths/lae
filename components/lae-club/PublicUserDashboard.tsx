"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Users,
  TrendingUp,
  Sparkles,
  Crown,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { StatCard, Panel, Pill } from "@/components/dashboard/ui";
import { QueryLoading, QueryError } from "@/components/dashboard/QueryState";
import { MatrixVisualizer } from "@/components/lae-club/MatrixVisualizer";
import {
  useLaeUserById,
  useLaeAllMatrixLevelsForUser,
  useLaeMatrixLevelForUser,
  useLaeDirectTeamForUser,
  useLaeRewardSummaryForAddress,
  useLaeUserEventsForUser,
  useLaeVestingDirectRequirement,
  referralLinkByUserId,
  parseLaeUserId,
} from "@/lib/lae-club/hooks";
import { LAE_LEVELS, LAE_COIN_TOKENOMICS } from "@/lib/lae-club/constants";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";
import { withBasePath } from "@/lib/paths";
import { txUrl, addressUrl } from "@/lib/lae-club/contracts";

type Tab = "overview" | "matrix" | "team" | "income" | "rewards";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "matrix", label: "Matrix" },
  { id: "team", label: "Team" },
  { id: "income", label: "Income" },
  { id: "rewards", label: "Rewards" },
];

export function PublicUserDashboard({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [matrixLevel, setMatrixLevel] = useState(1);
  const parsedId = parseLaeUserId(userId);

  const user = useLaeUserById(userId);
  const levels = useLaeAllMatrixLevelsForUser(user.userId ?? parsedId ?? undefined);
  const matrixL1 = useLaeMatrixLevelForUser(user.walletAddress, user.userId ?? parsedId ?? undefined, 1);
  const matrix = useLaeMatrixLevelForUser(user.walletAddress, user.userId ?? parsedId ?? undefined, matrixLevel);
  const team = useLaeDirectTeamForUser(user.userId ?? parsedId ?? undefined);
  const rewards = useLaeRewardSummaryForAddress(user.walletAddress);
  const events = useLaeUserEventsForUser(user.userId ?? parsedId ?? undefined, user.walletAddress);
  const vesting = useLaeVestingDirectRequirement(user.registeredAt);

  const incomeEvents = (events.data ?? []).filter((e) => e.eventName === "TokenReceived");
  const royalEvents = (events.data ?? []).filter((e) => e.eventName === "ClubPoolPayment");
  const totalMatrix = incomeEvents.reduce((s, e) => s + ((e.args.amount as bigint) ?? 0n), 0n);
  const totalRoyal = royalEvents.reduce((s, e) => s + ((e.args.amount as bigint) ?? 0n), 0n);
  const recycleCount = (events.data ?? []).filter((e) => e.eventName === "Reinvest").length;

  if (!parsedId) {
    return (
      <Panel title="Invalid user ID">
        <p className="text-sm text-slate-400">Enter a valid numeric ID (1, 2, 3…).</p>
      </Panel>
    );
  }

  if (user.isLoading) {
    return <QueryLoading label="Loading user from blockchain…" />;
  }

  if (user.isError) {
    return (
      <QueryError
        message="Could not load user — check BSC Testnet RPC and retry."
        onRetry={() => user.refetch()}
      />
    );
  }

  const isOnChain = user.registered && !user.notFound;
  const displayId = user.userId ?? parsedId;
  const royalRank =
    (user.activeLevels ?? 0) >= 12 ? 4 : (user.activeLevels ?? 0) >= 9 ? 3 : (user.activeLevels ?? 0) >= 6 ? 2 : (user.activeLevels ?? 0) >= 3 ? 1 : 0;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Pill tone="gold" className="mb-2">
            Read-only · no wallet
          </Pill>
          {!isOnChain && (
            <Pill tone="slate" className="mb-2 ml-2">
              ID #{String(displayId)} — not registered on-chain yet
            </Pill>
          )}
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
            User #{String(displayId)}
            {isOnChain && user.userAddress ? (
              <>
                {" · "}
                <span className="font-mono text-brand-300">
                  {truncateAddress(user.userAddress, 6, 4)}
                </span>
              </>
            ) : null}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isOnChain ? (
              <>
                Sponsor #{String(user.sponsorId ?? "—")} ·{" "}
                {levels.isLoading ? "…" : `${levels.activeCount} active levels`}
              </>
            ) : (
              "This ID slot is available — no wallet registered yet."
            )}
          </p>
          {user.userAddress && (
            <a
              href={addressUrl(user.userAddress)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-brand-300 hover:underline"
            >
              View on BscScan <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <Link href={withBasePath("/login")} className="btn-primary shrink-0 justify-center text-sm">
          Connect wallet to manage
        </Link>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-brand-500 text-ink-950"
                : "border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="User ID" value={String(user.userId)} sub={`Sponsor #${String(user.sponsorId ?? "—")}`} icon={Layers} accent="brand" />
            <StatCard label="Direct Team" value={String(user.directCount ?? 0n)} sub={`Total ${String(user.teamSize ?? 0n)}`} icon={Users} accent="violet" />
            <StatCard label="Matrix Income" value={fmtEther(totalMatrix || user.totalIncome || 0n)} sub={`Royal ${fmtEther(totalRoyal)}`} icon={TrendingUp} accent="gold" />
            <StatCard label="Recycles" value={String(recycleCount)} sub={royalRank > 0 ? `Royal ${royalRank}` : "—"} icon={RefreshCw} accent="emerald" />
          </div>
          <Panel title="Level 1 matrix" className="mt-4">
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
        </>
      )}

      {tab === "matrix" && (
        <>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: LAE_LEVELS }, (_, i) => i + 1).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setMatrixLevel(l)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  l === matrixLevel ? "bg-brand-500 text-ink-950" : "border border-white/10 text-slate-400"
                }`}
              >
                L{l}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Panel title={`Level ${matrixLevel}`}>
              <div className="space-y-2 text-sm">
                <p className="text-slate-400">Filled: <span className="text-emerald-400">{matrix.filledSpots}/14</span></p>
                <p className="text-slate-400">Team: <span className="text-white">{String(matrix.totalTeamSize)}</span></p>
                <p className="text-slate-400">Recycles: <span className="text-white">{String(matrix.reinvestCount)}</span></p>
                <p className="text-slate-400">Earnings: <span className="text-brand-300">{fmtEther(matrix.totalEarning)}</span></p>
              </div>
            </Panel>
            <Panel title="Matrix tree" className="lg:col-span-2">
              {matrix.isLoading ? (
                <QueryLoading label="Loading level…" />
              ) : (
                <MatrixVisualizer
                  referrals={matrix.referrals}
                  level={matrixLevel}
                  reinvestCount={matrix.reinvestCount}
                  totalEarning={matrix.totalEarning}
                />
              )}
            </Panel>
          </div>
          <Panel title="Active levels" className="mt-4">
            {levels.isLoading ? (
              <QueryLoading label="Loading levels…" />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {levels.levels.map((l) => (
                  <span
                    key={l.level}
                    className={`rounded px-2 py-0.5 text-xs ${l.active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-500"}`}
                  >
                    L{l.level}
                  </span>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      {tab === "team" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Panel title="Direct"><p className="text-2xl font-bold">{String(user.directCount ?? 0n)}</p></Panel>
            <Panel title="Total team"><p className="text-2xl font-bold">{String(user.teamSize ?? 0n)}</p></Panel>
            <Panel title="Active levels"><p className="text-2xl font-bold">{user.activeLevels ?? 0}</p></Panel>
          </div>
          <Panel title="Direct partners" className="mt-4">
            {team.isLoading ? (
              <QueryLoading label="Loading team…" />
            ) : team.addresses.length === 0 ? (
              <p className="text-sm text-slate-500">No direct referrals yet</p>
            ) : (
              team.addresses.map((addr, i) => (
                <div key={addr} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-3 text-sm">
                  <Link href={withBasePath(`/view?id=${String(team.ids[i] ?? "")}`)} className="font-mono text-brand-300 hover:underline">
                    ID #{String(team.ids[i] ?? "—")} · {truncateAddress(addr)}
                  </Link>
                </div>
              ))
            )}
          </Panel>
        </>
      )}

      {tab === "income" && (
        <>
          <Panel title="On-chain totals">
            <p className="text-2xl font-bold text-emerald-400">{fmtEther(user.totalIncome ?? totalMatrix)}</p>
            <p className="mt-1 text-sm text-slate-400">Matrix · Royal {fmtEther(totalRoyal)}</p>
          </Panel>
          <Panel title="Income events" className="mt-4">
            {events.isLoading ? (
              <QueryLoading label="Loading events…" />
            ) : incomeEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No indexed events (RPC may be limited)</p>
            ) : (
              incomeEvents.slice(-20).reverse().map((e, i) => (
                <div key={`${e.transactionHash}-${i}`} className="flex justify-between gap-2 border-b border-white/5 py-2 text-sm">
                  <a href={txUrl(e.transactionHash)} target="_blank" rel="noreferrer" className="truncate text-brand-300 hover:underline">
                    L{String(e.args.level ?? "—")} · {truncateAddress(e.transactionHash)}
                  </a>
                  <span className="text-emerald-400">+{fmtEther((e.args.amount as bigint) ?? 0n)}</span>
                </div>
              ))
            )}
          </Panel>
        </>
      )}

      {tab === "rewards" && (
        <>
          {rewards.isLoading ? (
            <QueryLoading label="Loading LAE rewards…" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard label="Allocated" value={`${fmtEther(rewards.allocated, 4)} LAE`} icon={Sparkles} accent="brand" />
              <StatCard label="Claimed" value={`${fmtEther(rewards.claimed, 4)} LAE`} icon={Crown} accent="gold" />
              <StatCard label="Claimable" value={`${fmtEther(rewards.claimable, 4)} LAE`} accent="emerald" />
              <StatCard label="Locked" value={`${fmtEther(rewards.locked, 4)} LAE`} />
              <StatCard label="Directs" value={rewards.directCount.toString()} sub={`Month ${vesting.month}: need ${vesting.requiredDirects}`} />
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">
            {LAE_COIN_TOKENOMICS.vestingMonths}-month vesting · connect wallet to claim rewards
          </p>
        </>
      )}

      {tab === "overview" && (
        <Panel title="Referral link" className="mt-4">
          <code className="block break-all rounded bg-black/30 p-2 text-xs text-brand-200">
            {isOnChain ? referralLinkByUserId(displayId) || "—" : `${typeof window !== "undefined" ? window.location.origin : ""}${withBasePath("/register")}?ref=${String(displayId)}`}
          </code>
        </Panel>
      )}
    </div>
  );
}
