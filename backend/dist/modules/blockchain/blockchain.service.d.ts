import { ethers } from "ethers";
export declare function getProvider(): ethers.JsonRpcProvider;
export declare function verifyDepositTx(txHash: string, expectedUser: string, expectedAmount: bigint): Promise<boolean>;
export declare function processBlockchainDeposit(userId: string, txHash: string, amount: number, packageLevel: number, matrixType: "CLUB" | "PILOT"): Promise<void>;
export declare function startDepositListener(contractAddress: string): void;
export declare function initiateWithdrawTransfer(toAddress: string, amount: number): Promise<string | null>;
//# sourceMappingURL=blockchain.service.d.ts.map