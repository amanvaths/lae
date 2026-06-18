/** Minimal event ABIs for BSC indexer */
export const SENSO_LIMITLESS_EVENTS = [
    "event UserRegistered(address indexed user, address indexed sponsor, uint256 timestamp)",
    "event ClubPurchased(address indexed user, uint8 indexed level, uint256 indexed matrixId, uint256 amount, bool isRebirth)",
    "event PilotPurchased(address indexed user, uint8 indexed level, uint256 indexed matrixId, uint256 amount, bool isManual)",
    "event ClubPlacement(address indexed user, uint256 indexed matrixId, uint8 slotIndex, address indexed sponsor, uint8 level, bool isSpillover)",
    "event PilotPlacement(address indexed user, uint256 indexed matrixId, uint8 slotIndex, address indexed sponsor, uint8 level, bool isSpillover)",
    "event ClubCycleCompleted(uint256 indexed matrixId, address indexed owner, uint8 level, uint256 withdrawAmount, uint256 reinvestAmount, uint32 cyclesCompleted)",
    "event PilotCycleCompleted(uint256 indexed matrixId, address indexed owner, uint8 level, uint256 poolAmount, uint32 cyclesCompleted)",
    "event ClubRebirthCreated(uint256 indexed matrixId, address indexed owner, uint8 level, uint256 parentMatrixId, uint32 cycleNumber)",
    "event PilotRebirthCreated(uint256 indexed matrixId, address indexed owner, uint8 level, uint256 parentMatrixId, uint32 cycleNumber)",
    "event AutoUpgrade(address indexed user, uint8 matrixType, uint8 fromLevel, uint8 toLevel, bytes32 idempotencyKey)",
    "event IncomePaid(address indexed recipient, address indexed payer, uint8 incomeType, uint8 matrixType, uint8 level, uint256 amount)",
    "event TokenReward(address indexed recipient, address indexed source, uint8 rewardType, uint8 matrixType, uint8 level, uint256 sltAmount)",
    "event Withdraw(address indexed user, uint256 amount, bytes32 withdrawRef)",
];
export const SPIN_EVENTS = [
    "event SpinExecuted(address indexed user, uint8 tier, uint256 sltAmount, uint256 nonce)",
];
export const STAKING_EVENTS = [
    "event Staked(address indexed user, uint256 amount, uint64 lockEnd, uint256 stakeIndex)",
    "event Released(address indexed user, uint256 amount, uint256 stakeIndex)",
];
export const ALL_INDEXER_EVENTS = [
    ...SENSO_LIMITLESS_EVENTS,
    ...SPIN_EVENTS,
    ...STAKING_EVENTS,
];
//# sourceMappingURL=abis.js.map