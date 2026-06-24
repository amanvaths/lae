import { ethers } from "ethers";
import { CHAIN } from "../../config/chains.js";

const providerCache = new Map<string, ethers.JsonRpcProvider>();
let readProvider: ethers.JsonRpcProvider | null = null;

export function rpcUrls(): string[] {
  const urls: string[] = [];
  const push = (u?: string) => {
    const v = u?.trim();
    if (v && !urls.includes(v)) urls.push(v);
  };
  push(process.env.BSC_ARCHIVE_RPC_URL);
  push(process.env.BSC_RPC_URL);
  push(CHAIN.rpcUrl);
  push("https://bsc-testnet.bnbchain.org");
  return urls;
}

export function providerForUrl(url: string): ethers.JsonRpcProvider {
  let p = providerCache.get(url);
  if (!p) {
    p = new ethers.JsonRpcProvider(url, CHAIN.chainId);
    providerCache.set(url, p);
  }
  return p;
}

/** Primary RPC for reads + receipt scans. */
export function getIndexerProvider(): ethers.JsonRpcProvider {
  if (!readProvider) {
    readProvider = providerForUrl(process.env.BSC_RPC_URL ?? CHAIN.rpcUrl);
  }
  return readProvider;
}

export function clearRpcProviders(): void {
  for (const p of providerCache.values()) p.removeAllListeners();
  providerCache.clear();
  readProvider?.removeAllListeners();
  readProvider = null;
}
