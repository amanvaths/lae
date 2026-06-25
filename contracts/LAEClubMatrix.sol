// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Standard ERC-20 / BEP-20 interface for the BTC payment token.
interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

// LAE reward token (the only token minted by this project).
interface ILAECoin {
    function recordRewardAllocation(uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function rewardPoolRemaining() external view returns (uint256);
}

/**
 * @title LAEClubMatrix
 * @notice 15-slot Smart Matrix. Each slot is a 14-position recycling matrix.
 *         Registration / upgrades are paid in BTC (BEP-20). 90% of every payment
 *         is distributed across the matrix, 10% funds the liquidity pool and mints
 *         a vested LAE reward allocation released over 20 months (5%/month, gated by
 *         new direct referrals). No NFTs are used anywhere in this plan.
 */
contract LAEClubMatrix {
    // --- Constants ---
    uint8 public constant LAST_LEVEL = 15;       // 15 slots
    uint8 public constant MATRIX_SIZE = 14;      // 14 positions per slot
    uint256 public constant BPS = 10_000;
    uint8 public constant VESTING_MONTHS = 20;   // 20-month release protocol
    uint256 public constant MONTH_DURATION = 30 days;

    // --- Structs ---
    struct XMatrix {
        address currentReferrer;            // Upline that physically placed this matrix
        address[] referrals;                // 14 spots (index 0..13)
        uint256 reinvestCount;              // Cycle count (0 = first cycle)
        uint256 heldTokenForUpgrade;        // BTC held at spot 4 for the auto-upgrade
        uint256 lastSpillUnderReceiverIndex;// Round-robin pointer for downline spill
        uint256 totalTeamSize;              // Total placements in this matrix (all cycles)
        uint256 totalEarning;               // Total BTC earned from this matrix
    }

    struct User {
        uint256 id;
        address referrer;                   // Initial sponsor
        uint256 referrerId;
        address[] directReferrals;
        uint256 teamSize;
        uint256 registrationTimestamp;
        uint256 totalIncome;                // Total BTC earned across all slots
        mapping(uint8 => bool) activeLevels;
        mapping(uint8 => XMatrix) xMatrix;
        // --- Genealogy placement tree (display only; does NOT affect income) ---
        // Every entrant is placed under its own sponsor's leg, top->bottom/left->right
        // (spillover down). This guarantees the matrix view shows each member under
        // the correct parent. Income distribution above is fully independent of this.
        mapping(uint8 => address) gParent;  // genealogy placement parent (per level)
        mapping(uint8 => address) gChild0;  // genealogy left child  (per level)
        mapping(uint8 => address) gChild1;  // genealogy right child (per level)
    }

    struct LaeRewardSchedule {
        uint256 allocated;
        uint256 claimed;
        uint256 startTime;
        uint256 liquidityContribution;
        uint8 level;
    }

    // --- Core state ---
    address public owner;
    address public PAYMENT_TOKEN;            // BTC (BEP-20) used for registration & income
    address public CLUB_POOL_ADDRESS;        // "Club Pool" (spot 4 in recycle cycles)
    address public TREASURY_POOL_ADDRESS;    // Platform treasury (owner-matrix spillover)

    mapping(address => User) private users;
    mapping(uint256 => address) public idToAddress;
    mapping(address => uint256) public addressToId;
    mapping(uint8 => uint256) public levelTokenCost;

    uint256 public lastUserId = 2;           // Owner is ID 1
    bool public partnersInitialized;
    uint256 public totalProjectInvestment;

    // --- LAE reward layer ---
    address public LAE_COIN_ADDRESS;
    address public LIQUIDITY_POOL_ADDRESS;
    uint256 public matrixDistributionBps = 9000; // 90% distributed in matrix
    uint256 public liquidityAllocationBps = 1000; // 10% to liquidity / LAE reward
    uint256 public laePriceInPaymentToken = 1e12; // LAE price denominated in payment token

    uint256 public totalLiquidityCollected;
    uint256 public totalLaeAllocated;
    uint256 public totalLaeClaimed;

    uint256[20] public monthlyReleaseBps;        // 5% (500 bps) per month by default
    uint256[20] public directRequirementByMonth; // directs required to unlock each month

    mapping(address => LaeRewardSchedule[]) private laeSchedules;

    bool private entered;

    // --- Events ---
    event Registration(uint256 indexed userId, uint256 indexed referrerId, address indexed userAddress);
    event TokenReceived(uint256 indexed receiverId, uint256 indexed fromId, address indexed from, uint8 level, uint256 amount);
    event ClubPoolPayment(uint256 indexed refId, uint256 indexed userId, uint256 amount, uint8 level);
    event NewUserPlace(uint256 indexed user, uint256 indexed referrer, uint8 level, uint256 cycle, uint8 spot);
    event Spillover(uint256 indexed referrerId, uint256 indexed receiverId, uint8 level, uint256 cycle, uint8 virtualSpot);
    event Reinvest(uint256 indexed userId, uint256 indexed newReferrerId, uint256 indexed callerId, uint8 level);
    event Upgrade(uint256 indexed userId, uint256 indexed newReferrerId, uint8 level);
    event MissedIncome(uint256 indexed receiverId, uint256 indexed userId, uint8 level);
    event TokenTransferFailed(address indexed recipient, uint256 amount, string reason);
    event PoolAddressesUpdated(address indexed newClubPool, address indexed newTreasuryPool);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TokenAddressUpdated(address indexed newToken);
    event LevelTokenCostUpdated(uint8 indexed level, uint256 tokenCost);

    event LaeCoinUpdated(address indexed laeCoin);
    event LiquidityPoolUpdated(address indexed liquidityPool);
    event SplitBpsUpdated(uint256 matrixDistributionBps, uint256 liquidityAllocationBps);
    event LaePriceUpdated(uint256 laePriceInPaymentToken);
    event MonthlyReleaseBpsUpdated(uint8 indexed month, uint256 bps);
    event DirectRequirementUpdated(uint8 indexed month, uint256 requiredDirects);
    event LaeRewardAllocated(
        address indexed user,
        uint256 indexed scheduleIndex,
        uint256 laeAmount,
        uint256 liquidityContribution,
        uint8 level
    );
    event LaeRewardClaimed(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "LAEClubMatrix: only owner");
        _;
    }

    modifier nonReentrant() {
        require(!entered, "LAEClubMatrix: reentrant");
        entered = true;
        _;
        entered = false;
    }

    constructor(
        address ownerAddress,
        address paymentTokenAddress,
        address clubPoolAddress,
        address platformTreasuryAddress
    ) {
        require(ownerAddress != address(0), "Invalid owner address");
        require(paymentTokenAddress != address(0), "Invalid payment token address");
        require(clubPoolAddress != address(0), "Invalid Club Pool address");
        require(platformTreasuryAddress != address(0), "Invalid Platform Treasury address");

        owner = ownerAddress;
        PAYMENT_TOKEN = paymentTokenAddress;
        CLUB_POOL_ADDRESS = clubPoolAddress;
        TREASURY_POOL_ADDRESS = platformTreasuryAddress;

        // Slot 1 full price = 0.001 BTC; each slot doubles up to slot 15 (16.384 BTC).
        // 90% of each price flows through the matrix (slot 1 matrix share = 0.0009 BTC).
        levelTokenCost[1] = 1e15;
        for (uint8 i = 2; i <= LAST_LEVEL; i++) {
            levelTokenCost[i] = levelTokenCost[i - 1] * 2;
        }

        users[ownerAddress].id = 1;
        users[ownerAddress].referrer = address(0);
        users[ownerAddress].referrerId = 0;
        users[ownerAddress].registrationTimestamp = block.timestamp;
        idToAddress[1] = ownerAddress;
        addressToId[ownerAddress] = 1;
        for (uint8 level = 1; level <= LAST_LEVEL; level++) {
            users[ownerAddress].activeLevels[level] = true;
        }

        // 20-month release: 5%/month; month M (1..20) requires M+1 direct referrals (2..21).
        for (uint8 month = 0; month < VESTING_MONTHS; month++) {
            monthlyReleaseBps[month] = 500;
            directRequirementByMonth[month] = uint256(month) + 2; // month index 1 → 2 directs … 20 → 21
        }
    }

    // --- PUBLIC ENTRY POINTS ---

    function registrationExt(uint256 referrerId) external nonReentrant {
        address referrerAddress = idToAddress[referrerId];
        require(isUserExists(referrerAddress), "LAEClubMatrix: invalid referrer");
        require(!isUserExists(msg.sender), "LAEClubMatrix: user exists");

        uint256 amount = levelTokenCost[1];
        require(IERC20(PAYMENT_TOKEN).transferFrom(msg.sender, address(this), amount), "BTC transfer failed for registration");

        _splitPaymentAndAllocateLae(msg.sender, 1, amount);
        totalProjectInvestment += amount;
        _registration(msg.sender, referrerAddress);
    }

    function registrationSys(uint256 referrerId, address userAddress) external onlyOwner nonReentrant {
        address referrerAddress = idToAddress[referrerId];
        require(isUserExists(referrerAddress), "LAEClubMatrix: invalid referrer");
        require(userAddress != address(0), "LAEClubMatrix: zero user");
        require(!isUserExists(userAddress), "LAEClubMatrix: user exists");

        uint256 amount = levelTokenCost[1];
        require(IERC20(PAYMENT_TOKEN).transferFrom(msg.sender, address(this), amount), "BTC transfer failed for registration");

        _splitPaymentAndAllocateLae(userAddress, 1, amount);
        totalProjectInvestment += amount;
        _registration(userAddress, referrerAddress);
    }

    function initializePartners(address partner2, address partner3) external onlyOwner {
        require(!partnersInitialized, "LAEClubMatrix: already initialized");
        require(partner2 != address(0) && partner3 != address(0), "LAEClubMatrix: zero partner");
        require(partner2 != partner3, "LAEClubMatrix: duplicate partner");
        require(!isUserExists(partner2) && !isUserExists(partner3), "LAEClubMatrix: partner exists");

        _registerPartner(partner2, 2);
        _registerPartner(partner3, 3);
        lastUserId = 4;
        partnersInitialized = true;
    }

    // --- ADMIN SETTERS ---

    function updateTokenAddress(address newToken) external onlyOwner {
        require(newToken != address(0), "Invalid token address");
        PAYMENT_TOKEN = newToken;
        emit TokenAddressUpdated(newToken);
    }

    function updatePoolAddresses(address newClubPool, address newTreasuryPool) external onlyOwner {
        require(newClubPool != address(0), "Invalid Club Pool address");
        require(newTreasuryPool != address(0), "Invalid Treasury Pool address");
        CLUB_POOL_ADDRESS = newClubPool;
        TREASURY_POOL_ADDRESS = newTreasuryPool;
        emit PoolAddressesUpdated(newClubPool, newTreasuryPool);
    }

    function setLevelTokenCost(uint8 level, uint256 tokenCost) external onlyOwner {
        require(level >= 1 && level <= LAST_LEVEL, "LAEClubMatrix: invalid level");
        require(tokenCost > 0, "LAEClubMatrix: zero cost");
        levelTokenCost[level] = tokenCost;
        emit LevelTokenCostUpdated(level, tokenCost);
    }

    function setLaeCoin(address laeCoinAddress) external onlyOwner {
        require(laeCoinAddress != address(0), "LAEClubMatrix: zero lae");
        LAE_COIN_ADDRESS = laeCoinAddress;
        emit LaeCoinUpdated(laeCoinAddress);
    }

    function setLiquidityPool(address liquidityPoolAddress) external onlyOwner {
        require(liquidityPoolAddress != address(0), "LAEClubMatrix: zero pool");
        LIQUIDITY_POOL_ADDRESS = liquidityPoolAddress;
        emit LiquidityPoolUpdated(liquidityPoolAddress);
    }

    function setSplitBps(uint256 matrixBps, uint256 liquidityBps) external onlyOwner {
        require(matrixBps + liquidityBps == BPS, "LAEClubMatrix: invalid split");
        matrixDistributionBps = matrixBps;
        liquidityAllocationBps = liquidityBps;
        emit SplitBpsUpdated(matrixBps, liquidityBps);
    }

    function setLaePriceInPaymentToken(uint256 price) external onlyOwner {
        require(price > 0, "LAEClubMatrix: zero price");
        laePriceInPaymentToken = price;
        emit LaePriceUpdated(price);
    }

    function setMonthlyReleaseBps(uint8 month, uint256 bps) external onlyOwner {
        require(month >= 1 && month <= VESTING_MONTHS, "LAEClubMatrix: invalid month");
        require(bps <= BPS, "LAEClubMatrix: invalid bps");
        monthlyReleaseBps[month - 1] = bps;
        emit MonthlyReleaseBpsUpdated(month, bps);
    }

    function setDirectRequirement(uint8 month, uint256 requiredDirects) external onlyOwner {
        require(month >= 1 && month <= VESTING_MONTHS, "LAEClubMatrix: invalid month");
        directRequirementByMonth[month - 1] = requiredDirects;
        emit DirectRequirementUpdated(month, requiredDirects);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "LAEClubMatrix: zero owner");
        require(!isUserExists(newOwner), "LAEClubMatrix: user exists");

        address oldOwner = owner;
        User storage oldUser = users[oldOwner];
        User storage newUser = users[newOwner];

        newUser.id = oldUser.id;
        newUser.referrer = oldUser.referrer;
        newUser.referrerId = oldUser.referrerId;
        newUser.teamSize = oldUser.teamSize;
        newUser.registrationTimestamp = oldUser.registrationTimestamp;
        newUser.totalIncome = oldUser.totalIncome;
        newUser.directReferrals = oldUser.directReferrals;

        for (uint8 level = 1; level <= LAST_LEVEL; level++) {
            newUser.activeLevels[level] = oldUser.activeLevels[level];
            XMatrix storage source = oldUser.xMatrix[level];
            XMatrix storage target = newUser.xMatrix[level];
            target.currentReferrer = source.currentReferrer;
            target.referrals = source.referrals;
            target.reinvestCount = source.reinvestCount;
            target.heldTokenForUpgrade = source.heldTokenForUpgrade;
            target.lastSpillUnderReceiverIndex = source.lastSpillUnderReceiverIndex;
            target.totalTeamSize = source.totalTeamSize;
            target.totalEarning = source.totalEarning;

            // Preserve the display-genealogy roots (owner has no parent).
            newUser.gParent[level] = oldUser.gParent[level];
            newUser.gChild0[level] = oldUser.gChild0[level];
            newUser.gChild1[level] = oldUser.gChild1[level];
        }

        delete users[oldOwner];
        idToAddress[1] = newOwner;
        addressToId[oldOwner] = 0;
        addressToId[newOwner] = 1;
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // --- CORE REGISTRATION / PLACEMENT ---

    function _registration(address userAddress, address referrerAddress) private {
        uint256 referrerId = users[referrerAddress].id;
        uint256 currentUserId = lastUserId;

        users[userAddress].id = currentUserId;
        users[userAddress].referrer = referrerAddress;
        users[userAddress].referrerId = referrerId;
        users[userAddress].activeLevels[1] = true;
        users[userAddress].registrationTimestamp = block.timestamp;

        idToAddress[currentUserId] = userAddress;
        addressToId[userAddress] = currentUserId;
        lastUserId++;

        if (referrerAddress == owner) {
            require(!partnersInitialized, "LAEClubMatrix: owner locked");
        }

        users[referrerAddress].directReferrals.push(userAddress);
        emit Registration(currentUserId, referrerId, userAddress);

        address freeReferrer = _findFreeReferrer(userAddress, 1);
        users[userAddress].xMatrix[1].currentReferrer = freeReferrer;
        _processNewPlacement(userAddress, freeReferrer, 1);

        // Display genealogy: place the entrant directly under its own sponsor's leg.
        _placeGenealogy(userAddress, referrerAddress, 1);
    }

    function _registerPartner(address userAddress, uint256 partnerId) private {
        users[userAddress].id = partnerId;
        users[userAddress].referrer = owner;
        users[userAddress].referrerId = 1;
        users[userAddress].activeLevels[1] = true;
        users[userAddress].registrationTimestamp = block.timestamp;

        idToAddress[partnerId] = userAddress;
        addressToId[userAddress] = partnerId;
        users[owner].directReferrals.push(userAddress);
        emit Registration(partnerId, 1, userAddress);

        address freeReferrer = _findFreeReferrer(userAddress, 1);
        require(freeReferrer == owner, "Owner must be the L1 referrer for initial partners.");
        users[userAddress].xMatrix[1].currentReferrer = freeReferrer;
        _processNewPlacement(userAddress, freeReferrer, 1);

        // Display genealogy: initial partners sit directly under the owner.
        _placeGenealogy(userAddress, owner, 1);
    }

    function _processNewPlacement(address newUser, address referrer, uint8 level) private {
        XMatrix storage matrix = users[referrer].xMatrix[level];
        uint256 spotIndex = matrix.referrals.length;
        bool isOwnerRef = referrer == owner;
        uint256 amount = levelTokenCost[level];
        uint256 referrerId = users[referrer].id;

        require(spotIndex < MATRIX_SIZE, "LAEClubMatrix: matrix full");

        matrix.referrals.push(newUser);
        users[referrer].teamSize++;
        matrix.totalTeamSize++;

        emit NewUserPlace(users[newUser].id, referrerId, level, matrix.reinvestCount + 1, uint8(spotIndex + 1));

        // Spot 1 & 2 (index 0,1): spill to upline.
        if (spotIndex == 0) {
            if (isOwnerRef) {
                _sendToPlatformTreasury(amount);
                return;
            }
            address upline = _findEligibleUplineTarget(newUser, referrer, 1, level);
            emit Spillover(referrerId, users[upline].id, level, matrix.reinvestCount + 1, 15);
            _processNewPlacement(newUser, upline, level);
            return;
        }

        if (spotIndex == 1) {
            if (isOwnerRef) {
                _sendToPlatformTreasury(amount);
                return;
            }
            address upline = _findEligibleUplineTarget(newUser, referrer, 2, level);
            emit Spillover(referrerId, users[upline].id, level, matrix.reinvestCount + 1, 16);
            _processNewPlacement(newUser, upline, level);
            return;
        }

        bool isFirstCycle = matrix.reinvestCount == 0;
        bool isLastLevel = level == LAST_LEVEL;

        // Spot 4 (index 3): first cycle holds funds for auto-upgrade; later cycles → Club Pool.
        if (spotIndex == 3) {
            if (isFirstCycle && !isLastLevel && !isOwnerRef) {
                matrix.heldTokenForUpgrade = amount;
            } else {
                _sendToClubPool(referrer, newUser, level, amount);
            }
            return;
        }

        // Spot 5 (index 4): first cycle triggers the free auto-upgrade; later cycles → self income.
        if (spotIndex == 4) {
            if (isFirstCycle && !isLastLevel && !isOwnerRef) {
                matrix.heldTokenForUpgrade = 0;
                _upgradeLevel(referrer, level + 1);
            } else {
                _sendTokenDividends(referrer, newUser, level, amount);
            }
            return;
        }

        // Self income spots: 3,6,8,9,11,12 (index 2,5,7,8,10,11).
        if (spotIndex == 2 || spotIndex == 5 || spotIndex == 7 || spotIndex == 8 || spotIndex == 10 || spotIndex == 11) {
            _sendTokenDividends(referrer, newUser, level, amount);
            return;
        }

        // Spot 7 & 10 (index 6,9): 1st downline spillover.
        if (spotIndex == 6 || spotIndex == 9) {
            address downline = _findEligibleDownlineUser(newUser, referrer, 1, level);
            emit Spillover(referrerId, users[downline].id, level, matrix.reinvestCount + 1, spotIndex == 6 ? 17 : 18);
            if (downline == owner) {
                _sendToPlatformTreasury(amount);
            } else {
                _processNewPlacement(newUser, downline, level);
            }
            return;
        }

        // Spot 13 (index 12): 2nd downline spillover.
        if (spotIndex == 12) {
            address downline = _findEligibleDownlineUser(newUser, referrer, 2, level);
            emit Spillover(referrerId, users[downline].id, level, matrix.reinvestCount + 1, 19);
            if (downline == owner) {
                _sendToPlatformTreasury(amount);
            } else {
                _processNewPlacement(newUser, downline, level);
            }
            return;
        }

        // Spot 14 (index 13): recycle / reinvest.
        if (spotIndex == 13) {
            _recycleCurrentLevel(referrer, level, newUser);
        }
    }

    function _upgradeLevel(address userAddress, uint8 nextLevel) private {
        users[userAddress].activeLevels[nextLevel] = true;
        address freeReferrer = _findFreeReferrer(userAddress, nextLevel);
        users[userAddress].xMatrix[nextLevel].currentReferrer = freeReferrer;
        _processNewPlacement(userAddress, freeReferrer, nextLevel);

        // Display genealogy for this level: place under the user's own sponsor.
        address sponsorForLevel = users[userAddress].referrer;
        if (sponsorForLevel == address(0)) sponsorForLevel = owner;
        _placeGenealogy(userAddress, sponsorForLevel, nextLevel);

        emit Upgrade(users[userAddress].id, users[freeReferrer].id, nextLevel);
    }

    /**
     * @dev Display-only placement. Attaches `entrant` to the first open child slot
     *      in `sponsor`'s genealogy subtree using breadth-first (top->bottom,
     *      left->right) order. This is what the matrix VIEW renders; it never moves
     *      money and never touches the income/recycle logic above. Idempotent: a
     *      user is placed at most once per level (recycles do not re-place).
     */
    function _placeGenealogy(address entrant, address sponsor, uint8 level) private {
        if (entrant == address(0) || sponsor == address(0)) return;
        if (entrant == sponsor) return;
        if (users[entrant].gParent[level] != address(0)) return; // already placed

        address[] memory queue = new address[](4096);
        uint256 head = 0;
        uint256 tail = 0;
        queue[tail++] = sponsor;

        while (head < tail) {
            address node = queue[head++];
            if (users[node].gChild0[level] == address(0)) {
                users[node].gChild0[level] = entrant;
                users[entrant].gParent[level] = node;
                return;
            }
            if (users[node].gChild1[level] == address(0)) {
                users[node].gChild1[level] = entrant;
                users[entrant].gParent[level] = node;
                return;
            }
            if (tail + 2 <= queue.length) {
                queue[tail++] = users[node].gChild0[level];
                queue[tail++] = users[node].gChild1[level];
            }
        }
    }

    function _recycleCurrentLevel(address userAddress, uint8 level, address caller) private {
        XMatrix storage matrix = users[userAddress].xMatrix[level];
        matrix.referrals = new address[](0);
        matrix.reinvestCount++;
        matrix.heldTokenForUpgrade = 0;
        matrix.lastSpillUnderReceiverIndex = 0;

        address freeReferrer = _findFreeReferrer(userAddress, level);
        users[userAddress].xMatrix[level].currentReferrer = freeReferrer;
        emit Reinvest(users[userAddress].id, users[freeReferrer].id, users[caller].id, level);
        _processNewPlacement(userAddress, freeReferrer, level);
    }

    function _findFreeReferrer(address userAddress, uint8 level) public view returns (address) {
        uint256 currentReferrerId = users[userAddress].referrerId;
        while (true) {
            if (currentReferrerId == 0) {
                return owner;
            }
            address currentAddress = idToAddress[currentReferrerId];
            if (users[currentAddress].activeLevels[level] && users[currentAddress].xMatrix[level].referrals.length < MATRIX_SIZE) {
                return currentAddress;
            }
            currentReferrerId = users[currentAddress].referrerId;
        }
        return owner;
    }

    function _isEligibleForSelfPayment(address userAddress) private view returns (bool) {
        return userAddress == owner || users[userAddress].directReferrals.length >= 2;
    }

    // --- BTC PAYOUTS (90% matrix share) ---

    function _sendTokenDividends(address receiver, address from, uint8 level, uint256 amount) private {
        uint256 distributable = _matrixShare(amount);
        bool success = IERC20(PAYMENT_TOKEN).transfer(receiver, distributable);
        if (!success) {
            emit TokenTransferFailed(receiver, distributable, "BTC transfer failed from contract balance");
            revert("LAEClubMatrix: token transfer failed to receiver");
        }
        users[receiver].totalIncome += distributable;
        users[receiver].xMatrix[level].totalEarning += distributable;
        emit TokenReceived(users[receiver].id, users[from].id, from, level, distributable);
    }

    function _sendToClubPool(address referrer, address userAddress, uint8 level, uint256 amount) private {
        uint256 distributable = _matrixShare(amount);
        bool success = IERC20(PAYMENT_TOKEN).transfer(CLUB_POOL_ADDRESS, distributable);
        if (!success) {
            emit TokenTransferFailed(CLUB_POOL_ADDRESS, distributable, "BTC transfer failed to Club Pool");
            revert("LAEClubMatrix: Club Pool transfer failed");
        }
        emit ClubPoolPayment(users[referrer].id, users[userAddress].id, distributable, level);
    }

    function _sendToPlatformTreasury(uint256 amount) private {
        uint256 distributable = _matrixShare(amount);
        bool success = IERC20(PAYMENT_TOKEN).transfer(TREASURY_POOL_ADDRESS, distributable);
        if (!success) {
            emit TokenTransferFailed(TREASURY_POOL_ADDRESS, distributable, "BTC transfer failed to Platform Treasury");
            revert("LAEClubMatrix: Platform Treasury transfer failed");
        }
    }

    function _matrixShare(uint256 amount) private view returns (uint256) {
        return (amount * matrixDistributionBps) / BPS;
    }

    // --- SPILL HELPERS ---

    function _findEligibleUplineTarget(address newUser, address referrer, uint256 uplineLevel, uint8 level) private returns (address) {
        address current = referrer;
        for (uint256 i = 0; i < uplineLevel; i++) {
            current = users[current].xMatrix[level].currentReferrer;
            if (current == address(0)) {
                return owner;
            }
        }

        while (true) {
            if (current == address(0) || current == owner) {
                return owner;
            }
            if (_isEligibleForSelfPayment(current) && users[current].xMatrix[level].referrals.length < MATRIX_SIZE) {
                return current;
            }
            emit MissedIncome(users[current].id, users[newUser].id, level);
            current = users[current].xMatrix[level].currentReferrer;
        }
        return owner;
    }

    function _findEligibleDownlineUser(address newUser, address referrer, uint256 downlineLevel, uint8 level) private returns (address) {
        if (downlineLevel == 1) {
            XMatrix storage matrix = users[referrer].xMatrix[level];
            address[] storage directs = users[referrer].directReferrals;
            if (directs.length == 0) {
                return owner;
            }

            uint256 startIdx = matrix.lastSpillUnderReceiverIndex;
            for (uint256 i = 0; i < directs.length; i++) {
                uint256 idx = (startIdx + i) % directs.length;
                address candidate = directs[idx];
                if (_isEligibleForSelfPayment(candidate) && users[candidate].xMatrix[level].referrals.length < MATRIX_SIZE) {
                    matrix.lastSpillUnderReceiverIndex = (idx + 1) % directs.length;
                    return candidate;
                }
                emit MissedIncome(users[candidate].id, users[newUser].id, level);
            }
            return owner;
        }

        address[] storage firstLevel = users[referrer].directReferrals;
        if (firstLevel.length == 0) {
            return owner;
        }
        for (uint256 i = 0; i < firstLevel.length; i++) {
            address[] storage secondLevel = users[firstLevel[i]].directReferrals;
            for (uint256 j = 0; j < secondLevel.length; j++) {
                address candidate = secondLevel[j];
                if (_isEligibleForSelfPayment(candidate) && users[candidate].xMatrix[level].referrals.length < MATRIX_SIZE) {
                    return candidate;
                }
                emit MissedIncome(users[candidate].id, users[newUser].id, level);
            }
        }
        return owner;
    }

    // --- LAE REWARD LAYER (10% liquidity → vested LAE) ---

    function _splitPaymentAndAllocateLae(address userAddress, uint8 level, uint256 totalAmount) private {
        if (LAE_COIN_ADDRESS == address(0) || LIQUIDITY_POOL_ADDRESS == address(0)) {
            return;
        }

        uint256 liquidityShare = (totalAmount * liquidityAllocationBps) / BPS;
        if (liquidityShare == 0) {
            return;
        }

        require(
            IERC20(PAYMENT_TOKEN).transfer(LIQUIDITY_POOL_ADDRESS, liquidityShare),
            "LAEClubMatrix: liquidity transfer failed"
        );
        totalLiquidityCollected += liquidityShare;

        uint256 laeAmount = _calculateLaeReward(liquidityShare);
        if (laeAmount > 0) {
            _allocateLaeReward(userAddress, laeAmount, liquidityShare, level);
        }
    }

    function _calculateLaeReward(uint256 paymentTokenAmount) private view returns (uint256) {
        if (paymentTokenAmount == 0 || laePriceInPaymentToken == 0 || LAE_COIN_ADDRESS == address(0)) {
            return 0;
        }
        uint256 laeAmount = (paymentTokenAmount * 1e18) / laePriceInPaymentToken;
        uint256 remaining = ILAECoin(LAE_COIN_ADDRESS).rewardPoolRemaining();
        if (laeAmount > remaining) {
            laeAmount = remaining;
        }
        return laeAmount;
    }

    function _allocateLaeReward(address userAddress, uint256 laeAmount, uint256 liquidityContribution, uint8 level) private {
        ILAECoin(LAE_COIN_ADDRESS).recordRewardAllocation(laeAmount);
        laeSchedules[userAddress].push(
            LaeRewardSchedule({
                allocated: laeAmount,
                claimed: 0,
                startTime: block.timestamp,
                liquidityContribution: liquidityContribution,
                level: level
            })
        );
        totalLaeAllocated += laeAmount;
        emit LaeRewardAllocated(userAddress, laeSchedules[userAddress].length - 1, laeAmount, liquidityContribution, level);
    }

    function claimLaeRewards() external nonReentrant returns (uint256 claimedAmount) {
        require(LAE_COIN_ADDRESS != address(0), "LAEClubMatrix: lae not set");

        LaeRewardSchedule[] storage schedules = laeSchedules[msg.sender];
        for (uint256 i = 0; i < schedules.length; i++) {
            uint256 claimable = _claimableForSchedule(msg.sender, schedules[i]);
            if (claimable == 0) {
                continue;
            }
            schedules[i].claimed += claimable;
            claimedAmount += claimable;
        }

        require(claimedAmount > 0, "LAEClubMatrix: nothing claimable");
        totalLaeClaimed += claimedAmount;
        require(ILAECoin(LAE_COIN_ADDRESS).transfer(msg.sender, claimedAmount), "LAEClubMatrix: lae transfer failed");
        emit LaeRewardClaimed(msg.sender, claimedAmount);
    }

    function _releasedForSchedule(LaeRewardSchedule storage schedule) private view returns (uint256) {
        if (schedule.allocated == 0) {
            return 0;
        }

        uint256 elapsed = block.timestamp > schedule.startTime ? block.timestamp - schedule.startTime : 0;
        uint256 totalDuration = uint256(VESTING_MONTHS) * MONTH_DURATION;
        if (elapsed >= totalDuration) {
            return schedule.allocated;
        }

        uint256 released;
        for (uint8 month = 0; month < VESTING_MONTHS; month++) {
            uint256 tranche = (schedule.allocated * monthlyReleaseBps[month]) / BPS;
            uint256 start = uint256(month) * MONTH_DURATION;
            uint256 end = start + MONTH_DURATION;

            if (elapsed >= end) {
                released += tranche;
            } else if (elapsed > start) {
                released += (tranche * (elapsed - start)) / MONTH_DURATION;
            }
        }

        if (released > schedule.allocated) {
            return schedule.allocated;
        }
        return released;
    }

    function _claimableForSchedule(address userAddress, LaeRewardSchedule storage schedule) private view returns (uint256) {
        if (schedule.allocated == 0 || schedule.claimed >= schedule.allocated) {
            return 0;
        }

        uint256 elapsed = block.timestamp > schedule.startTime ? block.timestamp - schedule.startTime : 0;
        uint256 totalDuration = uint256(VESTING_MONTHS) * MONTH_DURATION;
        uint256 directs = users[userAddress].directReferrals.length;
        uint256 qualifiedReleased;

        if (elapsed >= totalDuration) {
            for (uint8 monthFull = 0; monthFull < VESTING_MONTHS; monthFull++) {
                if (directs < directRequirementByMonth[monthFull]) {
                    continue;
                }
                qualifiedReleased += (schedule.allocated * monthlyReleaseBps[monthFull]) / BPS;
            }
        } else {
            for (uint8 month = 0; month < VESTING_MONTHS; month++) {
                if (directs < directRequirementByMonth[month]) {
                    continue;
                }

                uint256 tranche = (schedule.allocated * monthlyReleaseBps[month]) / BPS;
                uint256 start = uint256(month) * MONTH_DURATION;
                uint256 end = start + MONTH_DURATION;

                if (elapsed >= end) {
                    qualifiedReleased += tranche;
                } else if (elapsed > start) {
                    qualifiedReleased += (tranche * (elapsed - start)) / MONTH_DURATION;
                }
            }
        }

        if (qualifiedReleased > schedule.allocated) {
            qualifiedReleased = schedule.allocated;
        }
        if (qualifiedReleased <= schedule.claimed) {
            return 0;
        }
        return qualifiedReleased - schedule.claimed;
    }

    // --- VIEW FUNCTIONS ---

    function getLaeRewardSummary(address userAddress)
        external
        view
        returns (uint256 allocated, uint256 released, uint256 claimable, uint256 claimed, uint256 locked)
    {
        LaeRewardSchedule[] storage schedules = laeSchedules[userAddress];
        for (uint256 i = 0; i < schedules.length; i++) {
            allocated += schedules[i].allocated;
            released += _releasedForSchedule(schedules[i]);
            claimable += _claimableForSchedule(userAddress, schedules[i]);
            claimed += schedules[i].claimed;
        }

        uint256 unlocked = claimed + claimable;
        locked = allocated > unlocked ? allocated - unlocked : 0;
    }

    function getGlobalLaeStats()
        external
        view
        returns (uint256 allocated, uint256 claimed, uint256 liquidityCollected, uint256 pendingLocked)
    {
        allocated = totalLaeAllocated;
        claimed = totalLaeClaimed;
        liquidityCollected = totalLiquidityCollected;
        pendingLocked = allocated > claimed ? allocated - claimed : 0;
    }

    function getLaeScheduleCount(address userAddress) external view returns (uint256) {
        return laeSchedules[userAddress].length;
    }

    function isUserExists(address userAddress) public view returns (bool) {
        return users[userAddress].id != 0;
    }

    function getActiveLevelsCount(address userAddress) public view returns (uint8 count) {
        for (uint8 level = 1; level <= LAST_LEVEL; level++) {
            if (users[userAddress].activeLevels[level]) {
                count++;
            }
        }
    }

    function getUserDetails(uint256 userId)
        external
        view
        returns (
            address userAddress,
            address referrerAddress,
            uint256 referrerId,
            uint256 partnersCount,
            uint8 activeSlotsCount,
            uint256 teamSize,
            uint256 registrationTimestamp,
            uint256 totalIncome
        )
    {
        userAddress = idToAddress[userId];
        require(isUserExists(userAddress), "LAEClubMatrix: user not found");

        User storage user = users[userAddress];
        referrerAddress = user.referrer;
        referrerId = user.referrerId;
        partnersCount = user.directReferrals.length;
        activeSlotsCount = getActiveLevelsCount(userAddress);
        teamSize = user.teamSize;
        registrationTimestamp = user.registrationTimestamp;
        totalIncome = user.totalIncome;
    }

    function getDirectPartnerAddresses(uint256 userId) external view returns (address[] memory) {
        address userAddress = idToAddress[userId];
        require(isUserExists(userAddress), "LAEClubMatrix: user not found");
        return users[userAddress].directReferrals;
    }

    function getDirectPartnerIds(uint256 userId) external view returns (uint256[] memory ids) {
        address userAddress = idToAddress[userId];
        require(isUserExists(userAddress), "LAEClubMatrix: user not found");

        address[] storage directs = users[userAddress].directReferrals;
        ids = new uint256[](directs.length);
        for (uint256 i = 0; i < directs.length; i++) {
            ids[i] = addressToId[directs[i]];
        }
    }

    function getDirectPartnerCount(address userAddress) external view returns (uint256) {
        require(isUserExists(userAddress), "LAEClubMatrix: user not found");
        return users[userAddress].directReferrals.length;
    }

    function isUserSlotActive(uint256 userId, uint8 slot) external view returns (bool) {
        return users[idToAddress[userId]].activeLevels[slot];
    }

    function usersXMatrix(address userAddress, uint8 level)
        external
        view
        returns (
            address currentReferrer,
            uint256 reinvestCount,
            uint256 heldTokenForUpgrade,
            uint256 lastSpillUnderReceiverIndex,
            uint256 totalTeamSize,
            uint256 totalEarning
        )
    {
        XMatrix storage matrix = users[userAddress].xMatrix[level];
        return (
            matrix.currentReferrer,
            matrix.reinvestCount,
            matrix.heldTokenForUpgrade,
            matrix.lastSpillUnderReceiverIndex,
            matrix.totalTeamSize,
            matrix.totalEarning
        );
    }

    /**
     * @notice Returns the 14-position genealogy board for `userAddress` at `level`.
     * @dev Index i (0..13) maps to matrix position i+1, arranged as a 2-4-8 tree:
     *      positions 1,2 = level 1; 3..6 = level 2; 7..14 = level 3. Empty slots are
     *      address(0). Each occupant sits under its own sponsor's leg (top->bottom,
     *      left->right). Occupants here may differ from the internal income array;
     *      income distribution is independent of this display tree.
     */
    function usersXMatrixReferrals(address userAddress, uint8 level) external view returns (address[] memory) {
        address[] memory board = new address[](MATRIX_SIZE);

        // Level-order fill. Positions 0,1 are the owner's children; for any later
        // position p, its parent position is (p-2)/2 and it is the parent's left
        // child when p is even, right child when p is odd. Parents are always filled
        // before their children, so a single forward pass is sufficient.
        board[0] = users[userAddress].gChild0[level];
        board[1] = users[userAddress].gChild1[level];

        for (uint256 p = 2; p < MATRIX_SIZE; p++) {
            address parentAddr = board[(p - 2) / 2];
            if (parentAddr == address(0)) continue;
            board[p] = (p % 2 == 0)
                ? users[parentAddr].gChild0[level]
                : users[parentAddr].gChild1[level];
        }

        return board;
    }

    /// @notice Genealogy parent / children of a user at a level (display tree).
    function genealogyOf(uint256 userId, uint8 level)
        external
        view
        returns (uint256 parentId, uint256 leftChildId, uint256 rightChildId)
    {
        address userAddress = idToAddress[userId];
        parentId = addressToId[users[userAddress].gParent[level]];
        leftChildId = addressToId[users[userAddress].gChild0[level]];
        rightChildId = addressToId[users[userAddress].gChild1[level]];
    }
}
