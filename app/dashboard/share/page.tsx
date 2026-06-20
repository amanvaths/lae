"use client";

import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import {
  referralLinkByUserId,
  useLaeDirectTeam,
  useLaeUser,
} from "@/lib/lae-club/hooks";
import { truncateAddress } from "@/lib/format";

export default function SharePage() {
  const user = useLaeUser();
  const team = useLaeDirectTeam();
  const link = referralLinkByUserId(user.userId);

  if (user.isLoading) {
    return <QueryLoading label="Loading referral data…" />;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Share &amp; Refer</h1>
      <p className="mt-1 text-sm text-slate-400">
        BTitan registration uses numeric sponsor ID — share your User ID link
      </p>

      <Panel className="mt-6" title="Your referral link">
        {!user.registered ? (
          <p className="text-sm text-slate-500">Register first to get your User ID link</p>
        ) : (
          <>
            <code className="block break-all rounded-lg bg-black/30 p-3 text-sm text-brand-200">
              {link}
            </code>
            <p className="mt-2 text-xs text-slate-500">
              New users call <code className="text-brand-200">registrationExt({String(user.userId)})</code>
            </p>
          </>
        )}
      </Panel>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Panel title="Your User ID">
          <p className="text-2xl font-bold text-white">{String(user.userId ?? "—")}</p>
        </Panel>
        <Panel title="Direct referrals">
          <p className="text-2xl font-bold text-white">{String(user.directCount ?? 0n)}</p>
        </Panel>
        <Panel title="Your sponsor">
          <p className="font-mono text-sm text-white">
            #{String(user.sponsorId ?? "—")}{" "}
            {user.sponsorAddress ? `· ${truncateAddress(user.sponsorAddress)}` : ""}
          </p>
        </Panel>
      </div>

      <Panel className="mt-4" title="Direct referral IDs">
        {team.isLoading ? (
          <QueryLoading />
        ) : team.ids.length === 0 ? (
          <p className="text-sm text-slate-500">No direct referrals yet</p>
        ) : (
          team.ids.map((id) => (
            <div key={String(id)} className="border-b border-white/5 py-2 text-sm text-white">
              User #{String(id)}
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}
