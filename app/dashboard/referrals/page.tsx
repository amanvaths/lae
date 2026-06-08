"use client";

import { useState } from "react";
import { UserPlus, Copy, Check, Share2 } from "lucide-react";
import { PageHeading, Panel, Pill, StatCard, Progress } from "@/components/dashboard/ui";
import { directReferrals, user, fmtBtc } from "@/lib/dashboard-data";

const directEarned = directReferrals.reduce((a, d) => a + d.earned, 0);
const RANK_TARGET = 5; // 5 directs needed for Rising rank (slide 17)

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(user.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div>
      <PageHeading
        icon={UserPlus}
        title="Direct Referrals"
        subtitle="Members you personally sponsored. Refer 5 directly and upgrade them to climb the rank ladder."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Direct referrals" value={directReferrals.length} sub={`Target ${RANK_TARGET} for Rising`} accent="brand" />
        <StatCard label="Direct earnings" value={fmtBtc(directEarned, 4)} accent="gold" />
        <StatCard label="Active directs" value={directReferrals.filter((d) => d.status === "active").length} accent="emerald" />
      </div>

      <Panel className="mb-4" title="Rank requirement progress" desc="Refer 5 directly → upgrade them → advance rank">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">{directReferrals.length} of {RANK_TARGET} direct referrals</span>
          <span className="text-white">{Math.min(100, (directReferrals.length / RANK_TARGET) * 100).toFixed(0)}%</span>
        </div>
        <Progress value={(directReferrals.length / RANK_TARGET) * 100} tone="gold" />
      </Panel>

      <Panel
        className="mb-4"
        title="Your referral link"
        action={
          <button onClick={copy} className="btn-ghost !px-4 !py-2 text-sm">
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-brand-200">
            {user.referralLink}
          </code>
          <a href="/dashboard/share" className="btn-primary shrink-0 !py-3">
            <Share2 className="h-4 w-4" /> Share
          </a>
        </div>
      </Panel>

      <Panel title="Direct referrals list">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3">Member</th>
                <th className="py-3">Joined</th>
                <th className="py-3">Slot</th>
                <th className="py-3">Their team</th>
                <th className="py-3">Earned</th>
                <th className="py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {directReferrals.map((d) => (
                <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-accent-600 text-xs font-bold text-white">
                        {d.username.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="font-medium text-white">@{d.username}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-400">{d.joined}</td>
                  <td className="py-3 font-mono text-slate-300">#{d.slot}</td>
                  <td className="py-3 text-slate-300">{d.team}</td>
                  <td className="py-3 font-mono font-semibold text-gradient">{fmtBtc(d.earned, 3)}</td>
                  <td className="py-3 text-right">
                    <Pill tone={d.status === "active" ? "emerald" : "gold"}>{d.status}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
