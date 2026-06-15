import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bsc } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "LAE Protocol",
  appDescription: "The decentralized network token on BNB Chain",
  appUrl: "https://laeclub.com",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "lae_demo_project_id",
  chains: [bsc],
  ssr: false,
});
