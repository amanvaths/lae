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
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Direct Referrals</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        <span className="font-semibold text-[#D4AF37]">{team.ids.length}</span> direct partner{team.ids.length === 1 ? "" : "s"} · Sponsor ID{" "}
        <span className="font-semibold text-[#D4AF37]">#{String(user.sponsorId ?? "—")}</span>
      </p>

      <Panel className="mt-6 border-[#D4AF37]/15" title="Referral list">
        {team.ids.length === 0 ? (
          <p className="text-sm text-slate-500">No direct referrals yet</p>
        ) : (
          team.ids.map((id, i) => (
            <div
              key={String(id)}
              className="flex flex-col gap-1 border-b border-[#D4AF37]/10 py-3.5 text-sm transition-colors hover:bg-[#D4AF37]/[0.03] sm:flex-row sm:items-center sm:justify-between sm:gap-2"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-xs font-bold text-[#D4AF37]">
                  {i + 1}
                </span>
                <span className="font-semibold text-white">User #{String(id)}</span>
              </div>
              <span className="ml-11 font-mono text-xs text-[#C0C0C0] sm:ml-0">
                {truncateAddress(team.addresses[i] ?? "")}
              </span>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}
