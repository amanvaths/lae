"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { useWeb3Loaded } from "@/app/providers";
import { withBasePath } from "@/lib/paths";
import { useClientMounted } from "@/lib/useClientMounted";
import { truncateAddress } from "@/lib/format";
import { WalletAccountMenu } from "./WalletAccountMenu";

export function ConnectWallet({
  full = false,
  variant = "ghost",
  preferLoginPage = false,
  luxury = false,
}: {
  full?: boolean;
  variant?: "ghost" | "primary";
  /** Marketing nav: send users to /login for connect + auto dashboard routing */
  preferLoginPage?: boolean;
  luxury?: boolean;
}) {
  const web3Ready = useWeb3Loaded();
  const mounted = useClientMounted();
  const { isConnected, address } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryCls = luxury ? "auth-btn-gold" : "btn-primary";
  const ghostCls = luxury ? "auth-btn-ghost" : "btn-ghost";

  const connectLink = (
    <a
      href={withBasePath("/login")}
      className={cn(
        variant === "primary" ? primaryCls : ghostCls,
        full && "w-full justify-center",
        "inline-flex items-center gap-2 text-xs sm:text-sm"
      )}
    >
      <Wallet className="h-4 w-4 shrink-0" />
      {variant === "primary" ? "Connect Wallet" : "Connect"}
    </a>
  );

  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "primary" ? primaryCls : ghostCls,
          full && "w-full justify-center",
          "inline-flex items-center gap-2 opacity-50 text-xs sm:text-sm"
        )}
      >
        <Wallet className="h-4 w-4 shrink-0" />
        {variant === "primary" ? "Connect Wallet" : "Connect"}
      </div>
    );
  }

  if (!web3Ready || (preferLoginPage && !isConnected)) {
    return connectLink;
  }

  return (
    <>
      <ConnectButton.Custom>
        {({
          account,
          chain,
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
                    variant === "primary" ? primaryCls : ghostCls,
                    full && "w-full justify-center",
                    "opacity-60 text-xs sm:text-sm"
                  )}
                >
                  <Wallet className="h-4 w-4 shrink-0" />
                  {variant === "primary" ? "Connect Wallet" : "Connect"}
                </button>
              ) : !connected ? (
                <button
                  type="button"
                  onClick={openConnectModal}
                  className={cn(
                    variant === "primary" ? primaryCls : ghostCls,
                    full && "w-full justify-center",
                    "text-xs sm:text-sm"
                  )}
                >
                  <Wallet className="h-4 w-4 shrink-0" />
                  {variant === "primary" ? "Connect Wallet" : "Connect"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className={cn(
                    "inline-flex max-w-[11rem] items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs font-medium text-white transition-colors hover:border-white/20 sm:max-w-none sm:gap-2 sm:px-3 sm:text-sm",
                    full && "w-full max-w-none justify-center"
                  )}
                >
                  <Wallet className="h-4 w-4 shrink-0 text-brand-300" />
                  <span className="truncate font-mono">
                    {truncateAddress(account.address, 4, 4)}
                  </span>
                </button>
              )}
            </div>
          );
        }}
      </ConnectButton.Custom>

      {menuOpen && address && (
        <WalletAccountMenu address={address} onClose={() => setMenuOpen(false)} />
      )}
    </>
  );
}
