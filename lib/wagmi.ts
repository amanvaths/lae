import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { bscTestnet } from "wagmi/chains";
import { CHAIN_ID } from "@/lib/contracts/config";

const targetChain = CHAIN_ID === 97 ? bscTestnet : bscTestnet;

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim() ?? "";

/** Injected wallets work without WalletConnect; set NEXT_PUBLIC_WC_PROJECT_ID for WC. */
export const wagmiConfig = projectId
  ? getDefaultConfig({
      appName: "LAE",
      appDescription: "LAE decentralized Club + Pilot matrix on BNB Chain Testnet",
      appUrl: "https://laeclub.com",
      projectId,
      chains: [targetChain],
      ssr: false,
    })
  : createConfig({
      chains: [targetChain],
      connectors: [injected()],
      transports: {
        [targetChain.id]: http(),
      },
      ssr: false,
    });
