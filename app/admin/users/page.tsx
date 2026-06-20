"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { fetchLaeAdminUsers, type LaeIndexedUser } from "@/lib/lae-club/admin-api";
import { truncateAddress } from "@/lib/format";

export default function AdminUsersPage() {
  const [data, setData] = useState<{ users: LaeIndexedUser[]; total: number } | null>(null);

  useEffect(() => {
    fetchLaeAdminUsers(200).then(setData);
  }, []);

  return (
    <AdminShell title="Users">
      <h1 className="font-display text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-slate-400">
        {data?.total ?? "—"} indexed registrations from BTitan Registration events
      </p>

      <Panel className="mt-6" title="Recent users">
        {!data ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : data.users.length === 0 ? (
          <p className="text-sm text-slate-500">No indexed users — ensure indexer is running</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Wallet</th>
                  <th className="pb-2">Sponsor</th>
                  <th className="pb-2">Team</th>
                  <th className="pb-2">Income</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.walletAddress} className="border-t border-white/5">
                    <td className="py-2 text-white">{u.userId}</td>
                    <td className="py-2 font-mono text-brand-200">
                      {truncateAddress(u.walletAddress)}
                    </td>
                    <td className="py-2">{u.sponsorId ?? "—"}</td>
                    <td className="py-2">{u.teamSize}</td>
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
