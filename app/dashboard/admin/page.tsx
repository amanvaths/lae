"use client";

import Link from "next/link";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import {
  useProtocolStatus,
  useIsRootAdmin,
  usePendingQueue,
} from "@/lib/contracts/hooks";
import { CONTRACTS } from "@/lib/contracts/addresses";
import { withBasePath } from "@/lib/paths";

export default function AdminPage() {
  const admin = useIsRootAdmin();
  const protocol = useProtocolStatus();
  const pending = usePendingQueue();

  if (admin.isLoading || protocol.isLoading) {
    return <QueryLoading label="Loading protocol status…" />;
  }

  if (!admin.data) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400">Root sponsor wallet required for admin view</p>
        <Link href={withBasePath("/dashboard")} className="mt-4 inline-block text-brand-300">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Protocol Admin</h1>
      <p className="mt-1 text-sm text-slate-400">On-chain protocol status (root wallet)</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Panel title="Activated">
          <p className="text-2xl font-bold text-white">
            {protocol.data?.activated ? "Yes" : "No"}
          </p>
        </Panel>
        <Panel title="Pending queue">
          <p className="text-2xl font-bold text-white">{String(pending.data ?? 0n)}</p>
        </Panel>
        <Panel title="Root sponsor">
          <p className="break-all font-mono text-xs text-white">{protocol.data?.rootSponsor}</p>
        </Panel>
      </div>

      <Panel className="mt-6" title="Contract addresses">
        <dl className="space-y-2 font-mono text-xs text-slate-300">
          {Object.entries(CONTRACTS).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-white/5 py-2">
              <dt className="text-slate-500">{k}</dt>
              <dd className="truncate text-brand-200">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
