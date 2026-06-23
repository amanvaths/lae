/** BTitanXMatrix — BSC Testnet ABI (auto-generated from contracts/BTitanXMatrix.sol) */

export const laeClubMatrixAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "ownerAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "btcTokenAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "treasuryPoolAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "platformAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "registrationPassNftAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "royalRank1NftAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "royalRank2NftAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "royalRank3NftAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "royalRank4NftAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "receiverId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      }
    ],
    "name": "MissedIncome",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "user",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "referrer",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "cycle",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "spot",
        "type": "uint8"
      }
    ],
    "name": "NewUserPlace",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "newRoyalPool",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newTreasuryPool",
        "type": "address"
      }
    ],
    "name": "PoolAddressesUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "referrerId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      }
    ],
    "name": "Registration",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "newAddress",
        "type": "address"
      }
    ],
    "name": "RegistrationPassNftAddressUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "newReferrerId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "callerId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      }
    ],
    "name": "Reinvest",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "newRank1",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "newRank2",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "newRank3",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "newRank4",
        "type": "address"
      }
    ],
    "name": "RoyalNftAddressesUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "referrerId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "receiverId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "cycle",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "virtualSpot",
        "type": "uint8"
      }
    ],
    "name": "Spillover",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "newToken",
        "type": "address"
      }
    ],
    "name": "TokenAddressesUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "receiverId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "fromId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TokenReceived",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "TokenTransferFailed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "refId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      }
    ],
    "name": "TreasuryPool",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "newReferrerId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      }
    ],
    "name": "Upgrade",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BTCB_TOKEN_ADDRESS",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "new1",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "new2",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "new3",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "new4",
        "type": "address"
      }
    ],
    "name": "ChangeRoyalNftaddresses",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "new1",
        "type": "address"
      }
    ],
    "name": "ChangeTitanPassNftaddress",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LAST_LEVEL",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MATRIX_SIZE",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "REGISTRATION_PASS_NFT_CONTRACT",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ROYAL_RANK1_NFT_CONTRACT",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ROYAL_RANK2_NFT_CONTRACT",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ROYAL_RANK3_NFT_CONTRACT",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ROYAL_RANK4_NFT_CONTRACT",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      }
    ],
    "name": "_findFreeReferrer",
    "outputs": [
      {
        "internalType": "address",
        "name": "referrer",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "addressToId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      }
    ],
    "name": "getActiveLevelsCount",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "count",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      }
    ],
    "name": "getDirectPartnerAddresses",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      }
    ],
    "name": "getDirectPartnerIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      }
    ],
    "name": "getUserDetails",
    "outputs": [
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "referrerAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "referrerId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "partnersCount",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "activeSlotsCount",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "teamSize",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "registrationTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalIncome",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "idToAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "partner2",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "partner3",
        "type": "address"
      }
    ],
    "name": "initializePartners",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "isUserExists",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "slot",
        "type": "uint8"
      }
    ],
    "name": "isUserSlotActive",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastUserId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "levelTokenCost",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "partnersInitialized",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "referrerId",
        "type": "uint256"
      }
    ],
    "name": "registrationExt",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "referrerId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      }
    ],
    "name": "registrationSys",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalProjectInvestment",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newRoyalPool",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "newTreasuryPool",
        "type": "address"
      }
    ],
    "name": "updatePoolAddresses",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newToken",
        "type": "address"
      }
    ],
    "name": "updateTokenAddress",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      }
    ],
    "name": "usersXMatrix",
    "outputs": [
      {
        "internalType": "address",
        "name": "currentReferrer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "reinvestCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "heldTokenForUpgrade",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastSpillUnderReceiverIndex",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalTeamSize",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalEarning",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      }
    ],
    "name": "usersXMatrixReferrals",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "referrals",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
export const laeCoinAbi = [
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalBurned", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "maxSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "circulatingSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ name: "", type: "address" }, { name: "", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "p2pEnabled", inputs: [], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "p2pPaymentToken", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "nextOrderId", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "function",
    name: "p2pOrders",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "seller", type: "address" },
      { name: "laeAmount", type: "uint256" },
      { name: "pricePerLae", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createP2POrder",
    inputs: [{ name: "laeAmount", type: "uint256" }, { name: "pricePerLae", type: "uint256" }],
    outputs: [{ name: "orderId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  { type: "function", name: "fillP2POrder", inputs: [{ name: "orderId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "cancelP2POrder", inputs: [{ name: "orderId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "treasuryWallet", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "liquidityWallet", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "matrixContract", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "rewardPoolRemaining", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "transfer", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "burn", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const;

export const laeStakingAbi = [
  { type: "function", name: "totalStaked", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "rewardRateBps", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "pendingReward", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "function",
    name: "stakes",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "stakedAt", type: "uint256" },
      { name: "lastClaim", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
  },
  { type: "function", name: "stake", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "claim", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unstake", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const;

export const erc20BalanceAbi = [
  { type: "function", name: "balanceOf", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
] as const;
