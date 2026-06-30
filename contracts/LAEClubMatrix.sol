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
 * @notice Brand-new Smart Matrix with UNLIMITED-UPLINE sequential placement.
 *
 *  PLACEMENT (display / team building)
 *  -----------------------------------
 *  Every user owns an independent 14-slot board per level. When a new member
 *  joins, it is appended to the next free slot of its sponsor's board AND of
 *  every upline's board that is still on **cycle 1**. Once an upline recycles,
 *  their cycle 2+ board only receives (a) the upline's **direct referrals**, or
 *  (b) a downline who **completed their own board** (slot 14 recycle) — carried
 *  upward into each upline's current cycle. At 14 the board recycles — the next
 *  cycle starts empty except for those two rules.
 *
 *  INCOME (money)
 *  --------------
 *  **L1:** every upline-board placement pays immediately by slot role (0.0009).
 *  **L2+:** separate settlement per level — slot 14 recycle, cycle-2+ direct,
 *  cycle-1 frontier — so L12 slot 14 never blocks L1 slot 3/6/8 to owner.
 *  **All slot payouts use the L1 registration share (0.0009)** — never level-doubled
 *  nominals on slot 14 / cycle-2+ legs.
 *  **Recycle matrix:** on main slot 14, user enters a global 6-slot FIFO board
 *  (top→bottom, left→right) with recycle income rules; cycle-2+ carry pays.
 *  **upgradeOpened:** after cycle-1 slot 5, slots 4/5 never hold again on that board.
 *  Role table (same on every board / cycle 1):
 *      1              -> board owner's 1st upline (owner wallet if none)
 *      2              -> board owner's 2nd upline (owner wallet if none)
 *      4,14           -> board owner's 1st upline (treasury only when no upline)
 *      5              -> 1st upline on cycle 1 (treasury for owner); board owner on cycle 2+
 *      3,6,8,9,11,12  -> board owner (self / "You")
 *      7              -> board owner's 1st direct (Downline 1)
 *      10             -> board owner's 2nd direct (Downline 2)
 *      13             -> first eligible 2nd-level downline (left-to-right)
 *  Cycle 2+ direct-referral boards still use direct-owner priority on that level.
 *  Higher levels may draw from contract float for slot 14 / upgrade legs.
 *
 *  ELIGIBILITY + LAPSE
 *  -------------------
 *  A user must have >= 2 direct referrals to receive matrix income (owner is
 *  always eligible). If the intended recipient is not eligible, the income
 *  lapses to its immediate upline, then to the 2nd upline; if neither of the
 *  two uplines qualifies the income goes to the Treasury. The search never
 *  goes beyond 2 uplines.
 *
 *  REVENUE SPLIT (unchanged)
 *  -------------------------
 *  90% of every registration flows through the matrix; 10% funds the liquidity
 *  pool and mints a vested LAE reward released over 20 months. No NFTs.
 */
contract LAEClubMatrix {
    // --- Constants ---
    uint8 public constant LAST_LEVEL = 15;       // 15 slots / levels
    uint8 public constant MATRIX_SIZE = 14;      // 14 positions per board
    uint8 public constant RECYCLE_MATRIX_SIZE = 6; // 6-position recycle / upgrade sub-matrix
    uint256 public constant BPS = 10_000;
    uint8 public constant VESTING_MONTHS = 20;   // 20-month LAE release protocol
    uint256 public constant MONTH_DURATION = 30 days;
    uint256 public constant MAX_UPLINE = 60;     // safety bound for upward propagation

    // --- Structs ---
    struct Board {
        address[] slots;        // current-cycle fills (length 0..14)
        uint256 reinvestCount;  // completed cycles (0 = first cycle)
        uint256 totalFilled;    // lifetime placements (all cycles)
        uint256 totalEarning;   // BTC earned by this board's owner at this level
        uint256 heldTokenForUpgrade; // cycle-1 slot 4+5 halves held toward next-level (2x) funding
        bool upgradeOpened;     // slot 5 cycle-1 opened upgrade — never hold slots 4/5 again
    }

    /// @dev Global FIFO recycle matrix (6 slots, top→bottom / left→right like main entry).
    struct RecycleQueueNode {
        address matrixOwner;
        uint256 cycleId;
        address[] slots;
    }

    struct User {
        uint256 id;
        address referrer;                   // sponsor (the placement upline = referral upline)
        uint256 referrerId;
        address[] directReferrals;
        uint256 teamSize;
        uint256 registrationTimestamp;
        uint256 totalIncome;                // total BTC earned across all levels
        mapping(uint8 => bool) activeLevels;
        mapping(uint8 => Board) board;      // per-level 14-slot board
        mapping(uint8 => uint256) lastDownlineIdx; // round-robin pointer for downline payouts
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
    address public TREASURY_POOL_ADDRESS;    // platform treasury (lapse / role 4,5,14)

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

    RecycleQueueNode[] private recycleMatrixQueue;
    uint256 public recycleMatrixHead;

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
    event LapseIncome(uint256 indexed receiverId, uint256 indexed fromId, uint8 level, uint256 amount);
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
    event UpgradeHold(uint256 indexed boardOwnerId, uint256 indexed fromUserId, uint8 boardLevel, uint256 amount);
    event RecycleMatrixPlace(
        uint256 indexed user,
        uint256 indexed matrixOwner,
        uint8 level,
        uint256 cycle,
        uint8 spot
    );

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

        RecycleQueueNode storage rootRecycle = recycleMatrixQueue.push();
        rootRecycle.matrixOwner = ownerAddress;
        rootRecycle.cycleId = 1;
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

        User storage oldUser = users[owner];
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
            Board storage src = oldUser.board[level];
            Board storage dst = newUser.board[level];
            dst.slots = src.slots;
            dst.reinvestCount = src.reinvestCount;
            dst.totalFilled = src.totalFilled;
            dst.totalEarning = src.totalEarning;
            newUser.lastDownlineIdx[level] = oldUser.lastDownlineIdx[level];
        }

        address oldOwner = owner;
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
        // Place on every active upline level (1..15); pay once from the best board/slot.
        _placeMemberAllLevels(userAddress, true, 1);
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
        _placeMemberAllLevels(userAddress, false, 1);
    }

    /**
     * @dev Increment total team size up the sponsor chain (bounded for gas).
     */
    function _bumpTeamSize(address sponsor) private {
        address cur = sponsor;
        for (uint256 i = 0; i < MAX_UPLINE && cur != address(0); i++) {
            users[cur].teamSize++;
            cur = users[cur].referrer;
        }
    }

    /**
     * @dev Cycle 1 boards receive every downline registration. Cycle 2+ boards
     *      only receive the board owner's direct referrals (new registrations).
     */
    function _shouldPlaceOnBoard(address boardOwner, address member, uint8 level) private view returns (bool) {
        if (users[boardOwner].board[level].reinvestCount == 0) return true;
        return users[member].referrer == boardOwner;
    }

    /**
     * @dev When `recycledMember` completes their own board (slot 14), place them
     *      on every upline board that is already on cycle 2+ (no payment).
     */
    function _placeRecycledMemberOnUplines(address recycledMember, uint8 level) private {
        address cur = users[recycledMember].referrer;
        uint256 hops = 0;

        while (cur != address(0) && hops < MAX_UPLINE) {
            if (users[cur].activeLevels[level] && users[cur].board[level].reinvestCount > 0) {
                uint256 rc = users[cur].board[level].reinvestCount;
                uint8 slot = _appendBoard(cur, recycledMember, level);
                _emitNewUserPlace(recycledMember, cur, level, rc + 1, slot);
                _payByRole(recycledMember, cur, slot, level, 1);
                _afterFill(cur, slot, level, recycledMember);
            }
            cur = users[cur].referrer;
            hops++;
        }
    }

    struct PaymentTargets {
        address frontierOwner;
        uint8 frontierSlot;
        uint8 frontierLevel;
        uint256 minReinvest;
        address directOwner;
        uint8 directSlot;
        uint8 directLevel;
        address recyclePayOwner;
        uint8 recyclePaySlot;
        uint8 recyclePayLevel;
    }

    function _emitNewUserPlace(
        address member,
        address boardOwner,
        uint8 level,
        uint256 cycle,
        uint8 slot
    ) private {
        emit NewUserPlace(users[member].id, users[boardOwner].id, level, cycle, slot);
    }

    function _processBoardPlacement(
        address member,
        address boardOwner,
        uint8 level,
        bool doPay,
        PaymentTargets memory targets,
        uint8 feeLevel
    ) private returns (PaymentTargets memory) {
        uint256 rc = users[boardOwner].board[level].reinvestCount;
        uint8 slot = _appendBoard(boardOwner, member, level);
        _emitNewUserPlace(member, boardOwner, level, rc + 1, slot);

        if (doPay) {
            // L1: pay every placement on every upline board (cycle 1 behaviour).
            if (level == 1) {
                _payByRole(member, boardOwner, slot, level, feeLevel);
            } else {
                if (rc > 0 && users[member].referrer == boardOwner && targets.directOwner == address(0)) {
                    targets.directOwner = boardOwner;
                    targets.directSlot = slot;
                    targets.directLevel = level;
                }
                if (slot == MATRIX_SIZE && targets.recyclePayOwner == address(0)) {
                    targets.recyclePayOwner = boardOwner;
                    targets.recyclePaySlot = slot;
                    targets.recyclePayLevel = level;
                }
                if (rc < targets.minReinvest) {
                    targets.minReinvest = rc;
                    targets.frontierOwner = boardOwner;
                    targets.frontierSlot = slot;
                    targets.frontierLevel = level;
                }
            }
        }

        _afterFill(boardOwner, slot, level, member);
        return targets;
    }

    function _walkLevelPlacements(
        address member,
        uint8 level,
        bool doPay,
        PaymentTargets memory targets,
        uint8 feeLevel
    ) private returns (PaymentTargets memory) {
        address cur = users[member].referrer;
        for (uint256 hops = 0; cur != address(0) && hops < MAX_UPLINE; hops++) {
            if (users[cur].activeLevels[level] && _shouldPlaceOnBoard(cur, member, level)) {
                targets = _processBoardPlacement(member, cur, level, doPay, targets, feeLevel);
            }
            cur = users[cur].referrer;
        }
        return targets;
    }

    function _settleRegistrationPayment(address member, PaymentTargets memory targets, uint8 feeLevel) private {
        if (targets.recyclePayOwner != address(0)) {
            _payByRole(member, targets.recyclePayOwner, targets.recyclePaySlot, targets.recyclePayLevel, feeLevel);
        } else if (targets.directOwner != address(0)) {
            _payByRole(member, targets.directOwner, targets.directSlot, targets.directLevel, feeLevel);
        } else if (targets.frontierOwner != address(0)) {
            _payByRole(member, targets.frontierOwner, targets.frontierSlot, targets.frontierLevel, feeLevel);
        }
    }

    /**
     * @dev L2+ legs: slot 14, cycle-2+ direct, and cycle-1 frontier — never
     *      override the separate L1 settlement for the same registration.
     */
    function _settleHigherLevelPayment(
        address member,
        PaymentTargets memory targets,
        uint8 level,
        uint8 feeLevel
    ) private {
        if (targets.recyclePayOwner != address(0)) {
            _payByRole(member, targets.recyclePayOwner, targets.recyclePaySlot, targets.recyclePayLevel, feeLevel);
            return;
        }
        if (targets.directOwner != address(0)) {
            _payByRole(member, targets.directOwner, targets.directSlot, targets.directLevel, feeLevel);
            return;
        }
        if (targets.frontierOwner == address(0)) return;

        if (users[targets.frontierOwner].board[level].reinvestCount == 0) {
            _payByRole(member, targets.frontierOwner, targets.frontierSlot, targets.frontierLevel, feeLevel);
        }
    }

    /**
     * @dev Registration genealogy across all active levels; L1 + per-level L2+ settlements.
     */
    function _placeMemberAllLevels(address member, bool doPay, uint8 feeLevel) private {
        for (uint8 level = 1; level <= LAST_LEVEL; level++) {
            PaymentTargets memory targets;
            targets.minReinvest = type(uint256).max;
            targets = _walkLevelPlacements(member, level, doPay, targets, feeLevel);
            if (!doPay || level == 1) continue;
            _settleHigherLevelPayment(member, targets, level, feeLevel);
        }
    }

    /**
     * @dev Single-level genealogy (upgrade unlock self-placement, no payout).
     */
    function _placeMemberAtLevel(address member, uint8 level, bool doPay, uint8 feeLevel) private {
        if (level == 0 || level > LAST_LEVEL) return;

        PaymentTargets memory targets;
        targets.minReinvest = type(uint256).max;
        targets = _walkLevelPlacements(member, level, doPay, targets, feeLevel);

        if (!doPay) return;
        _settleRegistrationPayment(member, targets, feeLevel);
    }

    /**
     * @dev Append `member` to `boardOwner`'s current-cycle board and return its
     *      1-based slot (1..14).
     */
    function _appendBoard(address boardOwner, address member, uint8 level) private returns (uint8 slot) {
        Board storage b = users[boardOwner].board[level];
        b.slots.push(member);
        b.totalFilled += 1;
        slot = uint8(b.slots.length);
    }

    /**
     * @dev Progression hooks: slot 5 unlocks the owner's next level (free); slot 14
     *      recycles the board empty. Cycle 2 slot 1 is filled only by the next
     *      registration that propagates to this board (not the slot-14 member).
     */
    function _afterFill(address boardOwner, uint8 slot, uint8 level, address member) private {
        if (slot == 5) {
            users[boardOwner].board[level].upgradeOpened = true;
            _unlockNextLevel(boardOwner, level + 1);
        }
        if (slot == MATRIX_SIZE) {
            Board storage b = users[boardOwner].board[level];
            delete b.slots;
            b.reinvestCount += 1;
            emit Reinvest(users[boardOwner].id, users[boardOwner].id, users[boardOwner].id, level);
            _processRecycleMatrixEntry(boardOwner, level);
            _placeRecycledMemberOnUplines(boardOwner, level);
        }
    }

    /**
     * @dev Recycled user fills the global 6-slot recycle matrix head (FIFO), then
     *      receives their own recycle node appended to the queue — same entry model
     *      as main-matrix registration (top→bottom, left→right).
     */
    function _processRecycleMatrixEntry(address entrant, uint8 level) private {
        require(recycleMatrixHead < recycleMatrixQueue.length, "LAEClubMatrix: recycle queue");
        RecycleQueueNode storage head = recycleMatrixQueue[recycleMatrixHead];
        head.slots.push(entrant);
        uint8 slot = uint8(head.slots.length);
        emit RecycleMatrixPlace(
            users[entrant].id,
            users[head.matrixOwner].id,
            level,
            head.cycleId,
            slot
        );
        _payRecycleMatrixSlot(entrant, head.matrixOwner, slot, level);

        if (slot == RECYCLE_MATRIX_SIZE) {
            recycleMatrixHead += 1;
        }
        _appendRecycleMatrixNode(entrant, level);
    }

    function _appendRecycleMatrixNode(address user, uint8 level) private {
        RecycleQueueNode storage node = recycleMatrixQueue.push();
        node.matrixOwner = user;
        node.cycleId = users[user].board[level].reinvestCount;
    }

    /**
     * @dev Recycle-matrix income (009 board): slot 1→admin, 2→2nd upline, 3/5/6→owner, 4→treasury.
     */
    function _payRecycleMatrixSlot(
        address member,
        address matrixOwner,
        uint8 slot,
        uint8 level
    ) private {
        uint256 amount = levelTokenCost[1];
        if (slot == 1) {
            _payResolved(owner, member, level, amount);
        } else if (slot == 2) {
            address target = _uplineOf(matrixOwner, 2);
            if (target == address(0)) target = owner;
            _payResolved(target, member, level, amount);
        } else if (slot == 3 || slot == 5 || slot == 6) {
            _payResolved(matrixOwner, member, level, amount);
        } else if (slot == 4) {
            _sendToPlatformTreasury(amount);
        }
    }

    /**
     * @dev Free level unlock. Marks `nextLevel` active for `user` and places `user`
     *      into its uplines' boards at that level (display/progression only — no
     *      token movement, exactly as the prior contract treated upgrades).
     */
    function _unlockNextLevel(address user, uint8 nextLevel) private {
        if (nextLevel > LAST_LEVEL) return;
        if (users[user].activeLevels[nextLevel]) return;
        users[user].activeLevels[nextLevel] = true;
        emit Upgrade(users[user].id, users[users[user].referrer].id, nextLevel);
        _placeMemberAtLevel(user, nextLevel, false, 1);
    }

    // --- INCOME (single 90% payout, role table + eligibility/lapse) ---

    function _payByRole(
        address member,
        address boardOwner,
        uint8 slot,
        uint8 boardLevel,
        uint8 feeLevel
    ) private {
        // Normal matrix slots: one L1 registration share (0.0009) — never board-level multiples.
        uint256 amount = levelTokenCost[feeLevel];
        bool recycled = users[boardOwner].board[boardLevel].reinvestCount > 0;
        bool upgradeOpened = users[boardOwner].board[boardLevel].upgradeOpened;

        // Cycle-1 slots 4 & 5 only before upgrade opens; never hold again after upgradeOpened.
        if (slot == 4 && !recycled && !upgradeOpened) {
            _holdHalfForNextLevel(boardOwner, member, boardLevel, feeLevel);
            return;
        }
        if (slot == 5 && !recycled && !upgradeOpened) {
            _holdHalfAndFundUplineNextLevel(boardOwner, member, boardLevel, feeLevel);
            return;
        }

        // Slot 4 after upgrade / recycle → treasury at 009 share.
        if (slot == 4 && (recycled || upgradeOpened)) {
            _sendToPlatformTreasury(amount);
            return;
        }

        // Slot 14 → upline next-cycle fund at 009 share (not level-doubled nominal).
        if (slot == 14) {
            _payTreasurySlotToUpline1(boardOwner, member, boardLevel, amount);
            return;
        }

        // Slot 5 cycle 2+ / post-upgrade: board-owner income at 009 share.
        if (slot == 5) {
            _payResolved(boardOwner, member, boardLevel, amount);
            return;
        }

        address target;
        if (slot == 1) {
            target = _uplineOf(boardOwner, 1);
            if (target == address(0)) target = owner;
        } else if (slot == 2) {
            target = _uplineOf(boardOwner, 2);
            if (target == address(0)) target = owner;
        } else if (slot == 7) {
            target = _directDownline(boardOwner, 0);
            if (target == address(0)) target = boardOwner;
        } else if (slot == 10) {
            target = _directDownline(boardOwner, 1);
            if (target == address(0)) target = boardOwner;
        } else if (slot == 13) {
            target = _targetForPosition13(boardOwner);
            if (target == address(0)) {
                _sendToPlatformTreasury(amount);
                return;
            }
        } else if (
            slot == 3 || slot == 6 || slot == 8 || slot == 9 || slot == 11 || slot == 12
        ) {
            target = boardOwner;
        } else {
            _sendToPlatformTreasury(amount);
            return;
        }

        _payResolved(target, member, boardLevel, amount);
    }

    /**
     * @dev Cycle-1 slot 4: hold one registration matrix share (0.0009 at L1).
     */
    function _holdHalfForNextLevel(address boardOwner, address member, uint8 boardLevel, uint8 feeLevel) private {
        if (boardLevel >= LAST_LEVEL) {
            _sendToPlatformTreasury(levelTokenCost[feeLevel]);
            return;
        }
        uint256 holdShare = _matrixShare(levelTokenCost[boardLevel]);
        users[boardOwner].board[boardLevel].heldTokenForUpgrade += holdShare;
        emit UpgradeHold(users[boardOwner].id, users[member].id, boardLevel, holdShare);
    }

    /**
     * @dev Cycle-1 slot 5: hold second share at this level, release next-level (2×) upgrade to upline.
     */
    function _holdHalfAndFundUplineNextLevel(
        address boardOwner,
        address member,
        uint8 boardLevel,
        uint8 feeLevel
    ) private {
        if (boardLevel >= LAST_LEVEL) {
            _sendToPlatformTreasury(levelTokenCost[feeLevel]);
            return;
        }
        uint8 nextLevel = boardLevel + 1;
        uint256 holdShare = _matrixShare(levelTokenCost[boardLevel]);
        Board storage b = users[boardOwner].board[boardLevel];
        b.heldTokenForUpgrade += holdShare;
        emit UpgradeHold(users[boardOwner].id, users[member].id, boardLevel, holdShare);

        uint256 releaseNominal = levelTokenCost[nextLevel];
        uint256 releaseShare = _matrixShare(releaseNominal);
        if (b.heldTokenForUpgrade < releaseShare) {
            return;
        }
        b.heldTokenForUpgrade -= releaseShare;

        address upline1 = _uplineOf(boardOwner, 1);
        if (upline1 == address(0)) {
            _sendToPlatformTreasury(releaseNominal);
            return;
        }
        _payResolved(upline1, member, nextLevel, releaseNominal);
    }

    /**
     * @dev Treasury-slot income (4, 5 cycle-1, 14) goes to the board owner's 1st upline
     *      to fund that upline's recycled-cycle board. Only the root owner (no upline)
     *      sends these legs to the platform treasury.
     */
    function _payTreasurySlotToUpline1(
        address boardOwner,
        address member,
        uint8 boardLevel,
        uint256 amount
    ) private {
        address upline1 = _uplineOf(boardOwner, 1);
        if (upline1 == address(0)) {
            _sendToPlatformTreasury(amount);
            return;
        }
        _payResolved(upline1, member, boardLevel, amount);
    }

    /**
     * @dev Apply eligibility + lapse to `target`, then pay the 90% BTC share to
     *      the resolved recipient (or treasury when nobody in the chain qualifies).
     */
    function _payResolved(address target, address member, uint8 level, uint256 amount) private {
        (address recipient, bool isTreasury) = _resolveRecipient(target, member, level);
        if (isTreasury) {
            _sendToPlatformTreasury(amount);
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
        for (uint256 i = 0; i < 3; i++) { // target + up to 2 uplines
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

    /**
     * @dev Position 13: first eligible 2nd-level downline left-to-right; if none
     *      qualify, the first 2nd-level member in order is used so lapse can apply.
     */
    function _targetForPosition13(address boardOwner) private view returns (address) {
        address[] storage directs = users[boardOwner].directReferrals;
        address firstAny = address(0);
        for (uint256 i = 0; i < directs.length; i++) {
            address[] storage children = users[directs[i]].directReferrals;
            for (uint256 j = 0; j < children.length; j++) {
                if (firstAny == address(0)) {
                    firstAny = children[j];
                }
                if (_isEligible(children[j])) {
                    return children[j];
                }
            }
        }
        return firstAny;
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
        users[receiver].board[level].totalEarning += distributable;
        emit TokenReceived(users[receiver].id, users[from].id, from, level, distributable);
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

    /**
     * @notice ABI-compatible board summary.
     * @return currentReferrer        sponsor of `userAddress`
     * @return reinvestCount          completed cycles at `level`
     * @return heldTokenForUpgrade    cycle-1 slot 4+5 halves held toward next level (2x)
     * @return lastSpillUnderReceiverIndex round-robin downline pointer
     * @return totalTeamSize          lifetime placements in this board
     * @return totalEarning           BTC earned at this level
     */
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
        return (
            u.referrer,
            b.reinvestCount,
            b.heldTokenForUpgrade,
            u.lastDownlineIdx[level],
            b.totalFilled,
            b.totalEarning
        );
    }

    /**
     * @notice Returns the 14-slot current-cycle board for `userAddress` at `level`.
     +
     * @dev Index i (0..13) maps to matrix position i+1, filled in arrival order
     *      (slot 1, 2, 3 …). Empty slots are address(0).
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

    /**
     * @notice Referral-tree view (kept for ABI compatibility). In this model the
     *         placement upline equals the referral upline, so `parentId` is the
     *         sponsor and the two children are the first two direct referrals.
     */
    function genealogyOf(uint256 userId, uint8 level)
        external
        view
        returns (uint256 parentId, uint256 leftChildId, uint256 rightChildId)
    {
        level; // unused — referral tree is level-independent
        address userAddress = idToAddress[userId];
        parentId = users[userAddress].referrerId;

        address[] storage directs = users[userAddress].directReferrals;
        if (directs.length > 0) leftChildId = addressToId[directs[0]];
        if (directs.length > 1) rightChildId = addressToId[directs[1]];
    }

    /// @notice Total direct referrals of a user (helper for off-chain board building).
    function getBoardLength(uint256 userId, uint8 level) external view returns (uint256) {
        return users[idToAddress[userId]].board[level].slots.length;
    }
}
