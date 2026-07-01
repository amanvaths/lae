// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface ILAECoin {
    function recordRewardAllocation(uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function rewardPoolRemaining() external view returns (uint256);
}

interface IRegistrationPassNFT {
    function mint(address to, uint256 tokenId) external;
}

interface IRoyaltyCardNFT {
    function mint(address to) external;
}

contract LAEClubMatrix {
    bool private locked;
    modifier nonReentrant() {
        require(!locked, "LAEClub: Reentrant call detected");
        locked = true;
        _;
        locked = false;
    }

    struct XMatrix {
        address currentReferrer;
        address[] referrals;
        uint reinvestCount;
        uint heldTokenForUpgrade;
        uint lastSpillUnderReceiverIndex;
        uint totalTeamSize;
        uint256 totalEarning;
    }

    struct User {
        uint id;
        address referrer;
        uint referrerId;
        address[] directReferrals;
        uint teamSize;
        uint registrationTimestamp;
        uint256 totalIncome;
        mapping(uint8 => bool) activeLevels;
        mapping(uint8 => XMatrix) xMatrix;
    }

    struct LaeRewardSchedule {
        uint256 allocated;
        uint256 claimed;
        uint256 startTime;
        uint256 liquidityContribution;
        uint8 level;
    }

    uint8 public constant LAST_LEVEL = 12;
    uint8 public constant MATRIX_SIZE = 14;
    uint256 public constant BPS = 10_000;
    uint8 public constant VESTING_MONTHS = 20;
    uint256 public constant MONTH_DURATION = 30 days;

    mapping(address => User) private users;
    mapping(uint => address) public idToAddress;
    mapping(address => uint) public addressToId;
    uint public lastUserId = 2;
    uint256 public totalProjectInvestment;
    bool public partnersInitialized = false;

    address public BTCB_TOKEN_ADDRESS;
    address public owner;
    address private ROYAL_POOL_ADDRESS;
    address private TREASURY_POOL_ADDRESS;

    address public REGISTRATION_PASS_NFT_CONTRACT;
    address public ROYAL_RANK1_NFT_CONTRACT;
    address public ROYAL_RANK2_NFT_CONTRACT;
    address public ROYAL_RANK3_NFT_CONTRACT;
    address public ROYAL_RANK4_NFT_CONTRACT;

    mapping(uint8 => uint256) public levelTokenCost;

    address public LAE_COIN_ADDRESS;
    address public LIQUIDITY_POOL_ADDRESS;
    uint256 public matrixDistributionBps = 9000;
    uint256 public liquidityAllocationBps = 1000;
    uint256 public laePriceInPaymentToken = 1e12;
    uint256 public totalLiquidityCollected;
    uint256 public totalLaeAllocated;
    uint256 public totalLaeClaimed;
    uint256[20] public monthlyReleaseBps;
    uint256[20] public directRequirementByMonth;
    mapping(address => LaeRewardSchedule[]) private laeSchedules;

    event Registration(uint indexed userId, uint indexed referrerId, address indexed userAddress);
    event Reinvest(uint indexed userId, uint indexed newReferrerId, uint indexed callerId, uint8 level);
    event Upgrade(uint indexed userId, uint indexed newReferrerId, uint8 level);
    event NewUserPlace(uint indexed user, uint indexed referrer, uint8 level, uint cycle, uint8 spot);
    event Spillover(uint indexed referrerId, uint indexed receiverId, uint8 level, uint cycle, uint8 virtualSpot);
    event TreasuryPool(uint indexed refId, uint indexed userId, uint256 amount, uint8 level);
    event MissedIncome(uint indexed receiverId, uint indexed userId, uint8 level);
    event TokenReceived(uint indexed receiverId, uint indexed fromId, address indexed from, uint8 level, uint256 amount);
    event TokenTransferFailed(address indexed recipient, uint256 amount, string reason);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TokenAddressesUpdated(address indexed newToken);
    event PoolAddressesUpdated(address indexed newRoyalPool, address indexed newTreasuryPool);
    event RegistrationPassNftAddressUpdated(address indexed newAddress);
    event RoyalNftAddressesUpdated(address newRank1, address newRank2, address newRank3, address newRank4);
    event LaeCoinUpdated(address indexed laeCoin);
    event LiquidityPoolUpdated(address indexed liquidityPool);
    event SplitBpsUpdated(uint256 matrixDistributionBps, uint256 liquidityAllocationBps);
    event LaePriceUpdated(uint256 laePriceInPaymentToken);
    event LaeRewardAllocated(
        address indexed user,
        uint256 indexed scheduleIndex,
        uint256 laeAmount,
        uint256 liquidityContribution,
        uint8 level
    );
    event LaeRewardClaimed(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(
        address ownerAddress,
        address btcTokenAddress,
        address treasuryPoolAddress,
        address platformAddress,
        address registrationPassNftAddress,
        address royalRank1NftAddress,
        address royalRank2NftAddress,
        address royalRank3NftAddress,
        address royalRank4NftAddress
    ) {
        require(btcTokenAddress != address(0), "Invalid BTC address");
        require(treasuryPoolAddress != address(0), "Invalid Loyalty Pool address");
        require(platformAddress != address(0), "Invalid Platform Treasury address");
        require(registrationPassNftAddress != address(0), "Invalid Reg Pass NFT address");
        require(royalRank1NftAddress != address(0), "Invalid Rank 1 NFT address");
        require(royalRank2NftAddress != address(0), "Invalid Rank 2 NFT address");
        require(royalRank3NftAddress != address(0), "Invalid Rank 3 NFT address");
        require(royalRank4NftAddress != address(0), "Invalid Rank 4 NFT address");

        owner = ownerAddress;
        BTCB_TOKEN_ADDRESS = btcTokenAddress;
        ROYAL_POOL_ADDRESS = treasuryPoolAddress;
        TREASURY_POOL_ADDRESS = platformAddress;

        REGISTRATION_PASS_NFT_CONTRACT = registrationPassNftAddress;
        ROYAL_RANK1_NFT_CONTRACT = royalRank1NftAddress;
        ROYAL_RANK2_NFT_CONTRACT = royalRank2NftAddress;
        ROYAL_RANK3_NFT_CONTRACT = royalRank3NftAddress;
        ROYAL_RANK4_NFT_CONTRACT = royalRank4NftAddress;

        uint256 L1_COST = 1 * 10 ** 15;
        levelTokenCost[1] = L1_COST;
        for (uint8 i = 2; i <= LAST_LEVEL; i++) {
            levelTokenCost[i] = levelTokenCost[i - 1] * 2;
        }

        users[ownerAddress].id = 1;
        users[ownerAddress].referrer = address(0);
        users[ownerAddress].referrerId = 0;
        users[ownerAddress].registrationTimestamp = block.timestamp;
        idToAddress[1] = ownerAddress;
        addressToId[ownerAddress] = 1;

        for (uint8 i = 1; i <= LAST_LEVEL; i++) {
            users[ownerAddress].activeLevels[i] = true;
        }

        for (uint8 month = 0; month < VESTING_MONTHS; month++) {
            monthlyReleaseBps[month] = 500;
            directRequirementByMonth[month] = uint256(month) + 2;
        }
    }

    function registrationExt(uint referrerId) external nonReentrant {
        address referrerAddress = idToAddress[referrerId];
        require(isUserExists(referrerAddress), "Referrer does not exist");
        require(!isUserExists(msg.sender), "User exists");
        uint256 amount = levelTokenCost[1];
        require(
            IERC20(BTCB_TOKEN_ADDRESS).transferFrom(msg.sender, address(this), amount),
            "BTC transfer failed for registration"
        );
        _splitPaymentAndAllocateLae(msg.sender, 1, amount);
        totalProjectInvestment += amount;
        _registration(msg.sender, referrerAddress);
    }

    function registrationSys(uint referrerId, address userAddress) external onlyOwner nonReentrant {
        address referrerAddress = idToAddress[referrerId];
        require(isUserExists(referrerAddress), "Referrer does not exist");
        require(!isUserExists(userAddress), "User exists");
        uint256 amount = levelTokenCost[1];
        require(
            IERC20(BTCB_TOKEN_ADDRESS).transferFrom(msg.sender, address(this), amount),
            "BTC transfer failed for registration"
        );
        _splitPaymentAndAllocateLae(userAddress, 1, amount);
        totalProjectInvestment += amount;
        _registration(userAddress, referrerAddress);
    }

    function initializePartners(address partner2, address partner3) external onlyOwner {
        require(!partnersInitialized, "Partners already initialized.");
        require(!isUserExists(partner2), "Partner 2 exists.");
        require(!isUserExists(partner3), "Partner 3 exists.");
        require(partner2 != address(0) && partner3 != address(0) && partner2 != partner3, "Invalid partner addresses.");

        _registerPartner(partner2, 2);
        _registerPartner(partner3, 3);

        lastUserId = 4;
        partnersInitialized = true;
    }

    function _registerPartner(address userAddress, uint partnerId) private {
        address referrerAddress = owner;
        uint referrerId = 1;
        uint currentUserId = partnerId;

        users[userAddress].id = currentUserId;
        users[userAddress].referrer = referrerAddress;
        users[userAddress].referrerId = referrerId;
        idToAddress[currentUserId] = userAddress;
        addressToId[userAddress] = currentUserId;
        users[userAddress].activeLevels[1] = true;
        users[userAddress].registrationTimestamp = block.timestamp;

        users[referrerAddress].directReferrals.push(userAddress);
        emit Registration(currentUserId, referrerId, userAddress);

        IRegistrationPassNFT(REGISTRATION_PASS_NFT_CONTRACT).mint(userAddress, currentUserId);

        address newReferrer = _findFreeReferrer(userAddress, 1);
        require(newReferrer == owner, "Owner must be the L1 referrer for initial partners.");

        users[userAddress].xMatrix[1].currentReferrer = newReferrer;
        _processNewPlacement(userAddress, newReferrer, 1);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        require(!isUserExists(newOwner), "New owner must not be a registered user");

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
            XMatrix storage oldMatrix = oldUser.xMatrix[level];
            XMatrix storage newMatrix = newUser.xMatrix[level];
            newMatrix.currentReferrer = oldMatrix.currentReferrer;
            newMatrix.reinvestCount = oldMatrix.reinvestCount;
            newMatrix.heldTokenForUpgrade = oldMatrix.heldTokenForUpgrade;
            newMatrix.lastSpillUnderReceiverIndex = oldMatrix.lastSpillUnderReceiverIndex;
            newMatrix.totalTeamSize = oldMatrix.totalTeamSize;
            newMatrix.totalEarning = oldMatrix.totalEarning;
            newMatrix.referrals = oldMatrix.referrals;
        }

        delete users[oldOwner];
        idToAddress[1] = newOwner;
        addressToId[newOwner] = 1;
        addressToId[oldOwner] = 0;
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function updateTokenAddress(address newToken) external onlyOwner {
        require(newToken != address(0), "Invalid token address");
        BTCB_TOKEN_ADDRESS = newToken;
        emit TokenAddressesUpdated(newToken);
    }

    function updatePoolAddresses(address newRoyalPool, address newTreasuryPool) external onlyOwner {
        require(newRoyalPool != address(0), "Invalid Royal Pool address");
        require(newTreasuryPool != address(0), "Invalid Treasury Pool address");
        ROYAL_POOL_ADDRESS = newRoyalPool;
        TREASURY_POOL_ADDRESS = newTreasuryPool;
        emit PoolAddressesUpdated(newRoyalPool, newTreasuryPool);
    }

    function ChangeTitanPassNftaddress(address new1) external onlyOwner {
        REGISTRATION_PASS_NFT_CONTRACT = new1;
        emit RegistrationPassNftAddressUpdated(new1);
    }

    function ChangeRoyalNftaddresses(address new1, address new2, address new3, address new4) external onlyOwner {
        ROYAL_RANK1_NFT_CONTRACT = new1;
        ROYAL_RANK2_NFT_CONTRACT = new2;
        ROYAL_RANK3_NFT_CONTRACT = new3;
        ROYAL_RANK4_NFT_CONTRACT = new4;
        emit RoyalNftAddressesUpdated(new1, new2, new3, new4);
    }

    function setLaeCoin(address laeCoinAddress) external onlyOwner {
        require(laeCoinAddress != address(0), "Invalid LAE address");
        LAE_COIN_ADDRESS = laeCoinAddress;
        emit LaeCoinUpdated(laeCoinAddress);
    }

    function setLiquidityPool(address liquidityPoolAddress) external onlyOwner {
        require(liquidityPoolAddress != address(0), "Invalid liquidity pool");
        LIQUIDITY_POOL_ADDRESS = liquidityPoolAddress;
        emit LiquidityPoolUpdated(liquidityPoolAddress);
    }

    function setSplitBps(uint256 matrixBps, uint256 liquidityBps) external onlyOwner {
        require(matrixBps + liquidityBps == BPS, "Invalid split");
        matrixDistributionBps = matrixBps;
        liquidityAllocationBps = liquidityBps;
        emit SplitBpsUpdated(matrixBps, liquidityBps);
    }

    function setLaePriceInPaymentToken(uint256 price) external onlyOwner {
        require(price > 0, "Invalid LAE price");
        laePriceInPaymentToken = price;
        emit LaePriceUpdated(price);
    }

    function _registration(address userAddress, address referrerAddress) private {
        require(!isUserExists(userAddress), "User exists");
        uint referrerId = users[referrerAddress].id;

        uint currentUserId = lastUserId;
        users[userAddress].id = currentUserId;
        users[userAddress].referrer = referrerAddress;
        users[userAddress].referrerId = referrerId;
        idToAddress[currentUserId] = userAddress;
        addressToId[userAddress] = currentUserId;
        users[userAddress].activeLevels[1] = true;
        users[userAddress].registrationTimestamp = block.timestamp;
        lastUserId++;

        IRegistrationPassNFT(REGISTRATION_PASS_NFT_CONTRACT).mint(userAddress, currentUserId);

        if (referrerAddress == owner) {
            require(!partnersInitialized, "Owner's direct referrals are locked after initialization.");
        }
        users[referrerAddress].directReferrals.push(userAddress);
        emit Registration(currentUserId, referrerId, userAddress);

        address newReferrer = _findFreeReferrer(userAddress, 1);
        users[userAddress].xMatrix[1].currentReferrer = newReferrer;
        _processNewPlacement(userAddress, newReferrer, 1);
    }

    function _processNewPlacement(address _newUser, address _referrer, uint8 _level) private {
        XMatrix storage matrix = users[_referrer].xMatrix[_level];
        uint spotIndex = matrix.referrals.length;
        bool isOwner = _referrer == owner;
        uint256 amount = levelTokenCost[_level];
        uint referrerId = users[_referrer].id;

        require(spotIndex < MATRIX_SIZE, "LAEClub: Matrix is full, should have recycled.");

        matrix.referrals.push(_newUser);
        users[_referrer].teamSize++;
        matrix.totalTeamSize++;

        emit NewUserPlace(users[_newUser].id, referrerId, _level, (matrix.reinvestCount + 1), uint8(spotIndex + 1));

        if (spotIndex == 0) {
            if (isOwner) {
                _sendToPlatformTreasury(amount);
                return;
            }
            address uplineTarget = _findEligibleUplineTarget(_newUser, _referrer, 1, _level);
            emit Spillover(referrerId, users[uplineTarget].id, _level, (matrix.reinvestCount + 1), 15);
            _processNewPlacement(_newUser, uplineTarget, _level);
            return;
        }

        if (spotIndex == 1) {
            if (isOwner) {
                _sendToPlatformTreasury(amount);
                return;
            }
            address uplineTarget = _findEligibleUplineTarget(_newUser, _referrer, 2, _level);
            emit Spillover(referrerId, users[uplineTarget].id, _level, (matrix.reinvestCount + 1), 16);
            _processNewPlacement(_newUser, uplineTarget, _level);
            return;
        }

        bool isFirstCycle = matrix.reinvestCount == 0;
        bool isLastLevel = _level == LAST_LEVEL;

        if (spotIndex == 3) {
            if (isFirstCycle && !isLastLevel && !isOwner) {
                matrix.heldTokenForUpgrade = _matrixShare(amount);
            } else {
                _sendToRoyalPool(_referrer, _newUser, _level, amount);
            }
            return;
        }

        if (spotIndex == 4) {
            if (isFirstCycle && !isLastLevel && !isOwner) {
                matrix.heldTokenForUpgrade = 0;
                _upgradeLevel(_referrer, _level + 1);
            } else {
                _sendTokenDividends(_referrer, _newUser, _level, amount);
            }
            return;
        }

        if (spotIndex == 2 || spotIndex == 5 || spotIndex == 7 || spotIndex == 8 || spotIndex == 10 || spotIndex == 11) {
            _sendTokenDividends(_referrer, _newUser, _level, amount);
            return;
        }

        if (spotIndex == 6) {
            address downlineTarget = _findEligibleDownlineUser(_newUser, _referrer, 1, _level);
            emit Spillover(referrerId, users[downlineTarget].id, _level, (matrix.reinvestCount + 1), 17);
            if (downlineTarget == owner) {
                _sendToPlatformTreasury(amount);
            } else {
                _processNewPlacement(_newUser, downlineTarget, _level);
            }
            return;
        }
        if (spotIndex == 9) {
            address downlineTarget = _findEligibleDownlineUser(_newUser, _referrer, 1, _level);
            emit Spillover(referrerId, users[downlineTarget].id, _level, (matrix.reinvestCount + 1), 18);
            if (downlineTarget == owner) {
                _sendToPlatformTreasury(amount);
            } else {
                _processNewPlacement(_newUser, downlineTarget, _level);
            }
            return;
        }
        if (spotIndex == 12) {
            address downlineTarget = _findEligibleDownlineUser(_newUser, _referrer, 2, _level);
            emit Spillover(referrerId, users[downlineTarget].id, _level, (matrix.reinvestCount + 1), 19);
            if (downlineTarget == owner) {
                _sendToPlatformTreasury(amount);
            } else {
                _processNewPlacement(_newUser, downlineTarget, _level);
            }
            return;
        }

        if (spotIndex == 13) {
            _recycleCurrentLevel(_referrer, _level, _newUser);
            return;
        }
    }

    function _isEligibleForSelfPayment(address user) private view returns (bool) {
        if (user == owner) return true;
        return users[user].directReferrals.length >= 2;
    }

    function _upgradeLevel(address userAddress, uint8 nextLevel) private {
        users[userAddress].activeLevels[nextLevel] = true;
        address newReferrer = _findFreeReferrer(userAddress, nextLevel);
        users[userAddress].xMatrix[nextLevel].currentReferrer = newReferrer;
        _checkForRoyalCardMint(userAddress, nextLevel);
        _processNewPlacement(userAddress, newReferrer, nextLevel);
        emit Upgrade(users[userAddress].id, users[newReferrer].id, nextLevel);
    }

    function _checkForRoyalCardMint(address userAddress, uint8 level) private {
        if (level == 3) {
            IRoyaltyCardNFT(ROYAL_RANK1_NFT_CONTRACT).mint(userAddress);
        } else if (level == 6) {
            IRoyaltyCardNFT(ROYAL_RANK2_NFT_CONTRACT).mint(userAddress);
        } else if (level == 9) {
            IRoyaltyCardNFT(ROYAL_RANK3_NFT_CONTRACT).mint(userAddress);
        } else if (level == 12) {
            IRoyaltyCardNFT(ROYAL_RANK4_NFT_CONTRACT).mint(userAddress);
        }
    }

    function _recycleCurrentLevel(address userAddress, uint8 level, address caller) private {
        XMatrix storage matrix = users[userAddress].xMatrix[level];
        matrix.referrals = new address[](0);
        matrix.reinvestCount++;
        matrix.heldTokenForUpgrade = 0;
        matrix.lastSpillUnderReceiverIndex = 0;

        address freeReferrerAddress = _findFreeReferrer(userAddress, level);
        users[userAddress].xMatrix[level].currentReferrer = freeReferrerAddress;

        emit Reinvest(users[userAddress].id, users[freeReferrerAddress].id, users[caller].id, level);
        _processNewPlacement(userAddress, freeReferrerAddress, level);
    }

    function _findFreeReferrer(address userAddress, uint8 level) public view returns (address referrer) {
        uint currentReferrerId = users[userAddress].referrerId;
        while (true) {
            if (currentReferrerId == 0) return owner;
            address currentAddress = idToAddress[currentReferrerId];
            if (users[currentAddress].activeLevels[level] && users[currentAddress].xMatrix[level].referrals.length < MATRIX_SIZE) {
                return currentAddress;
            }
            currentReferrerId = users[currentAddress].referrerId;
        }
    }

    function _sendTokenDividends(address userAddress, address _from, uint8 level, uint256 amount) private {
        address receiver = userAddress;
        uint256 distributable = _matrixShare(amount);
        bool success = IERC20(BTCB_TOKEN_ADDRESS).transfer(receiver, distributable);
        if (!success) {
            emit TokenTransferFailed(receiver, distributable, "BTC transfer failed from contract balance");
            revert("LAEClub: Token transfer failed to receiver.");
        }
        users[receiver].totalIncome += distributable;
        users[receiver].xMatrix[level].totalEarning += distributable;
        emit TokenReceived(users[receiver].id, users[_from].id, _from, level, distributable);
    }

    function _sendToRoyalPool(address _ref, address _user, uint8 _level, uint256 _amount) private {
        uint256 distributable = _matrixShare(_amount);
        bool success = IERC20(BTCB_TOKEN_ADDRESS).transfer(ROYAL_POOL_ADDRESS, distributable);
        if (!success) {
            emit TokenTransferFailed(ROYAL_POOL_ADDRESS, distributable, "BTC transfer failed to Royal Pool");
            revert("LAEClub: Royal Pool transfer failed.");
        }
        emit TreasuryPool(users[_ref].id, users[_user].id, distributable, _level);
    }

    function _sendToPlatformTreasury(uint256 _amount) private {
        uint256 distributable = _matrixShare(_amount);
        bool success = IERC20(BTCB_TOKEN_ADDRESS).transfer(TREASURY_POOL_ADDRESS, distributable);
        if (!success) {
            emit TokenTransferFailed(TREASURY_POOL_ADDRESS, distributable, "BTC transfer failed to Platform Treasury");
            revert("LAEClub: Platform Treasury transfer failed.");
        }
    }

    function _matrixShare(uint256 amount) private view returns (uint256) {
        return (amount * matrixDistributionBps) / BPS;
    }

    function _splitPaymentAndAllocateLae(address userAddress, uint8 level, uint256 totalAmount) private {
        if (LAE_COIN_ADDRESS == address(0) || LIQUIDITY_POOL_ADDRESS == address(0)) {
            return;
        }

        uint256 liquidityShare = (totalAmount * liquidityAllocationBps) / BPS;
        if (liquidityShare == 0) {
            return;
        }

        require(
            IERC20(BTCB_TOKEN_ADDRESS).transfer(LIQUIDITY_POOL_ADDRESS, liquidityShare),
            "LAEClub: liquidity transfer failed"
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
        require(LAE_COIN_ADDRESS != address(0), "LAEClub: lae not set");

        LaeRewardSchedule[] storage schedules = laeSchedules[msg.sender];
        for (uint256 i = 0; i < schedules.length; i++) {
            uint256 claimable = _claimableForSchedule(msg.sender, schedules[i]);
            if (claimable == 0) {
                continue;
            }
            schedules[i].claimed += claimable;
            claimedAmount += claimable;
        }

        require(claimedAmount > 0, "LAEClub: nothing claimable");
        totalLaeClaimed += claimedAmount;
        require(ILAECoin(LAE_COIN_ADDRESS).transfer(msg.sender, claimedAmount), "LAEClub: lae transfer failed");
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

    function _findEligibleUplineTarget(address newUser, address referrer, uint uplineLevel, uint8 level) private returns (address uplineTarget) {
        address current = referrer;
        for (uint i = 0; i < uplineLevel; i++) {
            current = users[current].xMatrix[level].currentReferrer;
            if (current == address(0)) return owner;
        }
        while (true) {
            if (current == owner || current == address(0)) return owner;
            if (_isEligibleForSelfPayment(current) && users[current].xMatrix[level].referrals.length < MATRIX_SIZE) {
                return current;
            }
            emit MissedIncome(users[current].id, users[newUser].id, level);
            current = users[current].xMatrix[level].currentReferrer;
        }
    }

    function _findEligibleDownlineUser(address newUser, address referrer, uint downlineLevel, uint8 level) private returns (address) {
        if (downlineLevel == 1) {
            XMatrix storage matrix = users[referrer].xMatrix[level];
            address[] memory directs = users[referrer].directReferrals;
            if (directs.length == 0) return owner;

            uint startIdx = matrix.lastSpillUnderReceiverIndex;
            for (uint i = 0; i < directs.length; i++) {
                uint idx = (startIdx + i) % directs.length;
                address downline = directs[idx];
                if (_isEligibleForSelfPayment(downline) && users[downline].xMatrix[level].referrals.length < MATRIX_SIZE) {
                    matrix.lastSpillUnderReceiverIndex = (idx + 1) % directs.length;
                    return downline;
                }
                emit MissedIncome(users[downline].id, users[newUser].id, level);
            }
            return owner;
        }

        if (downlineLevel == 2) {
            address[] memory level1Downlines = users[referrer].directReferrals;
            if (level1Downlines.length == 0) return owner;

            for (uint i = 0; i < level1Downlines.length; i++) {
                address level2Candidate = level1Downlines[i];
                address[] memory level2Downlines = users[level2Candidate].directReferrals;
                for (uint j = 0; j < level2Downlines.length; j++) {
                    address candidate = level2Downlines[j];
                    if (_isEligibleForSelfPayment(candidate) && users[candidate].xMatrix[level].referrals.length < MATRIX_SIZE) {
                        return candidate;
                    }
                    emit MissedIncome(users[candidate].id, users[newUser].id, level);
                }
            }
        }
        return owner;
    }

    function getActiveLevelsCount(address userAddress) public view returns (uint8 count) {
        for (uint8 i = 1; i <= LAST_LEVEL; i++) {
            if (users[userAddress].activeLevels[i]) count++;
        }
    }

    function getUserDetails(uint userId) public view returns (
        address userAddress,
        address referrerAddress,
        uint referrerId,
        uint partnersCount,
        uint8 activeSlotsCount,
        uint teamSize,
        uint registrationTimestamp,
        uint256 totalIncome
    ) {
        address userAdd = idToAddress[userId];
        require(isUserExists(userAdd), "User does not exist");
        User storage user = users[userAdd];
        return (
            userAdd,
            user.referrer,
            user.referrerId,
            user.directReferrals.length,
            getActiveLevelsCount(userAdd),
            user.teamSize,
            user.registrationTimestamp,
            user.totalIncome
        );
    }

    function getDirectPartnerAddresses(uint userId) public view returns (address[] memory) {
        address userAddress = idToAddress[userId];
        require(isUserExists(userAddress), "User does not exist");
        return users[userAddress].directReferrals;
    }

    function getDirectPartnerIds(uint userId) public view returns (uint[] memory) {
        address userAddress = idToAddress[userId];
        require(isUserExists(userAddress), "User does not exist");
        address[] memory directAddresses = users[userAddress].directReferrals;
        uint[] memory directIds = new uint[](directAddresses.length);
        for (uint i = 0; i < directAddresses.length; i++) {
            directIds[i] = addressToId[directAddresses[i]];
        }
        return directIds;
    }

    function isUserExists(address user) public view returns (bool) {
        return (users[user].id != 0);
    }

    function isUserSlotActive(uint256 userId, uint8 slot) public view returns (bool) {
        address userAddress = idToAddress[userId];
        return users[userAddress].activeLevels[slot];
    }

    function usersXMatrix(address userAddress, uint8 level) public view returns (
        address currentReferrer,
        uint reinvestCount,
        uint heldTokenForUpgrade,
        uint lastSpillUnderReceiverIndex,
        uint totalTeamSize,
        uint256 totalEarning
    ) {
        return (
            users[userAddress].xMatrix[level].currentReferrer,
            users[userAddress].xMatrix[level].reinvestCount,
            users[userAddress].xMatrix[level].heldTokenForUpgrade,
            users[userAddress].xMatrix[level].lastSpillUnderReceiverIndex,
            users[userAddress].xMatrix[level].totalTeamSize,
            users[userAddress].xMatrix[level].totalEarning
        );
    }

    function usersXMatrixReferrals(address userAddress, uint8 level) public view returns (address[] memory referrals) {
        return (users[userAddress].xMatrix[level].referrals);
    }
}
