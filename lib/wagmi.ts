import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  trustWallet,
  coinbaseWallet,
  rainbowWallet,
  walletConnectWallet,
  binanceWallet,
  okxWallet,
  rabbyWallet,
  braveWallet,
  ledgerWallet,
  safepalWallet,
  tokenPocketWallet,
  imTokenWallet,
  bitgetWallet,
  bybitWallet,
  gateWallet,
  zerionWallet,
  phantomWallet,
  uniswapWallet,
  coreWallet,
  enkryptWallet,
  injectedWallet,
  safeWallet,
  coin98Wallet,
  oneKeyWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { CHAIN_ID } from "@/lib/contracts/config";

const targetChain = CHAIN_ID === 97 ? bscTestnet : bscTestnet;
const rpcUrl =
  process.env.NEXT_PUBLIC_BSC_RPC_URL ??
  "https://data-seed-prebsc-1-s1.binance.org:8545";

const rpcTransport = http(rpcUrl, { timeout: 15_000, retryCount: 2 });

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim() ?? "";

const dappMetadata = {
  name: "LAE",
  url: "https://laeclub.com",
};

function buildWalletList() {
  const popular = [
    metaMaskWallet,
    trustWallet,
    coinbaseWallet,
    rainbowWallet,
    binanceWallet,
    okxWallet,
    rabbyWallet,
    braveWallet,
    phantomWallet,
  ];

  const more = [
    ledgerWallet,
    safepalWallet,
    tokenPocketWallet,
    imTokenWallet,
    bitgetWallet,
    bybitWallet,
    gateWallet,
    zerionWallet,
    uniswapWallet,
    coreWallet,
    enkryptWallet,
    coin98Wallet,
    oneKeyWallet,
    safeWallet,
    injectedWallet,
  ];

  if (projectId) {
    popular.splice(4, 0, walletConnectWallet);
  }

  return [
    { groupName: "Popular", wallets: popular },
    { groupName: "More wallets", wallets: more },
  ];
}

/**
 * RainbowKit wallet connectors (with rkDetails) — required for the connect modal list.
 * Raw wagmi `metaMask()` / `injected()` alone produce an empty modal.
 */
export const wagmiConfig = getDefaultConfig({
  appName: dappMetadata.name,
  appDescription: "LAE Club + Pilot matrix on BSC Testnet",
  appUrl: dappMetadata.url,
  projectId: projectId || "00000000000000000000000000000001",
  chains: [targetChain],
  wallets: buildWalletList(),
  transports: {
    [targetChain.id]: rpcTransport,
  },
  ssr: false,
});

export const hasWalletConnectProject = Boolean(projectId);
