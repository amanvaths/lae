import { ethers } from "ethers";
export declare function getProvider(): ethers.JsonRpcProvider;
export declare function verifyDepositTx(txHash: string, expectedUser: string, expectedAmount: bigint): Promise<boolean>;
/** @deprecated Legacy Senso purchase flow disabled — matrix runs on-chain only. */
export declare function processBlockchainDeposit(): Promise<never>;
/** @deprecated Legacy deposit listener disabled. */
export declare function startDepositListener(): void;
/** @deprecated Legacy withdraw transfer disabled. */
export declare function initiateWithdrawTransfer(): Promise<null>;
//# sourceMappingURL=blockchain.service.d.ts.map