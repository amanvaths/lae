"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { fetchLaeAdminAnalytics } from "@/lib/lae-club/admin-api";

type Analytics = {
  registrationsByDay: Array<{ day: string; count: number }>;
  incomeByKind: Array<{ kind: string; total: string; count: number }>;
  topEarners: Array<{
    userId: number;
    walletAddress: string;
    totalIncome: string;
    teamSize: number;
  }>;
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetchLaeAdminAnalytics().then((d) => setData(d as Analytics | null));
  }, []);

  return (
    <AdminShell title="Analytics">
      <h1 className="font-display text-2xl font-bold">Analytics</h1>
      <p className="mt-1 text-sm text-slate-400">Indexed LAE matrix analytics database</p>

      <Panel className="mt-6" title="Income by kind">
        {!data ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : data.incomeByKind.length === 0 ? (
          <p className="text-sm text-slate-500">No income indexed yet</p>
        ) : (
          data.incomeByKind.map((r) => (
            <div key={r.kind} className="flex justify-between border-b border-white/5 py-2 text-sm">
              <span className="capitalize">{r.kind}</span>
              <span>
                {r.count} events · {r.total}
              </span>
            </div>
          ))
        )}
      </Panel>

      <Panel className="mt-4" title="Top earners">
        {!data?.topEarners?.length ? (
          <p className="text-sm text-slate-500">No earners indexed yet</p>
        ) : (
          data.topEarners.map((u) => (
            <div key={u.userId} className="flex justify-between border-b border-white/5 py-2 text-sm">
              <span>
                #{u.userId} · team {u.teamSize}
              </span>
              <span className="text-emerald-400">{u.totalIncome}</span>
            </div>
          ))
        )}
      </Panel>

      <Panel className="mt-4" title="Registrations (30 days)">
        {!data?.registrationsByDay?.length ? (
          <p className="text-sm text-slate-500">No registration history</p>
        ) : (
          data.registrationsByDay.map((r) => (
            <div key={r.day} className="flex justify-between border-b border-white/5 py-2 text-sm">
              <span>{new Date(r.day).toLocaleDateString()}</span>
              <span>{r.count}</span>
            </div>
          ))
        )}
      </Panel>
    </AdminShell>
  );
}
