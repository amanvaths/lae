require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  paths: {
    // Hardhat v2 requires sources inside the project. `prepare-contracts.js`
    // copies the real contracts here; the exact-match test asserts they are
    // byte-identical to the repo source so they cannot silently drift.
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
      mining: { auto: true },
      accounts: { count: 30 },
    },
  },
};
