"use client";

import { Panel } from "@/components/dashboard/ui";
import { usePendingQueue } from "@/lib/contracts/hooks";
import { useProcessPending } from "@/lib/contracts/hooks/useWrites";
import { Loader2 } from "lucide-react";

export function PendingQueuePanel() {
  const pending = usePendingQueue();
  const { run, processing, processedTotal, pending: pendingCount } = useProcessPending();

  const count = Number(pending.data ?? pendingCount ?? 0n);

  return (
    <Panel title="Pending queue">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-bold text-white">{count}</p>
          <p className="text-xs text-slate-500">Actions waiting for processPending()</p>
          {processing && processedTotal > 0 && (
            <p className="mt-1 text-xs text-brand-300">Processed {processedTotal} steps…</p>
          )}
        </div>
        <button
          type="button"
          disabled={processing || count === 0}
          onClick={() => run()}
          className="btn-primary disabled:opacity-50"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </>
          ) : (
            "Process queue"
          )}
        </button>
      </div>
      {count > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-brand-500 transition-all"
            style={{ width: processing ? "60%" : "0%" }}
          />
        </div>
      )}
    </Panel>
  );
}
