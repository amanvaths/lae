"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWeb3Loaded } from "@/app/providers";
import { withBasePath } from "@/lib/paths";

export function ConnectWallet({
  full = false,
  variant = "ghost",
}: {
  full?: boolean;
  variant?: "ghost" | "primary";
}) {
  const web3Ready = useWeb3Loaded();

  if (!web3Ready) {
    return (
      <a
        href={withBasePath("/login")}
        className={cn(
          variant === "primary" ? "btn-primary" : "btn-ghost",
          full && "w-full justify-center",
          "inline-flex items-center gap-2"
        )}
      >
        <Wallet className="h-4 w-4" />
        {variant === "primary" ? "Connect Wallet" : "Connect"}
      </a>
    );
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
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
                <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 sm:inline-flex">
                  {chain.hasIcon && chain.iconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={chain.iconUrl}
                      alt={chain.name ?? "BNB Chain"}
                      className="h-4 w-4 rounded-full"
                    />
                  )}
                  BNB Chain
                </span>
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
