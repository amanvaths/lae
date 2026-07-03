// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Standard ERC-20 / BEP-20 interface for the BTC payment token.
interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

// LAE reward token (the only token minted by this project).
interface ILAECoin {
    function recordRewardAllocation(uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function rewardPoolRemaining() external view returns (uint256);
}

/**
 * @title LAEClubMatrix
 * @notice Closed-loop 15-level x 14-slot smart matrix with per-level ascension
 *         gating. 90% of every registration flows through the matrix, 10% funds
 *         the liquidity pool and mints a vested LAE reward (20 months).
 *
 *  PLACEMENT (genealogy — every upline board)
 *  -------------------------------------------
 *  Each user owns one 14-slot board per level. A new registration is placed on
 *  EVERY upline board along the sponsor chain (sponsor's board gets its next
 *  spot, sponsor's sponsor gets its next spot, ... up to the owner). Boards fill
 *  1..14 independently; on slot 14 a board recycles (empties, cycle++) and keeps
 *  filling from that owner's future downline registrations.
 *
 *  INCOME (single payout per registration, senior filling board)
 *  -------------------------------------------------------------
 *  Money is paid ONCE per registration, from the board of the upline whose
 *  reinvestCount is MINIMUM along the chain (the earliest active cycle).
 *  Tie-break: at cycle 1 (rc = 0) the MOST SENIOR upline wins (owner first);
 *  at cycle 2+ the CLOSEST upline wins. The payout uses THAT board's slot role:
 *  slots 1,2 pay the board owner's uplines; 3,6,8,9,11,12 pay the board owner;
 *  7,10 pay its directs; 13 pays its 2nd-level; 14 pays upline-1.
 *  Slots 4 & 5 on the paying board are HELD (2 * slot = matrixShare(cost[N+1])).
 *  When the paying slot is 5 the board owner ASCENDS to level N+1 carrying the
 *  held funds, which pay one slot on the level N+1 board. Level-1 slots are
 *  funded by registration fees; level N>=2 slots are funded by the held funds
 *  carried up from level N-1 — so total paid never exceeds fees collected.
 *
 *  ELIGIBILITY + LAPSE
 *  -------------------
 *  A recipient needs >= 2 directs to receive matrix income (owner is always
 *  eligible). Otherwise the income lapses to the 1st upline, then the 2nd upline;
 *  if neither qualifies it goes to the treasury. Search never exceeds 2 uplines.
 */
contract LAEClubMatrix {
    // --- Constants ---
    uint8 public constant LAST_LEVEL = 15;
    uint8 public constant MATRIX_SIZE = 14;
    uint256 public constant BPS = 10_000;
    uint8 public constant VESTING_MONTHS = 20;
    uint256 public constant MONTH_DURATION = 30 days;
    uint256 public constant MAX_UPLINE = 60;

    // --- Structs ---
    struct Board {
        address[] slots;             // current-cycle occupants (0..14)
        uint256 reinvestCount;       // completed cycles (0 = first cycle)
        uint256 totalFilled;         // lifetime placements across all cycles
        uint256 totalEarning;        // BTC earned by this board's owner at this level
        uint256 heldForUpgrade;      // slot 4 + 5 shares held toward the next-level ascension
    }

    struct User {
        uint256 id;
        address referrer;            // genealogy sponsor
        uint256 referrerId;
        address[] directReferrals;
        uint256 teamSize;
        uint256 registrationTimestamp;
        uint256 totalIncome;
        mapping(uint8 => bool) activeLevels;
        mapping(uint8 => Board) board;
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
    address public CLUB_POOL_ADDRESS;        // legacy pool (kept for ABI compatibility)
    address public TREASURY_POOL_ADDRESS;    // platform treasury (lapse / slot 13,14 fallback)

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

    uint256[20] public monthlyReleaseBps;
    uint256[20] public directRequirementByMonth;

    mapping(address => LaeRewardSchedule[]) private laeSchedules;

    bool private entered;

    // --- Events ---
    event Registration(uint256 indexed userId, uint256 indexed referrerId, address indexed userAddress);
    event NewUserPlace(uint256 indexed user, uint256 indexed referrer, uint8 level, uint256 cycle, uint8 spot);
    event TokenReceived(uint256 indexed receiverId, uint256 indexed fromId, address indexed from, uint8 level, uint256 amount);
    event ClubPoolPayment(uint256 indexed refId, uint256 indexed userId, uint256 amount, uint8 level);
    event Reinvest(uint256 indexed userId, uint256 indexed newReferrerId, uint256 indexed callerId, uint8 level);
    event Upgrade(uint256 indexed userId, uint256 indexed newReferrerId, uint8 level);
    event MissedIncome(uint256 indexed receiverId, uint256 indexed userId, uint8 level);
    event LapseIncome(uint256 indexed receiverId, uint256 indexed fromId, uint8 level, uint256 amount);
    event UpgradeHold(uint256 indexed boardOwnerId, uint256 indexed fromUserId, uint8 boardLevel, uint256 amount);
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

        // Level 1 = 0.001 BTC; each level doubles up to level 15 (16.384 BTC).
        levelTokenCost[1] = 1e15;
        for (uint8 i = 2; i <= LAST_LEVEL; i++) {
            levelTokenCost[i] = levelTokenCost[i - 1] * 2;
        }

        User storage o = users[ownerAddress];
        o.id = 1;
        o.referrer = address(0);
        o.referrerId = 0;
        o.registrationTimestamp = block.timestamp;
        idToAddress[1] = ownerAddress;
        addressToId[ownerAddress] = 1;
        for (uint8 level = 1; level <= LAST_LEVEL; level++) {
            o.activeLevels[level] = true;
        }

        // 20-month release: 5%/month; month M (1..20) requires M+1 direct referrals.
        for (uint8 month = 0; month < VESTING_MONTHS; month++) {
            monthlyReleaseBps[month] = 500;
            directRequirementByMonth[month] = uint256(month) + 2;
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
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // --- CORE REGISTRATION / PLACEMENT ---

    function _registration(address userAddress, address referrerAddress) private {
        uint256 referrerId = users[referrerAddress].id;
        uint256 currentUserId = lastUserId;

        User storage u = users[userAddress];
        u.id = currentUserId;
        u.referrer = referrerAddress;
        u.referrerId = referrerId;
        u.activeLevels[1] = true;
        u.registrationTimestamp = block.timestamp;

        idToAddress[currentUserId] = userAddress;
        addressToId[userAddress] = currentUserId;
        lastUserId++;

        if (referrerAddress == owner) {
            require(!partnersInitialized, "LAEClubMatrix: owner locked");
        }

        users[referrerAddress].directReferrals.push(userAddress);
        emit Registration(currentUserId, referrerId, userAddress);

        _bumpTeamSize(referrerAddress);
        _enterLevel(userAddress, 1, _matrixShare(levelTokenCost[1]));
    }

    function _registerPartner(address userAddress, uint256 partnerId) private {
        User storage u = users[userAddress];
        u.id = partnerId;
        u.referrer = owner;
        u.referrerId = 1;
        u.activeLevels[1] = true;
        u.registrationTimestamp = block.timestamp;

        idToAddress[partnerId] = userAddress;
        addressToId[userAddress] = partnerId;
        users[owner].directReferrals.push(userAddress);
        emit Registration(partnerId, 1, userAddress);

        _bumpTeamSize(owner);
        _enterLevel(userAddress, 1, _matrixShare(levelTokenCost[1]));
    }

    function _bumpTeamSize(address sponsor) private {
        address cur = sponsor;
        for (uint256 i = 0; i < MAX_UPLINE && cur != address(0); i++) {
            users[cur].teamSize++;
            cur = users[cur].referrer;
        }
    }

    /**
     * @dev Place `member` on EVERY upline board at `level` (sponsor first, then
     *      sponsor's sponsor, ... up to the owner). Each board fills 1..14 and
     *      recycles independently at slot 14. Money is paid ONCE, from the board
     *      of the upline with the minimum reinvestCount (earliest active cycle):
     *      at rc = 0 the most senior upline wins; at rc > 0 the closest wins.
     *      If the paying slot is 5, that board owner ascends carrying held funds.
     */
    function _enterLevel(address member, uint8 level, uint256 carried) private {
        if (!users[member].activeLevels[level]) {
            users[member].activeLevels[level] = true;
        }

        address payOwner = address(0);
        uint8 paySlot = 0;
        uint256 minRc = type(uint256).max;

        address cur = users[member].referrer;
        for (uint256 hops = 0; cur != address(0) && hops < MAX_UPLINE; hops++) {
            if (users[cur].activeLevels[level]) {
                Board storage b = users[cur].board[level];
                uint256 rcBefore = b.reinvestCount;
                b.slots.push(member);
                uint8 spot = uint8(b.slots.length);
                b.totalFilled += 1;
                emit NewUserPlace(users[member].id, users[cur].id, level, rcBefore + 1, spot);

                if (rcBefore < minRc) {
                    // Earlier cycle found — walking upward, so at rc > 0 the
                    // CLOSEST upline at that cycle keeps the payment.
                    minRc = rcBefore;
                    payOwner = cur;
                    paySlot = spot;
                } else if (rcBefore == minRc && rcBefore == 0) {
                    // Cycle-1 tie — the MORE SENIOR upline takes the payment.
                    payOwner = cur;
                    paySlot = spot;
                }

                if (spot == MATRIX_SIZE) {
                    delete b.slots;
                    b.reinvestCount += 1;
                    emit Reinvest(users[cur].id, users[cur].id, users[cur].id, level);
                }
            }
            cur = users[cur].referrer;
        }

        if (payOwner == address(0)) {
            // No upline board at this level (owner's own entry) — funds stay.
            return;
        }

        _payByRole(member, payOwner, paySlot, level, carried);
        if (paySlot == 5) {
            _ascend(payOwner, level);
        }
    }

    function _afterFill(address boardOwner, uint8 spot, uint8 level) private {
        if (spot == 5) {
            _ascend(boardOwner, level);
        }
        if (spot == MATRIX_SIZE) {
            Board storage b = users[boardOwner].board[level];
            delete b.slots;
            b.reinvestCount += 1;
            emit Reinvest(users[boardOwner].id, users[boardOwner].id, users[boardOwner].id, level);
        }
    }

    /**
     * @dev Board owner ascends from `fromLevel` to fromLevel+1, carrying the held
     *      (slot 4 + slot 5) funds which pay one slot on the next-level board. From
     *      level 2 onward the ascender is placed on its SPONSOR's next-level board
     *      (upline-based), not the global frontier — so a member's own downline
     *      fills that member's higher-level boards.
     */
    function _ascend(address boardOwner, uint8 fromLevel) private {
        Board storage fb = users[boardOwner].board[fromLevel];
        uint256 carried = fb.heldForUpgrade;
        fb.heldForUpgrade = 0;

        uint8 nextLevel = fromLevel + 1;
        if (nextLevel > LAST_LEVEL) {
            if (carried > 0) _rawTransfer(TREASURY_POOL_ADDRESS, carried);
            return;
        }

        emit Upgrade(users[boardOwner].id, users[boardOwner].referrerId, nextLevel);
        _placeAscension(boardOwner, nextLevel, carried);
    }

    /**
     * @dev Walk up the sponsor chain and return the first upline that is active at
     *      `level` and whose current-cycle board still has an open slot. The owner
     *      is active at every level and its board recycles at 14, so it is the
     *      guaranteed catch-all. Returns address(0) only for the owner's own
     *      ascension (no upline exists).
     */
    function _uplineWithSpace(address ascender, uint8 level) private view returns (address) {
        address cur = users[ascender].referrer;
        for (uint256 hops = 0; cur != address(0) && hops < MAX_UPLINE; hops++) {
            if (
                users[cur].activeLevels[level] &&
                users[cur].board[level].slots.length < MATRIX_SIZE
            ) {
                return cur;
            }
            cur = users[cur].referrer;
        }
        return address(0);
    }

    /**
     * @dev Sponsor-based ascension placement (levels 2+). The ascending board
     *      owner is placed on the nearest upline (its direct sponsor first) whose
     *      next-level board has room, and carries its held funds to pay that slot.
     *      Slot-5 on the target triggers the target's own ascension; slot-14
     *      recycles the target's board in place.
     */
    function _placeAscension(address ascender, uint8 level, uint256 carried) private {
        if (!users[ascender].activeLevels[level]) {
            users[ascender].activeLevels[level] = true;
        }

        address target = _uplineWithSpace(ascender, level);
        if (target == address(0)) {
            // Root ascension (owner has no upline) — carried funds stay in contract.
            return;
        }

        Board storage b = users[target].board[level];
        b.slots.push(ascender);
        uint8 spot = uint8(b.slots.length);
        b.totalFilled += 1;
        emit NewUserPlace(users[ascender].id, users[target].id, level, b.reinvestCount + 1, spot);

        _payByRole(ascender, target, spot, level, carried);
        _afterFill(target, spot, level);
    }

    // --- INCOME (single payout per slot, role table + eligibility/lapse) ---

    function _payByRole(
        address member,
        address boardOwner,
        uint8 spot,
        uint8 level,
        uint256 amount
    ) private {
        // Slots 4 & 5 hold toward the board owner's ascension (funds stay in contract).
        if (spot == 4 || spot == 5) {
            users[boardOwner].board[level].heldForUpgrade += amount;
            emit UpgradeHold(users[boardOwner].id, users[member].id, level, amount);
            return;
        }

        address target;
        if (spot == 1) {
            target = _uplineOf(boardOwner, 1);
            if (target == address(0)) target = owner;
        } else if (spot == 2) {
            target = _uplineOf(boardOwner, 2);
            if (target == address(0)) target = owner;
        } else if (spot == 7) {
            target = _directDownline(boardOwner, 0);
            if (target == address(0)) target = boardOwner;
        } else if (spot == 10) {
            target = _directDownline(boardOwner, 1);
            if (target == address(0)) target = boardOwner;
        } else if (spot == 13) {
            target = _targetForPosition13(boardOwner);
            if (target == address(0)) {
                _sendToTreasuryAmount(member, level, amount);
                return;
            }
        } else if (spot == 14) {
            target = _uplineOf(boardOwner, 1);
            if (target == address(0)) {
                _sendToTreasuryAmount(member, level, amount);
                return;
            }
        } else {
            // 3, 6, 8, 9, 11, 12 -> board owner (self income)
            target = boardOwner;
        }

        _payResolved(target, member, level, amount);
    }

    function _payResolved(address target, address member, uint8 level, uint256 amount) private {
        (address recipient, bool isTreasury) = _resolveRecipient(target, member, level);
        if (isTreasury) {
            _sendToTreasuryAmount(member, level, amount);
        } else {
            _sendTokenDividends(recipient, member, level, amount);
        }
    }

    /**
     * @dev Eligibility + lapse: a recipient needs >= 2 directs (owner exempt). If
     *      not eligible, lapse to the 1st upline, then the 2nd upline; otherwise
     *      treasury. Never searches beyond 2 uplines.
     */
    function _resolveRecipient(address target, address member, uint8 level)
        private
        returns (address recipient, bool isTreasury)
    {
        address cur = target;
        for (uint256 i = 0; i < 3; i++) {
            if (cur == address(0)) break;
            if (_isEligible(cur)) {
                if (i > 0) {
                    emit LapseIncome(users[cur].id, users[member].id, level, _matrixShare(levelTokenCost[level]));
                }
                return (cur, false);
            }
            emit MissedIncome(users[cur].id, users[member].id, level);
            cur = users[cur].referrer;
        }
        return (TREASURY_POOL_ADDRESS, true);
    }

    function _isEligible(address user) private view returns (bool) {
        return user == owner || users[user].directReferrals.length >= 2;
    }

    function _uplineOf(address boardOwner, uint256 k) private view returns (address) {
        address cur = boardOwner;
        for (uint256 i = 0; i < k; i++) {
            cur = users[cur].referrer;
            if (cur == address(0)) return address(0);
        }
        return cur;
    }

    function _directDownline(address boardOwner, uint256 index) private view returns (address) {
        address[] storage directs = users[boardOwner].directReferrals;
        if (index >= directs.length) return address(0);
        return directs[index];
    }

    function _targetForPosition13(address boardOwner) private view returns (address) {
        address[] storage directs = users[boardOwner].directReferrals;
        address firstAny = address(0);
        for (uint256 i = 0; i < directs.length; i++) {
            address[] storage children = users[directs[i]].directReferrals;
            for (uint256 j = 0; j < children.length; j++) {
                if (firstAny == address(0)) firstAny = children[j];
                if (_isEligible(children[j])) return children[j];
            }
        }
        return firstAny;
    }

    // --- BTC PAYOUTS ---

    function _sendTokenDividends(address receiver, address from, uint8 level, uint256 amount) private {
        bool success = IERC20(PAYMENT_TOKEN).transfer(receiver, amount);
        if (!success) {
            emit TokenTransferFailed(receiver, amount, "BTC transfer failed from contract balance");
            revert("LAEClubMatrix: token transfer failed to receiver");
        }
        users[receiver].totalIncome += amount;
        users[receiver].board[level].totalEarning += amount;
        emit TokenReceived(users[receiver].id, users[from].id, from, level, amount);
    }

    function _sendToTreasuryAmount(address from, uint8 level, uint256 amount) private {
        _rawTransfer(TREASURY_POOL_ADDRESS, amount);
        emit ClubPoolPayment(0, users[from].id, amount, level);
    }

    function _rawTransfer(address to, uint256 amount) private {
        if (amount == 0) return;
        bool success = IERC20(PAYMENT_TOKEN).transfer(to, amount);
        if (!success) {
            emit TokenTransferFailed(to, amount, "BTC transfer failed");
            revert("LAEClubMatrix: token transfer failed");
        }
    }

    function _matrixShare(uint256 amount) private view returns (uint256) {
        return (amount * matrixDistributionBps) / BPS;
    }

    // --- LAE REWARD LAYER (10% liquidity -> vested LAE) ---

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
        User storage u = users[userAddress];
        Board storage b = u.board[level];
        return (u.referrer, b.reinvestCount, b.heldForUpgrade, 0, b.totalFilled, b.totalEarning);
    }

    /**
     * @notice Returns the 14-slot current-cycle board for `userAddress` at `level`.
     */
    function usersXMatrixReferrals(address userAddress, uint8 level) external view returns (address[] memory) {
        address[] memory out = new address[](MATRIX_SIZE);
        address[] storage s = users[userAddress].board[level].slots;
        uint256 n = s.length;
        for (uint256 i = 0; i < n && i < MATRIX_SIZE; i++) {
            out[i] = s[i];
        }
        return out;
    }

    function genealogyOf(uint256 userId, uint8 level)
        external
        view
        returns (uint256 parentId, uint256 leftChildId, uint256 rightChildId)
    {
        level;
        address userAddress = idToAddress[userId];
        parentId = users[userAddress].referrerId;

        address[] storage directs = users[userAddress].directReferrals;
        if (directs.length > 0) leftChildId = addressToId[directs[0]];
        if (directs.length > 1) rightChildId = addressToId[directs[1]];
    }

    function getBoardLength(uint256 userId, uint8 level) external view returns (uint256) {
        return users[idToAddress[userId]].board[level].slots.length;
    }

    function contractTokenBalance() external view returns (uint256) {
        return IERC20(PAYMENT_TOKEN).balanceOf(address(this));
    }
}
