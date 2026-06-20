"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { QueryError } from "@/components/dashboard/QueryState";
import { fetchLaeAdminStaking } from "@/lib/lae-club/admin-api";
import { useLaeStaking } from "@/lib/lae-club/hooks";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress } from "@/lib/format";

type StakeRow = {
  walletAddress: string;
  amount: string;
  released: boolean;
  eventName: string;
  txHash: string;
};

export default function AdminStakingPage() {
  const live = useLaeStaking();
  const [indexed, setIndexed] = useState<{
    totalStaked: string;
    activeStakes: number;
    recent: StakeRow[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLaeAdminStaking().then((result) => {
      if (result.ok) {
        setIndexed(
          result.data as {
            totalStaked: string;
            activeStakes: number;
            recent: StakeRow[];
          }
        );
        setError(null);
      } else {
        setIndexed(null);
        setError(result.error);
      }
    });
  }, []);

  return (
    <AdminShell title="Staking">
      <h1 className="font-display text-2xl font-bold">Staking</h1>

      {error && (
        <div className="mt-4">
          <QueryError message={error} />
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Panel title="Global staked (live contract)">
          <p className="text-2xl font-bold">{fmtEther(live.totalStakedGlobal, 0)} LAE</p>
        </Panel>
        <Panel title="Indexed stake volume">
          <p className="text-2xl font-bold">
            {indexed?.totalStaked ? fmtEther(BigInt(indexed.totalStaked), 0) : "—"} LAE
          </p>
        </Panel>
        <Panel title="APR (live)">
          <p className="text-2xl font-bold">{Number(live.aprBps) / 100}%</p>
        </Panel>
      </div>

      <Panel className="mt-4" title="Recent stake events (indexer)">
        {!indexed?.recent?.length ? (
          <p className="text-sm text-slate-500">No indexed stake events</p>
        ) : (
          indexed.recent.map((s) => (
            <div key={s.txHash} className="flex justify-between border-b border-white/5 py-2 text-sm">
              <span>
                {truncateAddress(s.walletAddress)} · {s.eventName}
                {s.released ? " (released)" : ""}
              </span>
              <span>{fmtEther(BigInt(s.amount), 0)} LAE</span>
            </div>
          ))
        )}
      </Panel>
    </AdminShell>
  );
}
