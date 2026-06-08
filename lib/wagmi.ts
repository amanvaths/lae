import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, polygon, arbitrum, bsc, optimism, base } from "wagmi/chains";

/**
 * Wagmi + RainbowKit configuration.
 *
 * Set a real WalletConnect Cloud project id in `.env.local`:
 *   NEXT_PUBLIC_WC_PROJECT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
 * (https://cloud.walletconnect.com). Injected wallets (MetaMask, Rabby) work
 * without it; the WalletConnect modal needs a valid id.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "LAE Protocol",
  appDescription: "The decentralized network token",
  appUrl: "https://lae.finance",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "lae_demo_project_id",
  chains: [mainnet, polygon, arbitrum, bsc, optimism, base],
  ssr: false,
});
