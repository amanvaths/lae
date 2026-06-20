"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useLaeDirectTeam, useLaeUser } from "@/lib/lae-club/hooks";
import { truncateAddress } from "@/lib/format";

export default function TeamPage() {
  const user = useLaeUser();
  const team = useLaeDirectTeam();

  if (user.isLoading || team.isLoading) {
    return <QueryLoading label="Loading team from chain…" />;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">My Team</h1>
      <p className="mt-1 text-sm text-slate-400">
        Live data from getDirectPartnerIds / getUserDetails on BTitan matrix
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Panel title="Direct team">
          <p className="text-2xl font-bold text-white">{String(user.directCount ?? 0n)}</p>
        </Panel>
        <Panel title="Total team">
          <p className="text-2xl font-bold text-white">{String(user.teamSize ?? 0n)}</p>
        </Panel>
        <Panel title="Active levels">
          <p className="text-2xl font-bold text-white">{user.activeLevels ?? 0}</p>
        </Panel>
      </div>

      <Panel className="mt-6" title="Direct partners">
        {team.addresses.length === 0 ? (
          <p className="text-sm text-slate-500">No direct referrals yet</p>
        ) : (
          team.addresses.map((addr, i) => (
            <div
              key={addr}
              className="flex items-center justify-between border-b border-white/5 py-3 text-sm"
            >
              <span className="font-mono text-white">{truncateAddress(addr)}</span>
              <span className="text-slate-500">ID #{String(team.ids[i] ?? "—")}</span>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}
