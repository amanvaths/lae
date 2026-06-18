"use client";

import { Panel } from "@/components/dashboard/ui";
import { CONTRACTS, EXPLORER_URL } from "@/lib/contracts/addresses";

export default function SupportPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Support</h1>
      <p className="mt-1 text-sm text-slate-400">BSC Testnet troubleshooting</p>

      <Panel className="mt-6" title="Common fixes">
        <ul className="list-inside list-disc space-y-2 text-sm text-slate-300">
          <li>Switch wallet to BSC Testnet (Chain ID 97)</li>
          <li>Get test BNB from the BSC testnet faucet</li>
          <li>Use Deposit page → Faucet for MockDAI before purchase</li>
          <li>After purchase, run Process queue until pending is 0</li>
          <li>Disconnect and reconnect wallet from Settings if data looks stale</li>
        </ul>
      </Panel>

      <Panel className="mt-4" title="Verify on BSCScan">
        <a
          href={`${EXPLORER_URL}/address/${CONTRACTS.senso}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-brand-300 hover:underline"
        >
          View LAE matrix contract →
        </a>
      </Panel>
    </div>
  );
}
