"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { LAE_CONTRACTS, addressUrl } from "@/lib/lae-club/contracts";

const ADMIN_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Settings = {
  contracts: Record<string, string>;
  indexer: { lastBlock: string; chainId: number | null; lastBlockHash: string | null };
  adminEmail: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("lae_admin_token");
    if (!token) return;
    fetch(`${ADMIN_API}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setSettings);
  }, []);

  return (
    <AdminShell title="Settings">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <Panel className="mt-6" title="Indexer state">
        {!settings ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <p className="text-sm text-slate-400">Chain ID: {settings.indexer.chainId ?? "—"}</p>
            <p className="text-sm text-slate-400">Last block: {settings.indexer.lastBlock}</p>
            <p className="text-sm text-slate-400">
              Last hash: {settings.indexer.lastBlockHash ?? "—"}
            </p>
            <p className="mt-2 text-sm text-slate-400">Admin: {settings.adminEmail}</p>
          </>
        )}
      </Panel>

      <Panel className="mt-4" title="Contract addresses">
        {Object.entries(LAE_CONTRACTS).map(([key, addr]) => (
          <div key={key} className="border-b border-white/5 py-2 text-sm">
            <span className="text-slate-500">{key}</span>
            <a
              href={addressUrl(addr)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all font-mono text-xs text-brand-300 hover:underline"
            >
              {addr}
            </a>
          </div>
        ))}
      </Panel>

      {settings?.contracts && (
        <Panel className="mt-4" title="Backend indexer targets">
          {Object.entries(settings.contracts).map(([key, addr]) => (
            <div key={key} className="border-b border-white/5 py-2 text-sm">
              <span className="text-slate-500">{key}</span>
              <p className="font-mono text-xs text-white">{addr}</p>
            </div>
          ))}
        </Panel>
      )}
    </AdminShell>
  );
}
