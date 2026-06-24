"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Users,
  TrendingUp,
  Sparkles,
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
import { useMatrixCoreTreeApi } from "@/lib/lae-club/matrix-api";
import { buildSlotsFromApi } from "@/lib/lae-club/matrix-slots";
import { LAE_MATRIX_SIZE, LAE_COIN_TOKENOMICS } from "@/lib/lae-club/constants";
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
  const [matrixCycle, setMatrixCycle] = useState(1);
  const parsedId = parseLaeUserId(userId);

  const user = useLaeUserById(userId);
  const levels = useLaeAllMatrixLevelsForUser(user.userId ?? parsedId ?? undefined);
  const matrix = useLaeMatrixLevelForUser(
    user.walletAddress,
    user.userId ?? parsedId ?? undefined,
    matrixLevel,
    matrixCycle
  );
  const team = useLaeDirectTeamForUser(user.userId ?? parsedId ?? undefined);

  const viewUserIdNum = user.userId
    ? Number(user.userId)
    : parsedId != null
      ? Number(parsedId)
      : undefined;
  const treeApi = useMatrixCoreTreeApi(viewUserIdNum, matrixLevel, matrixCycle);
  const lvlSlots = treeApi.tree ? buildSlotsFromApi(treeApi.tree.slots) : undefined;

  const rewards = useLaeRewardSummaryForAddress(user.walletAddress);
  const events = useLaeUserEventsForUser(user.userId ?? parsedId ?? undefined, user.walletAddress);
  const vesting = useLaeVestingDirectRequirement(user.registeredAt);

  const incomeEvents = (events.data ?? []).filter((e) => e.eventName === "TokenReceived");
  const treasuryEvents = (events.data ?? []).filter((e) => e.eventName === "ClubPoolPayment");
  const totalMatrix = incomeEvents.reduce((s, e) => {
    const amount = (e.args as { amount?: bigint }).amount;
    return s + (amount ?? 0n);
  }, 0n);
  const totalTreasury = treasuryEvents.reduce((s, e) => {
    const amount = (e.args as { amount?: bigint }).amount;
    return s + (amount ?? 0n);
  }, 0n);
  const recycleCount = (events.data ?? []).filter((e) => e.eventName === "Reinvest").length;
  const currentCycle = user.currentCycle ?? (levels.levels.length || 1);

  if (!parsedId) {
    return (
      <Panel title="Invalid user ID">
        <p className="text-sm text-slate-400">Enter a valid numeric ID (1, 2, 3…).</p>
      </Panel>
    );
  }

  if (user.isLoading) {
    return <QueryLoading label="Loading user from MatrixCore…" />;
  }

  if (user.notFound) {
    return (
      <QueryError
        message={`User #${userId} not found on MatrixCore`}
        onRetry={() => user.refetch()}
      />
    );
  }

  const refLink = referralLinkByUserId(user.userId ?? parsedId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              tab === t.id
                ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                : "border-white/10 text-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total earned" value={fmtEther(user.totalIncome ?? totalMatrix)} icon={TrendingUp} />
          <StatCard label="Direct referrals" value={String(user.directCount ?? 0n)} icon={Users} />
          <StatCard label="Current cycle" value={String(user.currentCycle ?? 1)} icon={Layers} />
          <StatCard label="Recycles" value={String(recycleCount)} icon={RefreshCw} />
        </div>
      )}

      {tab === "matrix" && (
        <Panel title={`Cycle ${matrixCycle} · 14 Position Matrix`}>
          <div className="mb-4 flex flex-wrap gap-2">
            {Array.from({ length: currentCycle }, (_, i) => i + 1).map((c) => {
              const lc = levels.levels.find((l) => l.level === c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setMatrixCycle(c)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    matrixCycle === c
                      ? "border-[#D4AF37] text-[#D4AF37]"
                      : "border-white/10 text-slate-400"
                  }`}
                >
                  Cycle {c}
                  {lc ? ` · ${lc.filled}/${LAE_MATRIX_SIZE}` : ""}
                </button>
              );
            })}
          </div>
          {treeApi.isLoading ? (
            <QueryLoading label="Loading matrix tree…" />
          ) : !lvlSlots ? (
            <p className="text-sm text-red-300">Matrix API unavailable — ensure indexer is running.</p>
          ) : (
            <MatrixVisualizer
              slots={lvlSlots}
              levelActive={matrix.active}
              level={matrixCycle}
              reinvestCount={matrix.reinvestCount}
              totalEarning={matrix.totalEarning}
            />
          )}
        </Panel>
      )}

      {tab === "team" && (
        <Panel title="Direct team">
          {team.isLoading ? (
            <QueryLoading label="Loading team…" />
          ) : team.ids.length === 0 ? (
            <p className="text-sm text-slate-400">No direct referrals yet.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {team.ids.map((id, i) => (
                <li key={String(id)} className="flex items-center justify-between py-3 text-sm">
                  <Link href={withBasePath(`/view/${String(id)}`)} className="text-[#D4AF37] hover:underline">
                    User #{String(id)}
                  </Link>
                  <span className="text-slate-500">{truncateAddress(team.addresses[i] ?? "")}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {tab === "income" && (
        <Panel title="Income events">
          <p className="mb-4 text-sm text-slate-400">
            Matrix {fmtEther(totalMatrix)} · Treasury {fmtEther(totalTreasury)}
          </p>
          {(events.data ?? []).slice(0, 20).map((e, i) => (
            <div key={`${e.transactionHash}-${i}`} className="flex justify-between py-2 text-sm">
              <Pill tone="gold">{e.eventName}</Pill>
              <a href={txUrl(e.transactionHash)} target="_blank" rel="noreferrer" className="text-[#D4AF37]/70">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </Panel>
      )}

      {tab === "rewards" && (
        <Panel title="LAE Coin rewards">
          <p className="text-sm text-slate-400">
            {rewards.supported
              ? `LAE Coin vesting — ${LAE_COIN_TOKENOMICS.vestingMonths} months · pool ${LAE_COIN_TOKENOMICS.rewardPool.toLocaleString()} LAE`
              : "Rewards not configured"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Direct referrals: {String(vesting.requiredDirects)} required this month
          </p>
          {refLink ? (
            <p className="mt-4 text-xs text-slate-500">
              Referral:{" "}
              <a href={refLink} className="text-[#D4AF37]">
                {refLink}
              </a>
            </p>
          ) : null}
          {user.walletAddress ? (
            <a
              href={addressUrl(user.walletAddress)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#D4AF37]"
            >
              View wallet <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </Panel>
      )}
    </div>
  );
}
