"use client";

import { useCallback, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useConnect } from "wagmi";
import { ExternalLink, Loader2, Smartphone, Wallet } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { useClientMounted } from "@/lib/useClientMounted";
import { useIsMobile } from "@/lib/useDeferredReady";
import { useWalletConnectTimeout } from "@/lib/lae-club/auth-check";
import { CHAIN_ID } from "@/lib/contracts/config";
import { hasWalletConnectProject } from "@/lib/wagmi";
import {
  isInWalletBrowser,
  isMobileUserAgent,
  metamaskDappUrl,
  trustWalletDappUrl,
} from "@/lib/mobile-wallet";
import { cn } from "@/lib/utils";

export function LoginConnectPanel() {
  const mounted = useClientMounted();
  const isMobile = useIsMobile();
  const { status } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { connect, connectors, isPending, error } = useConnect();
  const [hint, setHint] = useState<string | null>(null);
  const walletWait = useWalletConnectTimeout(status);

  const connectMetaMask = useCallback(async () => {
    setHint(null);
    const mm = connectors.find(
      (c) => c.id === "metaMaskSDK" || c.id === "io.metamask" || c.name === "MetaMask"
    );
    if (!mm) {
      openConnectModal?.();
      return;
    }
    try {
      await connect({ connector: mm, chainId: CHAIN_ID });
    } catch {
      setHint("MetaMask not found. Tap “Open in MetaMask App” below.");
    }
  }, [connect, connectors, openConnectModal]);

  if (!mounted) {
    return (
      <div className="flex min-h-[52px] items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
        <span className="text-sm">Loading wallets…</span>
      </div>
    );
  }

  const showMobilePanel =
    (isMobile || isMobileUserAgent()) && !isInWalletBrowser();

  if (!showMobilePanel) {
    return <ConnectWallet full variant="primary" />;
  }

  return (
    <div className="flex w-full flex-col gap-2.5 sm:gap-3">
      <p className="text-center text-xs leading-relaxed text-slate-400">
        On phone, connect via MetaMask / Trust Wallet app or WalletConnect.
      </p>

      <button
        type="button"
        onClick={connectMetaMask}
        disabled={isPending}
        className={cn("btn-primary w-full justify-center !py-3.5", isPending && "opacity-70")}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        Connect MetaMask
      </button>

      <a
        href={metamaskDappUrl()}
        className="btn-ghost w-full justify-center !py-3.5 text-xs sm:text-sm"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        Open in MetaMask App
      </a>

      <a
        href={trustWalletDappUrl()}
        className="btn-ghost w-full justify-center !py-3.5 text-xs sm:text-sm"
      >
        <Smartphone className="h-4 w-4 shrink-0" />
        Open in Trust Wallet
      </a>

      <button
        type="button"
        onClick={() => openConnectModal?.()}
        className="w-full rounded-sm border border-white/10 py-3 text-xs font-medium text-brand-300 transition-colors hover:border-brand-500/40 hover:text-brand-200"
      >
        {hasWalletConnectProject
          ? "More wallets · WalletConnect"
          : "More wallet options"}
      </button>

      {(hint || error || walletWait.timedOut) && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-center text-xs leading-relaxed text-red-300">
          {hint ??
            error?.message ??
            "Wallet connection is taking too long. Try MetaMask in-app browser or WalletConnect."}
        </p>
      )}

      {!hasWalletConnectProject && (
        <p className="text-center text-[0.65rem] leading-relaxed text-slate-600">
          Tip: “Open in MetaMask App” opens LAE inside MetaMask — then tap Connect again.
        </p>
      )}
    </div>
  );
}
