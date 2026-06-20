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
    "event TokenReward(address indexed recipient, address indexed source, uint8 rewardType, uint8 matrixType, uint8 level, uint256 laeAmount)",
    "event Withdraw(address indexed user, uint256 amount, bytes32 withdrawRef)",
];
export const SPIN_EVENTS = [
    "event SpinExecuted(address indexed user, uint8 tier, uint256 laeAmount, uint256 nonce)",
];
export const STAKING_EVENTS = [
    "event Staked(address indexed user, uint256 amount, uint64 lockEnd, uint256 stakeIndex)",
    "event Released(address indexed user, uint256 amount, uint256 stakeIndex)",
];
/** BTitanXMatrix / LAE Club Matrix events */
export const LAE_MATRIX_EVENTS = [
    "event Registration(uint256 indexed userId, uint256 indexed referrerId, address indexed userAddress)",
    "event TokenReceived(uint256 indexed receiverId, uint256 indexed fromId, address indexed from, uint8 level, uint256 amount)",
    "event ClubPoolPayment(uint256 indexed refId, uint256 indexed userId, uint256 amount, uint8 level)",
    "event NewUserPlace(uint256 indexed user, uint256 indexed referrer, uint8 level, uint256 cycle, uint8 spot)",
    "event Spillover(uint256 indexed referrerId, uint256 indexed receiverId, uint8 level, uint256 cycle, uint8 virtualSpot)",
    "event Reinvest(uint256 indexed userId, uint256 indexed newReferrerId, uint256 indexed callerId, uint8 level)",
    "event Upgrade(uint256 indexed userId, uint256 indexed newReferrerId, uint8 level)",
    "event MissedIncome(uint256 indexed receiverId, uint256 indexed userId, uint8 level)",
    "event LaeRewardAllocated(address indexed user, uint256 indexed scheduleIndex, uint256 laeAmount, uint256 liquidityContribution, uint8 level)",
    "event LaeRewardClaimed(address indexed user, uint256 amount)",
    "event PoolAddressesUpdated(address indexed newClubPool, address indexed newTreasuryPool)",
];
export const ALL_INDEXER_EVENTS = [
    ...LAE_MATRIX_EVENTS,
    ...SENSO_LIMITLESS_EVENTS,
    ...SPIN_EVENTS,
    ...STAKING_EVENTS,
];
//# sourceMappingURL=abis.js.map