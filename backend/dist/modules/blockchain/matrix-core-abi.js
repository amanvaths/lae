/** LAEClubMatrix — 15-slot × 14-position matrix (events + read functions for indexer/API) */
export const LAE_MATRIX_EVENTS = [
    "event Registration(uint256 indexed userId, uint256 indexed referrerId, address indexed userAddress)",
    "event TokenReceived(uint256 indexed receiverId, uint256 indexed fromId, address indexed from, uint8 level, uint256 amount)",
    "event ClubPoolPayment(uint256 indexed refId, uint256 indexed userId, uint256 amount, uint8 level)",
    "event NewUserPlace(uint256 indexed user, uint256 indexed referrer, uint8 level, uint256 cycle, uint8 spot)",
    "event Spillover(uint256 indexed referrerId, uint256 indexed receiverId, uint8 level, uint256 cycle, uint8 virtualSpot)",
    "event Reinvest(uint256 indexed userId, uint256 indexed newReferrerId, uint256 indexed callerId, uint8 level)",
    "event Upgrade(uint256 indexed userId, uint256 indexed newReferrerId, uint8 level)",
    "event MissedIncome(uint256 indexed receiverId, uint256 indexed userId, uint8 level)",
    "event LapseIncome(uint256 indexed receiverId, uint256 indexed fromId, uint8 level, uint256 amount)",
    "event LaeRewardAllocated(address indexed user, uint256 indexed scheduleIndex, uint256 laeAmount, uint256 liquidityContribution, uint8 level)",
    "event LaeRewardClaimed(address indexed user, uint256 amount)",
    // Admin / config events (indexed into chain_events only; no mc_* projection)
    "event LiquidityPoolUpdated(address indexed liquidityPool)",
    "event LaeCoinUpdated(address indexed laeCoin)",
    "event TokenAddressUpdated(address indexed newToken)",
    "event PoolAddressesUpdated(address indexed newClubPool, address indexed newTreasuryPool)",
    "event LevelTokenCostUpdated(uint8 indexed level, uint256 tokenCost)",
    "event SplitBpsUpdated(uint256 matrixDistributionBps, uint256 liquidityAllocationBps)",
    "event LaePriceUpdated(uint256 laePriceInPaymentToken)",
    "event MonthlyReleaseBpsUpdated(uint8 indexed month, uint256 bps)",
    "event DirectRequirementUpdated(uint8 indexed month, uint256 requiredDirects)",
];
/** @deprecated alias — indexer imports MATRIX_CORE_EVENTS */
export const MATRIX_CORE_EVENTS = LAE_MATRIX_EVENTS;
export const LAE_MATRIX_READ_ABI = [
    "function lastUserId() view returns (uint256)",
    "function addressToId(address) view returns (uint256)",
    "function idToAddress(uint256) view returns (address)",
    "function getUserDetails(uint256 userId) view returns (address userAddress, address referrerAddress, uint256 referrerId, uint256 partnersCount, uint8 activeSlotsCount, uint256 teamSize, uint256 registrationTimestamp, uint256 totalIncome)",
    "function getDirectPartnerIds(uint256 userId) view returns (uint256[])",
    "function isUserSlotActive(uint256 userId, uint8 slot) view returns (bool)",
    "function usersXMatrix(address userAddress, uint8 level) view returns (address currentReferrer, uint256 reinvestCount, uint256 heldTokenForUpgrade, uint256 lastSpillUnderReceiverIndex, uint256 totalTeamSize, uint256 totalEarning)",
    "function usersXMatrixReferrals(address userAddress, uint8 level) view returns (address[])",
    "function genealogyOf(uint256 userId, uint8 level) view returns (uint256 parentId, uint256 leftChildId, uint256 rightChildId)",
    "function levelTokenCost(uint8 level) view returns (uint256)",
    "function PAYMENT_TOKEN() view returns (address)",
    "function TREASURY_POOL_ADDRESS() view returns (address)",
    "function CLUB_POOL_ADDRESS() view returns (address)",
    "function isUserExists(address userAddress) view returns (bool)",
];
/** @deprecated alias */
export const MATRIX_CORE_READ_ABI = LAE_MATRIX_READ_ABI;
//# sourceMappingURL=matrix-core-abi.js.map