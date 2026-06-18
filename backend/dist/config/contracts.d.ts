import { CHAIN, CONTRACTS } from "./chains.js";
export { CHAIN, CONTRACTS };
/** @deprecated use CHAIN + CONTRACTS — kept for legacy imports */
export declare const legacyConfig: {
    readonly nodeEnv: string;
    readonly port: number;
    readonly host: string;
    readonly databaseUrl: string;
    readonly redisUrl: string;
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
    };
    readonly polygon: {
        readonly rpcUrl: string;
        readonly chainId: number;
        readonly sensoContract: string;
        readonly daiContract: string;
        readonly sltContract: string;
        readonly spinContract: string;
        readonly stakingContract: string;
    };
    readonly adminWallets: string[];
    readonly indexerAdminApiKey: string;
    readonly minWithdrawDai: number;
    readonly transactionFeePol: number;
    readonly corsOrigin: string;
};
//# sourceMappingURL=contracts.d.ts.map