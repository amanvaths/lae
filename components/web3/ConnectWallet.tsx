"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Custom-styled RainbowKit connect button that matches the LAE design system.
 * Shows a glossy "Connect" pill when disconnected, and chain + account pills
 * when connected.
 */
export function ConnectWallet({
  full = false,
  variant = "ghost",
}: {
  full?: boolean;
  variant?: "ghost" | "primary";
}) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            className={cn("flex items-center gap-2", full && "w-full")}
            {...(!ready && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className={cn(
                  variant === "primary" ? "btn-primary" : "btn-ghost",
                  full && "w-full justify-center"
                )}
              >
                <Wallet className="h-4 w-4" />
                {variant === "primary" ? "Connect Wallet" : "Connect"}
              </button>
            ) : (
              <>
                <button
                  onClick={openChainModal}
                  className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-white/20 sm:inline-flex"
                >
                  {chain.hasIcon && chain.iconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={chain.iconUrl}
                      alt={chain.name ?? "chain"}
                      className="h-4 w-4 rounded-full"
                    />
                  )}
                  {chain.name}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
                <button
                  onClick={openAccountModal}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-brand-400 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5",
                    full && "w-full justify-center"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  {account.displayName}
                  {account.displayBalance ? ` · ${account.displayBalance}` : ""}
                </button>
              </>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
