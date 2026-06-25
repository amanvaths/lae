/** Resolve wallet for a LAEClubMatrix user id — DB first, then idToAddress. */
export declare function laeWalletForUserId(userId: number): Promise<string | null>;
/** Resolve LAE user id from wallet — DB first, then on-chain addressToId (owner #1 has no Registration event). */
export declare function laeUserIdForWallet(wallet: string): Promise<number | null>;
/** No-op — LAEClubMatrix income rows store toUserId directly. */
export declare function repairLaeIncomeReceiverAddresses(): Promise<number>;
//# sourceMappingURL=lae-user-lookup.d.ts.map