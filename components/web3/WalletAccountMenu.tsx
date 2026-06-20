"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, Wallet, X } from "lucide-react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { cn } from "@/lib/utils";
import { truncateAddress } from "@/lib/format";
import { useWalletSession } from "@/providers/WalletSessionProvider";
import { useClientMounted } from "@/lib/useClientMounted";

export function WalletAccountMenu({
  address,
  onClose,
}: {
  address: `0x${string}`;
  onClose: () => void;
}) {
  const mounted = useClientMounted();
  const chainId = useChainId();
  const { connector } = useAccount();
  const { disconnectWallet } = useWalletSession();
  const [disconnecting, setDisconnecting] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const balance = useBalance({ address });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleDisconnect() {
    if (disconnecting) return;
    setDisconnecting(true);
    onClose();
    disconnectWallet();
  }

  if (!mounted) return null;

  const chainLabel = chainId === bscTestnet.id ? "BSC Testnet" : `Chain ${chainId}`;
  const bnb = balance.data?.formatted ?? "—";

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close wallet menu"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Wallet account"
        className={cn(
          "relative z-[10001] w-full max-w-md border border-white/10 bg-ink-900 shadow-2xl",
          "rounded-t-2xl sm:rounded-2xl",
          "pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500/15 text-brand-300">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-sm font-semibold text-white">
                {truncateAddress(address, 6, 4)}
              </p>
              <p className="text-xs text-slate-500">{chainLabel}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-slate-400"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Balance</p>
            <p className="mt-1 text-lg font-semibold text-white">{bnb} tBNB</p>
          </div>
          {connector?.name && (
            <p className="text-xs text-slate-500">Connected via {connector.name}</p>
          )}
          <button
            type="button"
            disabled={disconnecting}
            onClick={() => void handleDisconnect()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {disconnecting ? "Disconnecting…" : "Disconnect wallet"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
