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
    uint8 public constant LAST_LEVEL = 12;
    uint8 public constant MATRIX_SIZE = 14;
    uint256 public constant BPS = 10_000;
    uint8 public constant VESTING_MONTHS = 20;
    uint256 public constant MONTH_DURATION = 30 days;

    struct XMatrix {
        address currentReferrer;
        address[] referrals;
        uint256 reinvestCount;
        uint256 heldTokenForUpgrade;
        uint256 lastSpillUnderReceiverIndex;
        uint256 totalTeamSize;
        uint256 totalEarning;
    }

    struct User {
        uint256 id;
        address referrer;
        uint256 referrerId;
        address[] directReferrals;
        uint256 teamSize;
        uint256 registrationTimestamp;
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

    address public owner;
    address public BTCB_TOKEN_ADDRESS;
    address public ROYAL_POOL_ADDRESS;
    address public TREASURY_POOL_ADDRESS;

    address public REGISTRATION_PASS_NFT_CONTRACT;
    address public ROYAL_RANK1_NFT_CONTRACT;
    address public ROYAL_RANK2_NFT_CONTRACT;
    address public ROYAL_RANK3_NFT_CONTRACT;
    address public ROYAL_RANK4_NFT_CONTRACT;

    mapping(address => User) private users;
    mapping(uint256 => address) public idToAddress;
    mapping(address => uint256) public addressToId;
    mapping(uint8 => uint256) public levelTokenCost;

    uint256 public lastUserId = 2;
    bool public partnersInitialized;
    uint256 public totalProjectInvestment;

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

    bool private entered;

    event Registration(uint256 indexed userId, uint256 indexed referrerId, address indexed userAddress);
    event TokenReceived(uint256 indexed receiverId, uint256 indexed fromId, address indexed from, uint8 level, uint256 amount);
    event TreasuryPool(uint256 indexed refId, uint256 indexed userId, uint256 amount, uint8 level);
    event NewUserPlace(uint256 indexed user, uint256 indexed referrer, uint8 level, uint256 cycle, uint8 spot);
    event Spillover(uint256 indexed referrerId, uint256 indexed receiverId, uint8 level, uint256 cycle, uint8 virtualSpot);
    event Reinvest(uint256 indexed userId, uint256 indexed newReferrerId, uint256 indexed callerId, uint8 level);
    event Upgrade(uint256 indexed userId, uint256 indexed newReferrerId, uint8 level);
    event MissedIncome(uint256 indexed receiverId, uint256 indexed userId, uint8 level);
    event TokenTransferFailed(address indexed recipient, uint256 amount, string reason);
    event PoolAddressesUpdated(address indexed newRoyalPool, address indexed newTreasuryPool);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TokenAddressesUpdated(address indexed newToken);
    event RegistrationPassNftAddressUpdated(address indexed newAddress);
    event RoyalNftAddressesUpdated(address newRank1, address newRank2, address newRank3, address newRank4);
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

        for (uint8 month = 0; month < VESTING_MONTHS; month++) {
            monthlyReleaseBps[month] = 500;
            directRequirementByMonth[month] = month + 2;
        }
    }

    function registrationExt(uint256 referrerId) external nonReentrant {
        address referrerAddress = idToAddress[referrerId];
        require(isUserExists(referrerAddress), "LAEClubMatrix: invalid referrer");
        require(!isUserExists(msg.sender), "LAEClubMatrix: user exists");

        uint256 amount = levelTokenCost[1];
        require(IERC20(BTCB_TOKEN_ADDRESS).transferFrom(msg.sender, address(this), amount), "BTC transfer failed for registration");

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
        require(IERC20(BTCB_TOKEN_ADDRESS).transferFrom(msg.sender, address(this), amount), "BTC transfer failed for registration");

        _splitPaymentAndAllocateLae(userAddress, 1, amount);
        totalProjectInvestment += amount;
        _registration(userAddress, referrerAddress);
    }

    function initializePartners(address partner2, address partner3) external onlyOwner {
        require(!partnersInitialized, "LAEClubMatrix: already initialized");
        require(partner2 != address(0) && partner3 != address(0), "LAEClubMatrix: zero partner");
        require(!isUserExists(partner2) && !isUserExists(partner3), "LAEClubMatrix: partner exists");

        _registerPartner(partner2, 2);
        _registerPartner(partner3, 3);
        lastUserId = 4;
        partnersInitialized = true;
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
        }

        delete users[oldOwner];
        idToAddress[1] = newOwner;
        addressToId[oldOwner] = 0;
        addressToId[newOwner] = 1;
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

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

        if (REGISTRATION_PASS_NFT_CONTRACT != address(0)) {
            IRegistrationPassNFT(REGISTRATION_PASS_NFT_CONTRACT).mint(userAddress, currentUserId);
        }

        if (referrerAddress == owner) {
            require(!partnersInitialized, "LAEClubMatrix: owner locked");
        }

        users[referrerAddress].directReferrals.push(userAddress);
        emit Registration(currentUserId, referrerId, userAddress);

        address freeReferrer = _findFreeReferrer(userAddress, 1);
        users[userAddress].xMatrix[1].currentReferrer = freeReferrer;
        _processNewPlacement(userAddress, freeReferrer, 1);
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

        if (REGISTRATION_PASS_NFT_CONTRACT != address(0)) {
            IRegistrationPassNFT(REGISTRATION_PASS_NFT_CONTRACT).mint(userAddress, partnerId);
        }

        address freeReferrer = _findFreeReferrer(userAddress, 1);
        require(freeReferrer == owner, "Owner must be the L1 referrer for initial partners.");
        users[userAddress].xMatrix[1].currentReferrer = freeReferrer;
        _processNewPlacement(userAddress, freeReferrer, 1);
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

        if (spotIndex == 3) {
            if (isFirstCycle && !isLastLevel && !isOwnerRef) {
                matrix.heldTokenForUpgrade = amount;
            } else {
                _sendToRoyalPool(referrer, newUser, level, amount);
            }
            return;
        }

        if (spotIndex == 4) {
            if (isFirstCycle && !isLastLevel && !isOwnerRef) {
                matrix.heldTokenForUpgrade = 0;
                _upgradeLevel(referrer, level + 1);
            } else {
                _sendTokenDividends(referrer, newUser, level, amount);
            }
            return;
        }

        if (spotIndex == 2 || spotIndex == 5 || spotIndex == 7 || spotIndex == 8 || spotIndex == 10 || spotIndex == 11) {
            _sendTokenDividends(referrer, newUser, level, amount);
            return;
        }

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

        if (spotIndex == 13) {
            _recycleCurrentLevel(referrer, level, newUser);
        }
    }

    function _upgradeLevel(address userAddress, uint8 nextLevel) private {
        users[userAddress].activeLevels[nextLevel] = true;
        address freeReferrer = _findFreeReferrer(userAddress, nextLevel);
        users[userAddress].xMatrix[nextLevel].currentReferrer = freeReferrer;
        _checkRoyalCardMint(userAddress, nextLevel);
        _processNewPlacement(userAddress, freeReferrer, nextLevel);
        emit Upgrade(users[userAddress].id, users[freeReferrer].id, nextLevel);
    }

    function _checkRoyalCardMint(address userAddress, uint8 level) private {
        if (level == 3 && ROYAL_RANK1_NFT_CONTRACT != address(0)) {
            IRoyaltyCardNFT(ROYAL_RANK1_NFT_CONTRACT).mint(userAddress);
        } else if (level == 6 && ROYAL_RANK2_NFT_CONTRACT != address(0)) {
            IRoyaltyCardNFT(ROYAL_RANK2_NFT_CONTRACT).mint(userAddress);
        } else if (level == 9 && ROYAL_RANK3_NFT_CONTRACT != address(0)) {
            IRoyaltyCardNFT(ROYAL_RANK3_NFT_CONTRACT).mint(userAddress);
        } else if (level == 12 && ROYAL_RANK4_NFT_CONTRACT != address(0)) {
            IRoyaltyCardNFT(ROYAL_RANK4_NFT_CONTRACT).mint(userAddress);
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

    function _sendTokenDividends(address receiver, address from, uint8 level, uint256 amount) private {
        uint256 distributable = _matrixShare(amount);
        bool success = IERC20(BTCB_TOKEN_ADDRESS).transfer(receiver, distributable);
        if (!success) {
            emit TokenTransferFailed(receiver, distributable, "BTC transfer failed from contract balance");
            revert("BTitan: Token transfer failed to receiver.");
        }
        users[receiver].totalIncome += distributable;
        users[receiver].xMatrix[level].totalEarning += distributable;
        emit TokenReceived(users[receiver].id, users[from].id, from, level, distributable);
    }

    function _sendToRoyalPool(address referrer, address userAddress, uint8 level, uint256 amount) private {
        uint256 distributable = _matrixShare(amount);
        bool success = IERC20(BTCB_TOKEN_ADDRESS).transfer(ROYAL_POOL_ADDRESS, distributable);
        if (!success) {
            emit TokenTransferFailed(ROYAL_POOL_ADDRESS, distributable, "BTC transfer failed to Royal Pool");
            revert("BTitan: Royal Pool transfer failed.");
        }
        emit TreasuryPool(users[referrer].id, users[userAddress].id, distributable, level);
    }

    function _sendToPlatformTreasury(uint256 amount) private {
        uint256 distributable = _matrixShare(amount);
        bool success = IERC20(BTCB_TOKEN_ADDRESS).transfer(TREASURY_POOL_ADDRESS, distributable);
        if (!success) {
            emit TokenTransferFailed(TREASURY_POOL_ADDRESS, distributable, "BTC transfer failed to Platform Treasury");
            revert("BTitan: Platform Treasury transfer failed.");
        }
    }

    function _matrixShare(uint256 amount) private view returns (uint256) {
        return (amount * matrixDistributionBps) / BPS;
    }

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

    function usersXMatrixReferrals(address userAddress, uint8 level) external view returns (address[] memory) {
        return users[userAddress].xMatrix[level].referrals;
    }
}
