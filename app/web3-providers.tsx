"use client";

import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  darkTheme,
  type Theme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/wagmi";
import { bscTestnet } from "wagmi/chains";
import { ToastProvider } from "@/providers/ToastProvider";
import { ContractEventsProvider } from "@/providers/ContractEventsProvider";
import { WalletSessionProvider } from "@/providers/WalletSessionProvider";

const laeTheme: Theme = darkTheme({
  accentColor: "#ffc31a",
  accentColorForeground: "#0a0a0a",
  borderRadius: "large",
  fontStack: "system",
  overlayBlur: "small",
});

export function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <ToastProvider>
        <WalletSessionProvider>
          <ContractEventsProvider>
            <RainbowKitProvider
              theme={laeTheme}
              modalSize="compact"
              initialChain={bscTestnet}
              appInfo={{
                appName: "LAE",
                learnMoreUrl: "https://laeclub.org",
              }}
            >
              {children}
            </RainbowKitProvider>
          </ContractEventsProvider>
        </WalletSessionProvider>
      </ToastProvider>
    </WagmiProvider>
  );
}
