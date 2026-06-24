import { ethers } from "ethers";
export declare function rpcUrls(): string[];
export declare function providerForUrl(url: string): ethers.JsonRpcProvider;
/** Primary RPC for reads + receipt scans. */
export declare function getIndexerProvider(): ethers.JsonRpcProvider;
export declare function clearRpcProviders(): void;
//# sourceMappingURL=rpc-providers.d.ts.map