/** Resolve wallet for a LAEClubMatrix user id — DB first, then idToAddress. */
export declare function laeWalletForUserId(userId: number): Promise<string | null>;
/** No-op — LAEClubMatrix income rows store toUserId directly. */
export declare function repairLaeIncomeReceiverAddresses(): Promise<number>;
//# sourceMappingURL=lae-user-lookup.d.ts.map