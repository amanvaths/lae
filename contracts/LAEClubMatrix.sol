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
 *  every upline's board, all the way to the top (top->bottom / left->right is
 *  expressed here as simple arrival order: slot 1, 2, 3 …). So each user's
 *  board shows their entire downline in the order it grew. At 14 the board
 *  recycles (a new cycle starts at slot 1).
 *
 *  INCOME (money) — SINGLE recipient per registration
 *  --------------------------------------------------
 *  A registration produces exactly ONE 90% matrix payout, decided by the new
 *  member's slot in its DIRECT SPONSOR's board using the role table:
 *      1,2            -> sponsor's 1st / 2nd upline
 *      3,6,8,9,11,12  -> sponsor (self)
 *      4,5,14         -> treasury
 *      7,10           -> sponsor's 1st downline
 *      13             -> sponsor's 2nd downline
 *  Paying only once (not once per upline board) keeps the contract solvent
 *  while reproducing the exact recipients of the intended design, because the
 *  eligibility / lapse rules below route the money up to the right person.
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
        // Sequential placement into every upline's level-1 board; pays income once
        // (decided by the new member's slot in its direct sponsor's board).
        _placeMember(userAddress, 1, true);
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
        // Initial partners are placed for free (setup) — no payout from an unfunded contract.
        _placeMember(userAddress, 1, false);
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
     * @dev Place `member` into the level-`level` board of its sponsor and of every
     *      upline that owns this level (top to bottom). The FIRST active board
     *      encountered (the direct sponsor for level 1) decides the single income
     *      payout. All other boards are filled for display only (no money moves).
     *      When a board reaches slot 5 the owner's next level unlocks for free;
     *      slot 14 recycles the board.
     */
    function _placeMember(address member, uint8 level, bool doPay) private {
        if (level == 0 || level > LAST_LEVEL) return;

        address cur = users[member].referrer;
        uint256 hops = 0;
        bool paid = false;

        while (cur != address(0) && hops < MAX_UPLINE) {
            if (users[cur].activeLevels[level]) {
                uint8 slot = _appendBoard(cur, member, level);
                emit NewUserPlace(users[member].id, users[cur].id, level, users[cur].board[level].reinvestCount + 1, slot);

                if (doPay && !paid) {
                    _payByRole(member, cur, slot, level);
                    paid = true;
                }

                _afterFill(cur, slot, level);
            }
            cur = users[cur].referrer;
            hops++;
        }

        // No active upline to earn from (e.g. very top) — route the share to treasury.
        if (doPay && !paid) {
            _sendToPlatformTreasury(levelTokenCost[level]);
        }
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
     *      completes the cycle and recycles the board.
     */
    function _afterFill(address boardOwner, uint8 slot, uint8 level) private {
        if (slot == 5) {
            _unlockNextLevel(boardOwner, level + 1);
        }
        if (slot == MATRIX_SIZE) {
            Board storage b = users[boardOwner].board[level];
            delete b.slots;            // reset for the next cycle
            b.reinvestCount += 1;
            emit Reinvest(users[boardOwner].id, users[boardOwner].id, users[boardOwner].id, level);
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
        _placeMember(user, nextLevel, false);
    }

    // --- INCOME (single 90% payout, role table + eligibility/lapse) ---

    function _payByRole(address member, address boardOwner, uint8 slot, uint8 level) private {
        uint256 amount = levelTokenCost[level];

        // Treasury slots.
        if (slot == 4 || slot == 5 || slot == 14) {
            _sendToPlatformTreasury(amount);
            return;
        }

        address target;
        if (slot == 1 || slot == 2) {
            target = _uplineOf(boardOwner, slot == 1 ? 1 : 2);
            if (target == address(0)) target = boardOwner; // lapse to board owner (e.g. owner has no upline)
        } else if (slot == 7 || slot == 10) {
            target = _downlineOf(boardOwner, 1, level);
            if (target == address(0)) target = boardOwner;
        } else if (slot == 13) {
            target = _downlineOf(boardOwner, 2, level);
            if (target == address(0)) target = boardOwner;
        } else {
            // 3,6,8,9,11,12 -> self
            target = boardOwner;
        }

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

    function _downlineOf(address boardOwner, uint256 gen, uint8 level) private returns (address) {
        address[] storage directs = users[boardOwner].directReferrals;
        if (directs.length == 0) return address(0);

        if (gen == 1) {
            uint256 start = users[boardOwner].lastDownlineIdx[level] % directs.length;
            address pick = directs[start];
            users[boardOwner].lastDownlineIdx[level] = (start + 1) % directs.length;
            return pick;
        }

        // gen 2 — first available second-generation direct.
        for (uint256 i = 0; i < directs.length; i++) {
            address[] storage sub = users[directs[i]].directReferrals;
            if (sub.length > 0) return sub[0];
        }
        return address(0);
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
     * @return heldTokenForUpgrade    always 0 (upgrades are free)
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
            0,
            u.lastDownlineIdx[level],
            b.totalFilled,
            b.totalEarning
        );
    }

    /**
     * @notice Returns the 14-slot current-cycle board for `userAddress` at `level`.
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
