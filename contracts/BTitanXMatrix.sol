// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Standard ERC-20 Interface for the BTC Token (BEP-20)
interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

// --- NFT INTERFACES ---

// 1. Interface for the Registration Pass (requires userId as tokenId, URI managed internally)
interface IRegistrationPassNFT {
    // URI is now managed internally by the NFT contract
    function mint(address to, uint256 tokenId) external;
}

// 2. Interface for the Royalty Cards (manages tokenId and URI internally, only requires 'to' address)
interface IRoyaltyCardNFT {
    function mint(address to) external; 
}

contract BTitanXMatrix {
    
    // --- SECURITY: REENTRANCY GUARD ---
    bool private locked;
    modifier nonReentrant() {
        require(!locked, "BTitan: Reentrant call detected");
        locked = true;
        _;
        locked = false;
    }

    // --- Structs ---
    struct XMatrix {
        address currentReferrer;         // Upline user who placed this user
        address[] referrals;             // All 14 spots (index 0 to 13)
        uint reinvestCount;              // Cycle count (0 for first cycle, 1 for second, etc.)
        uint heldTokenForUpgrade;        // BTC held for spot 4 payment
        uint lastSpillUnderReceiverIndex; // Index for round-robin distribution (Spot 7 & 10)
        uint totalTeamSize;              // New: Total users ever placed in this specific matrix (across all cycles)
        uint256 totalEarning;            // New: Total BTC earned from this specific matrix (across all cycles)
    }

    struct User {
        uint id;
        address referrer;                // The user's initial referrer
        uint referrerId;                // The user's initial referrerId
        address[] directReferrals;       // List of users directly referred by this user
        uint teamSize;                   // Count of all users ever placed in this user's matrices (all levels/cycles)
        uint registrationTimestamp;      // Timestamp of initial registration
        uint256 totalIncome;             // Total BTC earned from all payouts
        mapping(uint8 => bool) activeLevels;
        mapping(uint8 => XMatrix) xMatrix; // The new 14-spot matrix
    }

    // --- Constants ---
    uint8 public constant LAST_LEVEL = 12;
    uint8 public constant MATRIX_SIZE = 14;

    // --- State Variables ---
    mapping(address => User) private users;
    mapping(uint => address) public idToAddress;
    mapping(address => uint) public addressToId;
    uint public lastUserId = 2; // Starts at 2 because Owner is 1
    uint256 public totalProjectInvestment;
    bool public partnersInitialized = false; // New state to lock Owner's direct referrals
    
    address public BTCB_TOKEN_ADDRESS; 
    address public owner;
    address private ROYAL_POOL_ADDRESS;
    address private TREASURY_POOL_ADDRESS;
    
    // NFT Contract Addresses
    address public REGISTRATION_PASS_NFT_CONTRACT;
    address public ROYAL_RANK1_NFT_CONTRACT; // Level 3 unlock
    address public ROYAL_RANK2_NFT_CONTRACT; // Level 6 unlock
    address public ROYAL_RANK3_NFT_CONTRACT; // Level 9 unlock
    address public ROYAL_RANK4_NFT_CONTRACT; // Level 12 unlock
    
    mapping(uint8 => uint256) public levelTokenCost;
    
    // --- Events ---
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


    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // --- Constructor ---
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

        // Set Wallet Addresses
        owner = ownerAddress;
        BTCB_TOKEN_ADDRESS = btcTokenAddress;
        ROYAL_POOL_ADDRESS = treasuryPoolAddress;
        TREASURY_POOL_ADDRESS = platformAddress;

        // Set NFT Contract Addresses
        REGISTRATION_PASS_NFT_CONTRACT = registrationPassNftAddress;
        ROYAL_RANK1_NFT_CONTRACT = royalRank1NftAddress;
        ROYAL_RANK2_NFT_CONTRACT = royalRank2NftAddress;
        ROYAL_RANK3_NFT_CONTRACT = royalRank3NftAddress;
        ROYAL_RANK4_NFT_CONTRACT = royalRank4NftAddress;
        
        // Level Costs Setup
        uint256 L1_COST = 1 * 10**15; // 0.001 BTC (Assuming 18 decimals for BTC)
        levelTokenCost[1] = L1_COST;

        for (uint8 i = 2; i <= LAST_LEVEL; i++) {
            levelTokenCost[i] = levelTokenCost[i-1] * 2;
        }
        
        // Owner setup (ID 1)
        users[ownerAddress].id = 1;
        users[ownerAddress].referrer = address(0);
        users[ownerAddress].referrerId = 0;
        users[ownerAddress].registrationTimestamp = block.timestamp;
        idToAddress[1] = ownerAddress;
        addressToId[ownerAddress] = 1; // Populate new mapping for owner
        
        // Owner has all levels active by default
        for (uint8 i = 1; i <= LAST_LEVEL; i++) {
            users[ownerAddress].activeLevels[i] = true;
        }
    }
    
    // --- PUBLIC FUNCTIONS ---

    // External registration function for public - protected against reentrancy
    function registrationExt(uint referrerId) external nonReentrant {
        address referrerAddress = idToAddress[referrerId];
        require(isUserExists(referrerAddress), "Referrer does not exist");

        // 1. Check: Pull BTC tokens from the user (payment = Registration Fee)
        require(IERC20(BTCB_TOKEN_ADDRESS).transferFrom(msg.sender, address(this), levelTokenCost[1]), "BTC transfer failed for registration");
        
        _registration(msg.sender, referrerAddress);
    }

    // External registration function for owner
    function registrationSys(uint referrerId, address userAddress) external onlyOwner {
        address referrerAddress = idToAddress[referrerId];
        require(isUserExists(referrerAddress), "Referrer does not exist");

        // 1. Check: Pull BTC tokens from the user (payment = Registration Fee)
        require(IERC20(BTCB_TOKEN_ADDRESS).transferFrom(msg.sender, address(this), levelTokenCost[1]), "BTC transfer failed for registration");
        
        _registration(userAddress, referrerAddress);
    }

    // Function to initialize partners (ID 2 and ID 3) and lock the Owner's direct referral slot
    function initializePartners(address partner2, address partner3) external onlyOwner {
        require(!partnersInitialized, "Partners already initialized.");
        require(!isUserExists(partner2), "Partner 2 exists.");
        require(!isUserExists(partner3), "Partner 3 exists.");
        require(partner2 != address(0) && partner3 != address(0) && partner2 != partner3, "Invalid partner addresses.");

        // Register Partner 2 (ID 2)
        _registerPartner(partner2, 2);
        
        // Register Partner 3 (ID 3)
        _registerPartner(partner3, 3);
        
        // Finalize state
        lastUserId = 4; // Next regular user ID will be 4
        partnersInitialized = true;
    }

    // Helper function for partner registration (no token transfer, only state/placement)
    function _registerPartner(address userAddress, uint partnerId) private {
        // ID 1 (Owner) is the initial referrer for both
        address referrerAddress = owner;
        uint referrerId = 1;
        uint currentUserId = partnerId;

        // 1. Effects (State Changes)
        users[userAddress].id = currentUserId;
        users[userAddress].referrer = referrerAddress;
        users[userAddress].referrerId = referrerId;
        idToAddress[currentUserId] = userAddress;
        addressToId[userAddress] = currentUserId;
        users[userAddress].activeLevels[1] = true; // Activate L1
        users[userAddress].registrationTimestamp = block.timestamp; 

        // Add new user to initial referrer's direct referrals list (ID 1's list)
        users[referrerAddress].directReferrals.push(userAddress);
        emit Registration(currentUserId, referrerId, userAddress);

        // 2. NFT Minting (Registration Pass)
        IRegistrationPassNFT(REGISTRATION_PASS_NFT_CONTRACT).mint(userAddress, currentUserId);

        // 3. Placement (Owner's matrix receives the placement)
        // Find the owner's matrix (ID 1)
        address newReferrer = _findFreeReferrer(userAddress, 1);
        
        // Owner should be the L1 referrer for initial partners
        require(newReferrer == owner, "Owner must be the L1 referrer for initial partners.");
        
        users[userAddress].xMatrix[1].currentReferrer = newReferrer; 
        _processNewPlacement(userAddress, newReferrer, 1);
    }


    // Transfer ownership (Migrates the entire ID 1 user data to the new owner)
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        // REQUIREMENT 1: New owner must not be a registered user
        require(!isUserExists(newOwner), "New owner must not be a registered user");
        
        address oldOwner = owner;

        // --- MIGRATION START: Copying oldOwner's User data to newOwner ---
        // This is necessary because structs with nested mappings/arrays cannot be copied directly in storage.
        User storage oldUser = users[oldOwner];
        User storage newUser = users[newOwner];

        // 1. Copy simple storage variables (no mappings/arrays)
        newUser.id = oldUser.id; // Should be 1
        newUser.referrer = oldUser.referrer;
        newUser.referrerId = oldUser.referrerId;
        newUser.teamSize = oldUser.teamSize;
        newUser.registrationTimestamp = oldUser.registrationTimestamp;
        newUser.totalIncome = oldUser.totalIncome;

        // 2. Copy dynamic array: directReferrals
        newUser.directReferrals = oldUser.directReferrals;

        // 3. Copy nested mappings (activeLevels and xMatrix)
        for (uint8 level = 1; level <= LAST_LEVEL; level++) {
            // Copy activeLevels mapping entry
            newUser.activeLevels[level] = oldUser.activeLevels[level];

            // Copy XMatrix struct for the level (which contains an array: referrals)
            XMatrix storage oldMatrix = oldUser.xMatrix[level];
            XMatrix storage newMatrix = newUser.xMatrix[level];

            // Copy simple matrix fields
            newMatrix.currentReferrer = oldMatrix.currentReferrer;
            newMatrix.reinvestCount = oldMatrix.reinvestCount;
            newMatrix.heldTokenForUpgrade = oldMatrix.heldTokenForUpgrade;
            newMatrix.lastSpillUnderReceiverIndex = oldMatrix.lastSpillUnderReceiverIndex;
            newMatrix.totalTeamSize = oldMatrix.totalTeamSize;
            newMatrix.totalEarning = oldMatrix.totalEarning;

            // Copy dynamic array: referrals
            newMatrix.referrals = oldMatrix.referrals;
        }

        // --- MIGRATION END ---
        
        // Clear the old owner's data. 
        delete users[oldOwner]; 
        
        // Update all global mappings to reflect the new address for ID 1
        idToAddress[1] = newOwner;
        addressToId[newOwner] = 1; 
        addressToId[oldOwner] = 0; // Clear old addressToId mapping
        
        // Update the owner state variable
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // Update BTC Token address
    function updateTokenAddress(address newToken) external onlyOwner {
        require(newToken != address(0), "Invalid token address");

        BTCB_TOKEN_ADDRESS = newToken;

        emit TokenAddressesUpdated(newToken);
    }

    // Update Royal Pool and Treasury Pool addresses
    function updatePoolAddresses(address newRoyalPool, address newTreasuryPool) external onlyOwner {
        require(newRoyalPool != address(0), "Invalid Royal Pool address");
        require(newTreasuryPool != address(0), "Invalid Treasury Pool address");

        ROYAL_POOL_ADDRESS = newRoyalPool;
        TREASURY_POOL_ADDRESS = newTreasuryPool;

        emit PoolAddressesUpdated(newRoyalPool, newTreasuryPool);
    }

    // Update Registration Pass NFT address
    function ChangeTitanPassNftaddress(address new1) external onlyOwner{
        REGISTRATION_PASS_NFT_CONTRACT = new1;
        emit RegistrationPassNftAddressUpdated(new1);
    }

    // Update Royal Card NFT addresses
    function ChangeRoyalNftaddresses(address new1, address new2, address new3, address new4) external onlyOwner{
        ROYAL_RANK1_NFT_CONTRACT = new1; 
        ROYAL_RANK2_NFT_CONTRACT = new2;
        ROYAL_RANK3_NFT_CONTRACT = new3;
        ROYAL_RANK4_NFT_CONTRACT = new4;
        emit RoyalNftAddressesUpdated(new1, new2, new3, new4);
    }
    
    // --- CORE LOGIC FUNCTIONS ---
    
    // Internal function handles the core registration logic
    function _registration(address userAddress, address referrerAddress) private {
        // Track total investment
        uint256 cost = levelTokenCost[1];
        totalProjectInvestment += cost;

        require(!isUserExists(userAddress), "User exists");
        uint referrerId = users[referrerAddress].id;
        
        // 2. Effects (State Changes)
        uint currentUserId = lastUserId;
        users[userAddress].id = currentUserId;
        users[userAddress].referrer = referrerAddress;
        users[userAddress].referrerId = referrerId;
        idToAddress[currentUserId] = userAddress;
        addressToId[userAddress] = currentUserId; // Populate new mapping for new user
        users[userAddress].activeLevels[1] = true;
        users[userAddress].registrationTimestamp = block.timestamp; 
        lastUserId++;
        
        // 3. NFT Minting (Registration Pass)
        IRegistrationPassNFT(REGISTRATION_PASS_NFT_CONTRACT).mint(userAddress, currentUserId);

        // Add new user to initial referrer's direct referrals list
        // CRITICAL GUARD: Lock the owner's direct referral slot after initialization
        if (referrerAddress == owner) {
            require(!partnersInitialized, "Owner's direct referrals are locked after initialization.");
        }
        users[referrerAddress].directReferrals.push(userAddress);
        emit Registration(currentUserId, referrerId, userAddress);

        // 4. Interaction: Find a new referrer and process placement
        address newReferrer = _findFreeReferrer(userAddress, 1);
        
        // Set the physical upline (currentReferrer) here, before placement begins
        users[userAddress].xMatrix[1].currentReferrer = newReferrer; 

        _processNewPlacement(userAddress, newReferrer, 1);
    }

    // The single, core function for all matrix placements and payouts
    function _processNewPlacement(address _newUser, address _referrer, uint8 _level) private {
        
        XMatrix storage matrix = users[_referrer].xMatrix[_level];
        uint spotIndex = matrix.referrals.length; // Index 0 (Spot 1) to 13 (Spot 14)
        bool isOwner = _referrer == owner;
        uint256 amount = levelTokenCost[_level];
        
        // Get the ID of the user whose matrix is receiving the placement (the referrer for this call)
        uint referrerId = users[_referrer].id;
        
        require(spotIndex < MATRIX_SIZE, "BTitan: Matrix is full, should have recycled.");

        // --- 2. Physical Placement (For all spots Index 0 to 13) ---
        matrix.referrals.push(_newUser);
        
        // Increment the team size of the user who received the physical placement
        users[_referrer].teamSize++; 
        // New: Increment total team size for this matrix level
        matrix.totalTeamSize++;

        emit NewUserPlace(users[_newUser].id, referrerId, _level, (matrix.reinvestCount + 1), uint8(spotIndex + 1));
        
        // --- 1. Upline Spill Logic (Spots 1, 2 | Index 0, 1) ---
        if (spotIndex == 0) { // Spot 1: 1st Upline 
            if (isOwner) {
                _sendToPlatformTreasury(amount);
                return;
            }
            address uplineTarget = _findEligibleUplineTarget(_newUser, _referrer, 1, _level); 
            emit Spillover(referrerId, users[uplineTarget].id, _level, (matrix.reinvestCount + 1), 15);
            _processNewPlacement(_newUser, uplineTarget, _level);
            return;
        }

        if (spotIndex == 1) { // Spot 2: 2nd Upline
            if (isOwner) {
                _sendToPlatformTreasury(amount);
                return;
            }
            address uplineTarget = _findEligibleUplineTarget(_newUser, _referrer, 2, _level); 
            emit Spillover(referrerId, users[uplineTarget].id, _level, (matrix.reinvestCount + 1), 16);
            _processNewPlacement(_newUser, uplineTarget, _level);
            return;
        }
        
        // Define flags after the spill logic is resolved
        bool isFirstCycle = matrix.reinvestCount == 0;
        bool isLastLevel = _level == LAST_LEVEL;

        // --- 3. Action based on Spot (Index 2 to 13) ---

        // Spot 4 (Index 3)
        if (spotIndex == 3) { 
            if (isFirstCycle && !isLastLevel && !isOwner) {
                matrix.heldTokenForUpgrade = amount;
            } else {
                _sendToRoyalPool(_referrer, _newUser, _level, amount);
            }
            return;
        }

        // Spot 5 (Index 4)
        if (spotIndex == 4) { 
            if (isFirstCycle && !isLastLevel && !isOwner) {
                matrix.heldTokenForUpgrade = 0; // Clear hold
                _upgradeLevel(_referrer, _level + 1);
            } else {
                _sendTokenDividends(_referrer, _newUser, _level, amount);
            }
            return;
        }

        // Payout to User Itself (Spots 3, 6, 8, 9, 11, 12 | Index 2, 5, 7, 8, 10, 11)
        if (spotIndex == 2 || spotIndex == 5 || spotIndex == 7 || spotIndex == 8 || spotIndex == 10 || spotIndex == 11) {
            _sendTokenDividends(_referrer, _newUser, _level, amount);
            return;
        }

        // Spill Under (Spots 7, 10, 13 | Index 6, 9, 12)
        if (spotIndex == 6) { // Spot 7: 1st Downline 
            address downlineTarget = _findEligibleDownlineUser(_newUser, _referrer, 1, _level);
            emit Spillover(referrerId, users[downlineTarget].id, _level, (matrix.reinvestCount + 1), 17);
            if (downlineTarget == owner) {
                _sendToPlatformTreasury(amount);
            } else {
                _processNewPlacement(_newUser, downlineTarget, _level);
            }
            return;
        }
        if (spotIndex == 9) { // Spot 10: 1st Downline
            address downlineTarget = _findEligibleDownlineUser(_newUser, _referrer, 1, _level);
            emit Spillover(referrerId, users[downlineTarget].id, _level, (matrix.reinvestCount + 1), 18);
            if (downlineTarget == owner) {
                _sendToPlatformTreasury(amount);
            } else {
                _processNewPlacement(_newUser, downlineTarget, _level);
            }
            return;
        }
        if (spotIndex == 12) { // Spot 13: 2nd Downline
            address downlineTarget = _findEligibleDownlineUser(_newUser, _referrer, 2, _level);
            emit Spillover(referrerId, users[downlineTarget].id, _level, (matrix.reinvestCount + 1), 19);
            if (downlineTarget == owner) {
                _sendToPlatformTreasury(amount);
            } else {
                _processNewPlacement(_newUser, downlineTarget, _level);
            }
            return;
        }
        
        // Recycle (Spot 14 | Index 13)
        if (spotIndex == 13) {
            _recycleCurrentLevel(_referrer, _level, _newUser);
            return;
        }
    }
    
    // --- HELPER LOGIC FUNCTIONS ---

    // Checks if a user is eligible to receive self-payments (2 directs or is the owner)
    function _isEligibleForSelfPayment(address user) private view returns (bool) {
        if (user == owner) {
            return true;
        }
        return users[user].directReferrals.length >= 2;
    }

    // Handles level activation, Royalty Card check, and placement in the new matrix
    function _upgradeLevel(address userAddress, uint8 nextLevel) private {
        users[userAddress].activeLevels[nextLevel] = true;
        
        address newReferrer = _findFreeReferrer(userAddress, nextLevel);
        users[userAddress].xMatrix[nextLevel].currentReferrer = newReferrer;
        
        _checkForRoyalCardMint(userAddress, nextLevel);
        _processNewPlacement(userAddress, newReferrer, nextLevel); 
        
        emit Upgrade(users[userAddress].id, users[newReferrer].id, nextLevel);
    }
    
    // Mints Royalty Card NFTs based on the achieved level (rank)
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

    // Logic for the Recycle/Reinvest (Spot 14)
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
    
    // Finds the next available spot in the matrix chain, falls back to owner
    function _findFreeReferrer(address userAddress, uint8 level) public view returns(address referrer) {
        uint currentReferrerId = users[userAddress].referrerId;
        
        while (true) {
            if (currentReferrerId == 0) {
                // Should only happen if userAddress is the owner (ID 1), 
                // but if we somehow lose the chain, fall back to the current owner address.
                return owner; 
            }
            
            address currentAddress = idToAddress[currentReferrerId];

            if (users[currentAddress].activeLevels[level] && users[currentAddress].xMatrix[level].referrals.length < MATRIX_SIZE) {
                return currentAddress;
            }

            // Move up the chain using the referrerId of the current upline user
            currentReferrerId = users[currentAddress].referrerId;
        }
    }

    // Transfers the token payment from the contract's balance and emits an event
    // State changes moved AFTER external transfer (C-E-I Pattern)
    function _sendTokenDividends(address userAddress, address _from, uint8 level, uint256 amount) private {
        address receiver = userAddress;

        // 1. Interaction: Perform the external token transfer first
        bool success = IERC20(BTCB_TOKEN_ADDRESS).transfer(receiver, amount);
        
        // 2. Check: Revert if transfer failed
        if (!success) {
            emit TokenTransferFailed(receiver, amount, "BTC transfer failed from contract balance");
            revert("BTitan: Token transfer failed to receiver.");
        }
        
        // 3. Effects: Update state only after successful transfer
        users[receiver].totalIncome += amount;
        users[receiver].xMatrix[level].totalEarning += amount;

        emit TokenReceived(users[receiver].id, users[_from].id, _from, level, amount); 
    }

    // Sends payment to the Royal Pool
    function _sendToRoyalPool(address _ref, address _user, uint8 _level, uint256 _amount) private {
        bool success = IERC20(BTCB_TOKEN_ADDRESS).transfer(ROYAL_POOL_ADDRESS, _amount);
        if (!success) {
            emit TokenTransferFailed(ROYAL_POOL_ADDRESS, _amount, "BTC transfer failed to Royal Pool");
            revert("BTitan: Royal Pool transfer failed.");
        }
        emit TreasuryPool(users[_ref].id, users[_user].id, _amount, _level);
    }
    
    // Sends payment to the Platform Treasury
    function _sendToPlatformTreasury(uint256 _amount) private {
        bool success = IERC20(BTCB_TOKEN_ADDRESS).transfer(TREASURY_POOL_ADDRESS, _amount);
        if (!success) {
            emit TokenTransferFailed(TREASURY_POOL_ADDRESS, _amount, "BTC transfer failed to Platform Treasury");
            revert("BTitan: Platform Treasury transfer failed.");
        }
    }


    // --- COMPLEX SPILL LOGIC ---

    // Finds the Nth upline, then searches upwards for the first eligible/available matrix.
    function _findEligibleUplineTarget(address newUser, address referrer, uint uplineLevel, uint8 level) private returns (address uplineTarget) {
        address current = referrer;
        for (uint i = 0; i < uplineLevel; i++) { 
            current = users[current].xMatrix[level].currentReferrer; 
            if (current == address(0)) {
                return owner; 
            }
        }
        
        while (true) {
            if (current == owner || current == address(0)) { 
                return owner;
            }
            if (_isEligibleForSelfPayment(current) && users[current].xMatrix[level].referrals.length < MATRIX_SIZE) { 
                return current;
            }
            emit MissedIncome(users[current].id, users[newUser].id, level);
            current = users[current].xMatrix[level].currentReferrer;
        }
    }

    // Finds an eligible downline user at the specified depth, using round-robin for the 1st level
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

    // --- VIEW FUNCTIONS ---

    function getActiveLevelsCount(address userAddress) public view returns (uint8 count) {
        for (uint8 i = 1; i <= LAST_LEVEL; i++) {
            if (users[userAddress].activeLevels[i]) {
                count++;
            }
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
    
    function usersXMatrix(address userAddress, uint8 level) public view returns(
        address currentReferrer, 
        uint reinvestCount, 
        uint heldTokenForUpgrade, 
        uint lastSpillUnderReceiverIndex,
        uint totalTeamSize, 
        uint256 totalEarning
    ) {
        return (users[userAddress].xMatrix[level].currentReferrer,
                users[userAddress].xMatrix[level].reinvestCount,
                users[userAddress].xMatrix[level].heldTokenForUpgrade,
                users[userAddress].xMatrix[level].lastSpillUnderReceiverIndex,
                users[userAddress].xMatrix[level].totalTeamSize,
                users[userAddress].xMatrix[level].totalEarning);
    }

    function usersXMatrixReferrals(address userAddress, uint8 level) public view returns(
        address[] memory referrals
    ) {
        return (users[userAddress].xMatrix[level].referrals);
    }
}
