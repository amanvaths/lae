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
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">My Team</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        Live direct referrals from MatrixCore getDirectReferrals()
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-[#D4AF37]/40 hover:shadow-glow-gold">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-[#D4AF37]/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-[#D4AF37]/70 uppercase tracking-wider">Direct team</h2>
          <p className="relative mt-2 text-2xl font-bold text-gradient-gold sm:text-3xl">{String(user.directCount ?? 0n)}</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-emerald-400/70 uppercase tracking-wider">Total team</h2>
          <p className="relative mt-2 text-2xl font-bold text-emerald-400 sm:text-3xl">{String(user.teamSize ?? 0n)}</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[#C0C0C0]/20 bg-ink-900/80 p-5 backdrop-blur-xl transition-all duration-500 hover:border-[#C0C0C0]/40 hover:shadow-[0_0_40px_-10px_rgba(192,192,192,0.2)]">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-[#C0C0C0]/25 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
          <h2 className="relative font-display text-sm font-semibold text-[#C0C0C0]/70 uppercase tracking-wider">Active levels</h2>
          <p className="relative mt-2 text-2xl font-bold text-white sm:text-3xl">{user.activeLevels ?? 0}</p>
        </div>
      </div>

      <Panel className="mt-6 border-[#D4AF37]/15" title="Direct partners">
        {team.addresses.length === 0 ? (
          <p className="text-sm text-slate-500">No direct referrals yet</p>
        ) : (
          team.addresses.map((addr, i) => (
            <div
              key={addr}
              className="flex items-center justify-between border-b border-[#D4AF37]/10 py-3.5 text-sm transition-colors hover:bg-[#D4AF37]/[0.03]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-xs font-bold text-[#D4AF37]">
                  {i + 1}
                </span>
                <span className="font-mono text-white">{truncateAddress(addr)}</span>
              </div>
              <span className="inline-flex items-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-medium text-[#D4AF37]">
                ID #{String(team.ids[i] ?? "—")}
              </span>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}
