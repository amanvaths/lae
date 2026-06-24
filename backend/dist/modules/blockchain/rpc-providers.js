import { ethers } from "ethers";
import { CHAIN } from "../../config/chains.js";
const providerCache = new Map();
let readProvider = null;
export function rpcUrls() {
    const urls = [];
    const push = (u) => {
        const v = u?.trim();
        if (v && !urls.includes(v))
            urls.push(v);
    };
    push(process.env.BSC_ARCHIVE_RPC_URL);
    push(process.env.BSC_RPC_URL);
    push(CHAIN.rpcUrl);
    push("https://bsc-testnet.bnbchain.org");
    return urls;
}
export function providerForUrl(url) {
    let p = providerCache.get(url);
    if (!p) {
        p = new ethers.JsonRpcProvider(url, CHAIN.chainId);
        providerCache.set(url, p);
    }
    return p;
}
/** Primary RPC for reads + receipt scans. */
export function getIndexerProvider() {
    if (!readProvider) {
        readProvider = providerForUrl(process.env.BSC_RPC_URL ?? CHAIN.rpcUrl);
    }
    return readProvider;
}
export function clearRpcProviders() {
    for (const p of providerCache.values())
        p.removeAllListeners();
    providerCache.clear();
    readProvider?.removeAllListeners();
    readProvider = null;
}
//# sourceMappingURL=rpc-providers.js.map