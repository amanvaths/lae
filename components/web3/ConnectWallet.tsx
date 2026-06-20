"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { useWeb3Loaded } from "@/app/providers";
import { withBasePath } from "@/lib/paths";
import { useClientMounted } from "@/lib/useClientMounted";
import { truncateAddress } from "@/lib/format";

export function ConnectWallet({
  full = false,
  variant = "ghost",
  preferLoginPage = false,
}: {
  full?: boolean;
  variant?: "ghost" | "primary";
  /** Marketing nav: send users to /login for connect + auto dashboard routing */
  preferLoginPage?: boolean;
}) {
  const web3Ready = useWeb3Loaded();
  const mounted = useClientMounted();
  const { isConnected } = useAccount();

  const connectLink = (
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

  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "primary" ? "btn-primary" : "btn-ghost",
          full && "w-full justify-center",
          "inline-flex items-center gap-2 opacity-50"
        )}
      >
        <Wallet className="h-4 w-4" />
        {variant === "primary" ? "Connect Wallet" : "Connect"}
      </div>
    );
  }

  if (!web3Ready || (preferLoginPage && !isConnected)) {
    return connectLink;
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openConnectModal,
        authenticationStatus,
        mounted: rkMounted,
      }) => {
        const ready = rkMounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div className={cn("flex items-center", full && "w-full")}>
            {!ready ? (
              <button
                type="button"
                disabled
                className={cn(
                  variant === "primary" ? "btn-primary" : "btn-ghost",
                  full && "w-full justify-center",
                  "opacity-60"
                )}
              >
                <Wallet className="h-4 w-4" />
                {variant === "primary" ? "Connect Wallet" : "Connect"}
              </button>
            ) : !connected ? (
              <button
                type="button"
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
              <button
                type="button"
                onClick={openAccountModal}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-white/20",
                  full && "w-full justify-center"
                )}
              >
                <Wallet className="h-4 w-4 text-brand-300" />
                <span className="font-mono">
                  {truncateAddress(account.address, 6, 4)}
                </span>
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
