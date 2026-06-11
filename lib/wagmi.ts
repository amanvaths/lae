import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, polygon, bsc } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "LAE Protocol",
  appDescription: "The decentralized network token",
  appUrl: "https://lae.finance",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "lae_demo_project_id",
  chains: [mainnet, bsc, polygon],
  ssr: false,
});
