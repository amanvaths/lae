"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { QueryError, QueryLoading } from "@/components/dashboard/QueryState";
import { fetchLaeAdminUsers } from "@/lib/lae-club/admin-api";
import { truncateAddress } from "@/lib/format";
import { useAdminFetch } from "@/hooks/useAdminFetch";

export default function AdminUsersPage() {
  const { data, error, loading, retry } = useAdminFetch("admin-users", () =>
    fetchLaeAdminUsers(200)
  );

  return (
    <AdminShell title="Users">
      <h1 className="font-display text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-slate-400">
        {data?.total ?? "—"} indexed registrations from LAE Matrix Registration events
      </p>

      <Panel className="mt-6" title="Recent users">
        {error ? (
          <QueryError message={error} onRetry={() => void retry()} />
        ) : loading && !data ? (
          <QueryLoading label="Loading users…" />
        ) : !data || data.users.length === 0 ? (
          <p className="text-sm text-slate-500">No indexed users — ensure indexer is running</p>
        ) : (
          <div className="table-scroll">
            <table className="text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2 pr-3">ID</th>
                  <th className="pb-2 pr-3">Wallet</th>
                  <th className="pb-2 pr-3">Sponsor</th>
                  <th className="pb-2 pr-3">Team</th>
                  <th className="pb-2">Income</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.walletAddress} className="border-t border-white/5">
                    <td className="py-2 pr-3 text-white">{u.userId}</td>
                    <td className="py-2 pr-3 font-mono text-brand-200">
                      {truncateAddress(u.walletAddress)}
                    </td>
                    <td className="py-2 pr-3">{u.sponsorId ?? "—"}</td>
                    <td className="py-2 pr-3">{u.teamSize}</td>
                    <td className="py-2">{u.totalIncome}</td>
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
