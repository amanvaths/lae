"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Panel } from "@/components/dashboard/ui";
import { QueryLoading } from "@/components/dashboard/QueryState";
import { useSensoUser } from "@/lib/contracts/hooks";
import { useRegisterOnChain } from "@/lib/contracts/hooks/useWrites";
import { truncateAddress } from "@/lib/format";
import { getSponsorFromUrl } from "@/lib/contracts/services/utils";
import { Loader2 } from "lucide-react";

export function RegisterPanel() {
  const { address } = useAccount();
  const user = useSensoUser();
  const register = useRegisterOnChain();
  const [pending, setPending] = useState(false);
  const urlSponsor = getSponsorFromUrl();

  if (user.isLoading) return <QueryLoading label="Checking registration…" />;

  if (user.data?.registered) {
    return (
      <Panel title="Registration">
        <div className="grid gap-2 text-sm">
          <p className="text-emerald-400">Registered on-chain</p>
          <p className="text-slate-400">
            Sponsor:{" "}
            <span className="font-mono text-white">
              {truncateAddress(user.data.sponsor)}
            </span>
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Register on-chain">
      <p className="mb-3 text-sm text-slate-400">
        You must register on LAE before purchasing packages.
        {urlSponsor && (
          <>
            {" "}
            Sponsor from link:{" "}
            <span className="font-mono text-brand-200">{truncateAddress(urlSponsor)}</span>
          </>
        )}
      </p>
      <button
        type="button"
        disabled={pending || !address}
        className="btn-primary disabled:opacity-50"
        onClick={async () => {
          setPending(true);
          try {
            await register(urlSponsor);
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Registering…
          </>
        ) : (
          "Register"
        )}
      </button>
    </Panel>
  );
}
