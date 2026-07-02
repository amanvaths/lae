"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { QueryError, QueryLoading } from "@/components/dashboard/QueryState";
import { fetchLaeAdminUsers } from "@/lib/lae-club/admin-api";
import { fmtEther, incomeStringToWei } from "@/lib/contracts/format";
import { truncateAddress, formatDate } from "@/lib/format";
import { withBasePath } from "@/lib/paths";
import { useAdminFetch } from "@/hooks/useAdminFetch";

export default function AdminUsersPage() {
  const { data, error, loading, retry } = useAdminFetch("admin-users", () =>
    fetchLaeAdminUsers(500)
  );
  const [q, setQ] = useState("");

  const users = useMemo(() => {
    const rows = data?.users ?? [];
    const needle = q.trim().toLowerCase().replace(/^#/, "");
    if (!needle) return rows;
    return rows.filter(
      (u) =>
        String(u.userId).includes(needle) ||
        String(u.sponsorId ?? "").includes(needle) ||
        u.walletAddress.toLowerCase().includes(needle)
    );
  }, [data, q]);

  return (
    <AdminShell title="Users">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-slate-400">
            <span className="font-semibold text-[#D4AF37]">{data?.total ?? "—"}</span> indexed
            registrations · showing {users.length}
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ID, sponsor or wallet"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#D4AF37]/40"
          />
        </div>
      </div>

      <Panel className="mt-6" title="Registered users">
        {error ? (
          <QueryError message={error} onRetry={() => void retry()} />
        ) : loading && !data ? (
          <QueryLoading label="Loading users…" />
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500">
            {q ? "No users match your search" : "No indexed users — ensure indexer is running"}
          </p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 text-xs uppercase tracking-wide text-slate-500">
                <tr className="border-b border-white/10">
                  <th className="py-2.5 pr-3">ID</th>
                  <th className="py-2.5 pr-3">Wallet</th>
                  <th className="py-2.5 pr-3">Sponsor</th>
                  <th className="py-2.5 pr-3 text-right">Directs</th>
                  <th className="py-2.5 pr-3 text-right">Earned</th>
                  <th className="py-2.5 pr-3 text-right">Cycles</th>
                  <th className="py-2.5 pr-3">Registered</th>
                  <th className="py-2.5 text-right">Analytics</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.userId}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="py-2.5 pr-3 font-semibold text-white">#{u.userId}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-[#D4AF37]/80">
                      {truncateAddress(u.walletAddress)}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300">
                      {u.sponsorId != null ? `#${u.sponsorId}` : "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-slate-300">
                      {u.directReferrals}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-emerald-300">
                      {fmtEther(incomeStringToWei(u.totalEarned))}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-slate-300">
                      {u.totalCycles}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">
                      {u.registeredAt ? formatDate(u.registeredAt) : "—"}
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href={withBasePath(`/view?viewUserId=${u.userId}`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-medium text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/20"
                      >
                        Open <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
