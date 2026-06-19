/** BSC Testnet deployed contracts — matches frontend lib/contracts/config.ts */
export const CHAIN = {
    chainId: Number(process.env.CHAIN_ID ?? process.env.POLYGON_CHAIN_ID ?? "97"),
    rpcUrl: process.env.BSC_RPC_URL ??
        process.env.POLYGON_RPC_URL ??
        "https://data-seed-prebsc-1-s1.binance.org:8545",
    startBlock: BigInt(process.env.INDEXER_START_BLOCK ?? "0"),
    reorgDepth: Number(process.env.INDEXER_REORG_DEPTH ?? "12"),
    batchSize: Number(process.env.INDEXER_BATCH_SIZE ?? "2000"),
    pollMs: Number(process.env.INDEXER_POLL_MS ?? "8000"),
};
export const CONTRACTS = {
    senso: process.env.SENSO_CONTRACT_ADDRESS ??
        "0x6521619C38fe4be6B800263CC783d9524ED4F7BA",
    slt: process.env.SLT_CONTRACT_ADDRESS ??
        "0xc842c083E703ecf82496813cc3BFe6d36c0A49b0",
    spin: process.env.SPIN_CONTRACT_ADDRESS ??
        "0xF9bdE4a2Ca487b18DA8546124b63Ec9e938ea1aE",
    staking: process.env.STAKING_CONTRACT_ADDRESS ??
        "0xdb25Af21346aD358D5e52835934AF5f326169984",
};
//# sourceMappingURL=chains.js.map