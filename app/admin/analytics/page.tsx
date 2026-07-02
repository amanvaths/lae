"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { QueryError, QueryLoading } from "@/components/dashboard/QueryState";
import {
  fetchLaeAdminAnalyticsTyped,
  type LaeAdminAnalytics,
} from "@/lib/lae-club/admin-api";
import { fmtEther } from "@/lib/contracts/format";
import { truncateAddress, formatDate } from "@/lib/format";
import { withBasePath } from "@/lib/paths";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<LaeAdminAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLaeAdminAnalyticsTyped().then((result) => {
      if (result.ok) {
        setData(result.data);
        setError(null);
      } else {
        setData(null);
        setError(result.error);
      }
      setLoading(false);
    });
  }, []);

  const maxReg = Math.max(1, ...(data?.registrationsByDay ?? []).map((r) => r.count));

  return (
    <AdminShell title="Analytics">
      <h1 className="font-display text-2xl font-bold text-white">Analytics</h1>
      <p className="mt-1 text-sm text-slate-400">Indexed LAE matrix analytics</p>

      {error && (
        <div className="mt-4">
          <QueryError message={error} />
        </div>
      )}

      {loading ? (
        <div className="mt-6">
          <QueryLoading label="Loading analytics…" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel title="Income by kind">
            {!data || data.incomeByKind.length === 0 ? (
              <p className="text-sm text-slate-500">No income indexed yet</p>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {data.incomeByKind.map((r) => (
                  <div key={r.kind} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="capitalize text-slate-300">{r.kind}</span>
                    <span className="text-right">
                      <span className="font-mono text-[#D4AF37]">{fmtEther(BigInt(r.total))}</span>
                      <span className="ml-2 text-xs text-slate-500">{r.count} events</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Top earners">
            {!data?.topEarners?.length ? (
              <p className="text-sm text-slate-500">No earners indexed yet</p>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {data.topEarners.map((u, i) => (
                  <div key={u.userId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[10px] font-bold text-[#D4AF37]">
                        {i + 1}
                      </span>
                      <span className="truncate">
                        <span className="font-semibold text-white">#{u.userId}</span>
                        <span className="ml-2 font-mono text-xs text-slate-500">
                          {truncateAddress(u.walletAddress)}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-slate-500">{u.directReferrals} directs</span>
                      <span className="font-mono text-emerald-300">
                        {fmtEther(BigInt(u.totalEarned))}
                      </span>
                      <Link
                        href={withBasePath(`/view?viewUserId=${u.userId}`)}
                        className="text-[#D4AF37] hover:text-[#ffe082]"
                        title="Open analytics"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Registrations (last 30 days)" className="lg:col-span-2">
            {!data?.registrationsByDay?.length ? (
              <p className="text-sm text-slate-500">No registration history</p>
            ) : (
              <div className="space-y-1.5">
                {data.registrationsByDay.map((r) => (
                  <div key={String(r.day)} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-xs text-slate-500">
                      {formatDate(String(r.day))}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B]"
                        style={{ width: `${Math.max(3, (r.count / maxReg) * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right tabular-nums text-white">{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </AdminShell>
  );
}
