"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Panel } from "@/components/dashboard/ui";
import { LAE_CONTRACTS, addressUrl } from "@/lib/lae-club/contracts";
import { triggerAdminIndexerSync } from "@/lib/lae-club/admin-api";
import { Loader2, RefreshCw } from "lucide-react";

const ADMIN_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const MATRIX_DEPLOY_BLOCK = "114471162";

type Settings = {
  contracts: Record<string, string>;
  indexer: {
    lastBlock: string;
    chainId: number | null;
    lastBlockHash: string | null;
    matrixDeployBlock?: string;
    indexedUsers?: number;
  };
  adminEmail: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const loadSettings = useCallback(() => {
    const token = localStorage.getItem("lae_admin_token");
    if (!token) return;
    fetch(`${ADMIN_API}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setSettings);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSyncIndexer() {
    setSyncing(true);
    setSyncMsg(null);
    const res = await triggerAdminIndexerSync(MATRIX_DEPLOY_BLOCK);
    setSyncing(false);
    if (!res.ok) {
      setSyncMsg(res.error);
      return;
    }
    setSyncMsg(
      `Synced — ${res.data.indexedUsers} users indexed, ${res.data.chainEvents} events, block ${res.data.lastBlock}`
    );
    loadSettings();
  }

  const lagging =
    settings &&
    BigInt(settings.indexer.lastBlock ?? "0") <
      BigInt(settings.indexer.matrixDeployBlock ?? MATRIX_DEPLOY_BLOCK);

  return (
    <AdminShell title="Settings">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <Panel className="mt-6" title="Blockchain indexer">
        {!settings ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            {lagging && (
              <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Indexer is behind matrix deploy block — users and income will not show until you
                sync.
              </p>
            )}
            <p className="text-sm text-slate-400">Chain ID: {settings.indexer.chainId ?? "—"}</p>
            <p className="text-sm text-slate-400">Last indexed block: {settings.indexer.lastBlock}</p>
            <p className="text-sm text-slate-400">
              Matrix deploy block: {settings.indexer.matrixDeployBlock ?? MATRIX_DEPLOY_BLOCK}
            </p>
            <p className="text-sm text-slate-400">
              Indexed users: {settings.indexer.indexedUsers ?? 0}
            </p>
            <p className="text-sm text-slate-400">
              Last hash: {settings.indexer.lastBlockHash ?? "—"}
            </p>
            <button
              type="button"
              disabled={syncing}
              onClick={() => void handleSyncIndexer()}
              className="auth-btn-gold mt-4 inline-flex w-full max-w-sm items-center justify-center gap-2 !py-3 text-sm"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Syncing from chain…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" /> Sync indexer now
                </>
              )}
            </button>
            {syncMsg && (
              <p className="mt-2 text-xs text-slate-400">{syncMsg}</p>
            )}
            <p className="mt-3 text-[11px] text-slate-500">
              Re-scans Registration, income, and placement events from the LAE Matrix contract.
            </p>
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
