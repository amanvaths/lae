"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useLaeDirectTeam, useLaeUser } from "@/lib/lae-club/hooks";
import { truncateAddress } from "@/lib/format";

export default function ReferralsPage() {
  const user = useLaeUser();
  const team = useLaeDirectTeam();

  if (user.isLoading || team.isLoading) {
    return <QueryLoading label="Loading referrals from chain…" />;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Direct Referrals</h1>
      <p className="mt-1 text-sm text-slate-400">
        {team.ids.length} direct partner{team.ids.length === 1 ? "" : "s"} · Sponsor ID #
        {String(user.sponsorId ?? "—")}
      </p>

      <Panel className="mt-6" title="Referral list">
        {team.ids.length === 0 ? (
          <p className="text-sm text-slate-500">No direct referrals yet</p>
        ) : (
          team.ids.map((id, i) => (
            <div
              key={String(id)}
              className="grid gap-1 border-b border-white/5 py-3 text-sm sm:grid-cols-2"
            >
              <span className="font-semibold text-white">User #{String(id)}</span>
              <span className="font-mono text-slate-400">
                {truncateAddress(team.addresses[i] ?? "")}
              </span>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}
