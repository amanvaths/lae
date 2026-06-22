/** Resolve wallet for a LAE user id — DB first, then on-chain idToAddress. */
export declare function laeWalletForUserId(userId: number): Promise<string | null>;
/** Fill missing receiverAddress on indexed income rows after users are backfilled. */
export declare function repairLaeIncomeReceiverAddresses(): Promise<number>;
//# sourceMappingURL=lae-user-lookup.d.ts.map