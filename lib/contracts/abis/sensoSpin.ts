export const sensoSpinAbi = [
  {
    type: "function",
    name: "spin",
    inputs: [],
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "tier", type: "uint8" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "spinCoupons",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "SpinExecuted",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "tier", type: "uint8", indexed: false },
      { name: "sltAmount", type: "uint256", indexed: false },
      { name: "nonce", type: "uint256", indexed: false },
    ],
  },
] as const;
