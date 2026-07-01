/** LAEClubMatrix — exact BTitan-style ABI for indexer/API */
export const LAE_MATRIX_EVENTS = [
  "event Registration(uint256 indexed userId, uint256 indexed referrerId, address indexed userAddress)",
  "event TokenReceived(uint256 indexed receiverId, uint256 indexed fromId, address indexed from, uint8 level, uint256 amount)",
  "event TreasuryPool(uint256 indexed refId, uint256 indexed userId, uint256 amount, uint8 level)",
  "event NewUserPlace(uint256 indexed user, uint256 indexed referrer, uint8 level, uint256 cycle, uint8 spot)",
  "event Spillover(uint256 indexed referrerId, uint256 indexed receiverId, uint8 level, uint256 cycle, uint8 virtualSpot)",
  "event Reinvest(uint256 indexed userId, uint256 indexed newReferrerId, uint256 indexed callerId, uint8 level)",
  "event Upgrade(uint256 indexed userId, uint256 indexed newReferrerId, uint8 level)",
  "event MissedIncome(uint256 indexed receiverId, uint256 indexed userId, uint8 level)",
  "event TokenAddressesUpdated(address indexed newToken)",
  "event PoolAddressesUpdated(address indexed newRoyalPool, address indexed newTreasuryPool)",
] as const;

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
  "function levelTokenCost(uint8 level) view returns (uint256)",
  "function BTCB_TOKEN_ADDRESS() view returns (address)",
  "function isUserExists(address userAddress) view returns (bool)",
  "function LAST_LEVEL() view returns (uint8)",
] as const;

export const MATRIX_CORE_READ_ABI = LAE_MATRIX_READ_ABI;
