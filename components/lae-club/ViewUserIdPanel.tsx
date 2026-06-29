"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2 } from "lucide-react";
import { Panel } from "@/components/dashboard/ui";
import { withBasePath } from "@/lib/paths";
import { parseLaeUserId } from "@/lib/lae-club/hooks";

export function ViewUserIdPanel({ initialId = "" }: { initialId?: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState(initialId);

  useEffect(() => {
    setUserId(initialId);
    setPending(false);
  }, [initialId]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleView() {
    setError(null);
    const id = parseLaeUserId(userId);
    if (!id) {
      setError("Enter a valid user ID (1, 2, 3…)");
      return;
    }
    setPending(true);
    router.push(withBasePath(`/dashboard?viewUserId=${id.toString()}`));
  }

  return (
    <Panel title="View by User ID">
      <p className="mb-3 text-sm text-slate-400">
        Browse any user ID on-chain — registered or not. No wallet required.
      </p>
      <label className="mb-3 block text-xs text-slate-500">
        User ID
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder="e.g. 1, 2, 3…"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleView();
          }}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-white outline-none focus:border-brand-500/50"
        />
      </label>
      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
      <button
        type="button"
        disabled={pending || !userId.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500/40 bg-brand-500/10 px-4 py-2.5 text-sm font-semibold text-brand-200 transition-colors hover:bg-brand-500/20 disabled:opacity-50"
        onClick={handleView}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Opening…
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" /> View dashboard
          </>
        )}
      </button>
    </Panel>
  );
}
