import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { bscTestnet } from "wagmi/chains";
import { CHAIN_ID } from "@/lib/contracts/config";

const targetChain = CHAIN_ID === 97 ? bscTestnet : bscTestnet;
const rpcUrl =
  process.env.NEXT_PUBLIC_BSC_RPC_URL ??
  "https://data-seed-prebsc-1-s1.binance.org:8545";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim() ?? "";

const dappMetadata = {
  name: "LAE",
  url: "https://laeclub.com",
};

/** Full wallet list when WalletConnect Cloud project id is configured in CI secrets. */
export const wagmiConfig = projectId
  ? getDefaultConfig({
      appName: dappMetadata.name,
      appDescription: "LAE Club + Pilot matrix on BSC Testnet",
      appUrl: dappMetadata.url,
      projectId,
      chains: [targetChain],
      ssr: false,
    })
  : createConfig({
      chains: [targetChain],
      connectors: [
        metaMask({ dappMetadata }),
        injected({ shimDisconnect: true }),
      ],
      transports: {
        [targetChain.id]: http(rpcUrl),
      },
      ssr: false,
    });

export const hasWalletConnectProject = Boolean(projectId);
