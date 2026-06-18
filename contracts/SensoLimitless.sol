// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./SLTToken.sol";

/**
 * @title SensoLimitless — on-chain Club + Pilot matrix protocol
 * @dev Remix: Compiler 0.8.20 | Optimization 200 | Enable via IR ON
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ISensoSpin {
    function creditCoupons(address user, uint256 count) external;
}

contract SensoLimitless {
    error ZeroAddress();
    error NotRoot();
    error PausedErr();
    error NotActivated();
    error NotRegistered();
    error ReentrancyErr();
    error Insolvent();
    error SpinUnset();
    error SpinSet();
    error NotMinter();
    error DuplicateWithdraw();
    error InsufficientBalance();
    error MatrixFull();
    error SlotTaken();
    error BadCycle();
    error DuplicateCycle();
    error UpgradeUnderfunded();

    enum MatrixType {
        CLUB,
        PILOT
    }

    enum IncomeType {
        DIRECT,
        CYCLE,
        REBIRTH,
        UPGRADE,
        PILOT_INCENTIVE,
        SPONSOR_PAYMENT,
        FIRST_LINE_BONUS,
        TOKEN_WELCOME,
        TOKEN_DIRECT,
        WITHDRAW
    }

    enum ActionKind {
        CLUB_PLACE,
        CLUB_CYCLE,
        PILOT_PLACE,
        PILOT_CYCLE,
        FIRST_LINE_BONUS
    }

    struct User {
        address sponsor;
        bool registered;
        uint64 registeredAt;
    }

    struct PackageState {
        bool owned;
        bool isManual;
        uint32 cyclesCompleted;
    }

    struct ClubMatrix {
        address owner;
        uint8 level;
        uint8 slotsFilled;
        bool active;
        bool cycleCompleted;
        bool isRebirth;
        uint256 parentMatrixId;
        uint32 cycleNumber;
        uint64 createdAt;
    }

    struct PilotMatrix {
        address owner;
        uint8 level;
        uint8 slotsFilled;
        bool active;
        bool cycleCompleted;
        bool isRebirth;
        uint256 parentMatrixId;
        uint32 cycleNumber;
        uint64 createdAt;
    }

    struct PendingAction {
        ActionKind kind;
        address user;
        address sponsor;
        uint8 level;
        uint256 matrixId;
        MatrixType matrixType;
    }

    struct BfsCursor {
        bool initialized;
        bool sponsorChecked;
        uint256 queueHead;
    }

    uint256 public constant CLUB_LEVELS = 12;
    uint256 public constant PILOT_LEVELS = 8;
    uint256 public constant CLUB_SLOTS = 4;
    uint256 public constant PILOT_SLOTS = 2;
    uint256 public constant CYCLE_MULTIPLIER = 3;
    uint256 public constant CLUB_WITHDRAW_NUM = 2;
    uint256 public constant CLUB_WITHDRAW_DEN = 3;
    uint256 public constant CLUB_REINVEST_DEN = 3;
    uint256 public constant PILOT_INCENTIVE = 1 ether;
    uint256 public constant DIRECT_REFERRALS_FOR_FIRST_LINE = 4;
    uint256 public constant QUALIFIED_REFERRAL_PACKAGE = 4;
    uint256 public constant SPIN_COUPONS_PER_QUALIFIED = 5;
    uint256 public constant BFS_NODES_PER_STEP = 32;
    uint256 public constant MAX_SPONSOR_BPS = 500;

    uint256[12] public clubAmounts;
    uint256[8] public pilotAmounts;
    uint256[8] public pilotPoolAmounts;
    uint256[12] public clubSltWelcome;
    uint256[12] public clubSltDirect;
    uint256[8] public pilotSltWelcome;
    uint256[8] public pilotSltDirect;

    IERC20 public immutable dai;
    SLTToken public immutable slt;
    address public immutable rootSponsor;

    address public treasury;
    address public incentivePool;
    address public spinContract;
    bool public paused;
    bool public activated;
    uint256 private _locked;

    uint256 public totalDaiLiabilities;

    bool public sponsorPaymentsEnabled;
    uint16 public clubSponsorBps;
    uint16 public pilotSponsorBps;

    mapping(address => User) public users;
    mapping(address => address[]) public directReferrals;
    mapping(address => mapping(uint8 => PackageState)) public clubPackages;
    mapping(address => mapping(uint8 => PackageState)) public pilotPackages;
    mapping(address => uint256) public daiBalances;

    mapping(uint256 => ClubMatrix) public clubMatrices;
    mapping(uint256 => address[4]) public clubSlotUsers;
    mapping(uint256 => PilotMatrix) public pilotMatrices;
    mapping(uint256 => address[2]) public pilotSlotUsers;

    uint256 public clubMatrixCount;
    uint256 public pilotMatrixCount;

    mapping(address => mapping(uint8 => uint256)) public activeClubMatrix;
    mapping(address => mapping(uint8 => uint256)) public activePilotMatrix;

    PendingAction[] private _pendingQueue;
    uint256 public pendingHead;

    mapping(bytes32 => BfsCursor) private _bfsCursors;
    mapping(bytes32 => address[]) private _bfsQueues;
    mapping(bytes32 => bool) public processedOps;

    event UserRegistered(address indexed user, address indexed sponsor, uint256 timestamp);
    event Activated(bool activated);

    event ClubPurchased(
        address indexed user,
        uint8 indexed level,
        uint256 indexed matrixId,
        uint256 amount,
        bool isRebirth
    );

    event PilotPurchased(
        address indexed user,
        uint8 indexed level,
        uint256 indexed matrixId,
        uint256 amount,
        bool isManual
    );

    event ClubPlacement(
        address indexed user,
        uint256 indexed matrixId,
        uint8 slotIndex,
        address indexed sponsor,
        uint8 level,
        bool isSpillover
    );

    event PilotPlacement(
        address indexed user,
        uint256 indexed matrixId,
        uint8 slotIndex,
        address indexed sponsor,
        uint8 level,
        bool isSpillover
    );

    event ClubCycleCompleted(
        uint256 indexed matrixId,
        address indexed owner,
        uint8 level,
        uint256 withdrawAmount,
        uint256 reinvestAmount,
        uint32 cyclesCompleted
    );

    event PilotCycleCompleted(
        uint256 indexed matrixId,
        address indexed owner,
        uint8 level,
        uint256 poolAmount,
        uint32 cyclesCompleted
    );

    event ClubRebirthCreated(
        uint256 indexed matrixId,
        address indexed owner,
        uint8 level,
        uint256 parentMatrixId,
        uint32 cycleNumber
    );

    event PilotRebirthCreated(
        uint256 indexed matrixId,
        address indexed owner,
        uint8 level,
        uint256 parentMatrixId,
        uint32 cycleNumber
    );

    event AutoUpgrade(
        address indexed user,
        MatrixType matrixType,
        uint8 fromLevel,
        uint8 toLevel,
        bytes32 idempotencyKey
    );

    event IncomePaid(
        address indexed recipient,
        address indexed payer,
        IncomeType incomeType,
        MatrixType matrixType,
        uint8 level,
        uint256 amount
    );

    event TokenReward(
        address indexed recipient,
        address indexed source,
        IncomeType rewardType,
        MatrixType matrixType,
        uint8 level,
        uint256 sltAmount
    );

    event SpinCouponsGranted(address indexed sponsor, address indexed referral, uint256 coupons);
    event Withdraw(address indexed user, uint256 amount, bytes32 withdrawRef);
    event PendingEnqueued(ActionKind kind, address indexed user, uint8 level);
    event PendingProcessed(ActionKind kind, address indexed user, uint8 level);
    event PlacementSkipped(address indexed user, uint8 level, MatrixType matrixType, string reason);

    event SponsorConfigUpdated(bool enabled, uint16 clubBps, uint16 pilotBps);
    event TreasuryUpdated(address indexed treasury);
    event IncentivePoolUpdated(address indexed incentivePool);
    event Paused(bool paused);

    modifier onlyRoot() {
        if (msg.sender != rootSponsor) revert NotRoot();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert PausedErr();
        _;
    }

    modifier whenActivated() {
        if (!activated) revert NotActivated();
        _;
    }

    modifier onlyRegistered() {
        if (!users[msg.sender].registered) revert NotRegistered();
        _;
    }

    modifier nonReentrant() {
        if (_locked != 0) revert ReentrancyErr();
        _locked = 1;
        _;
        _locked = 0;
    }

    constructor(address _dai, address _slt, address _rootSponsor, address _treasury) {
        if (_dai == address(0) || _slt == address(0) || _rootSponsor == address(0)) revert ZeroAddress();

        dai = IERC20(_dai);
        slt = SLTToken(_slt);
        rootSponsor = _rootSponsor;
        treasury = _treasury != address(0) ? _treasury : _rootSponsor;
        incentivePool = _rootSponsor;

        clubAmounts = [
            5 ether, 10 ether, 20 ether, 40 ether, 80 ether, 160 ether,
            320 ether, 640 ether, 1280 ether, 2560 ether, 5120 ether, 10240 ether
        ];
        pilotAmounts = [
            26 ether, 51 ether, 101 ether, 201 ether, 401 ether, 801 ether, 1601 ether, 3201 ether
        ];
        pilotPoolAmounts = [
            25 ether, 50 ether, 100 ether, 200 ether, 400 ether, 800 ether, 1600 ether, 3200 ether
        ];
        clubSltWelcome = [
            25e17, 5 ether, 10 ether, 20 ether, 40 ether, 80 ether,
            160 ether, 320 ether, 640 ether, 1280 ether, 2560 ether, 5120 ether
        ];
        clubSltDirect = [
            5e17, 1 ether, 2 ether, 4 ether, 8 ether, 16 ether,
            32 ether, 64 ether, 128 ether, 256 ether, 512 ether, 1024 ether
        ];
        pilotSltWelcome = [
            25 ether, 50 ether, 100 ether, 200 ether, 400 ether, 800 ether, 1600 ether, 3200 ether
        ];
        pilotSltDirect = [
            25e17, 5 ether, 10 ether, 20 ether, 40 ether, 80 ether, 160 ether, 320 ether
        ];

        users[_rootSponsor] = User({
            sponsor: address(0),
            registered: true,
            registeredAt: uint64(block.timestamp)
        });
        emit UserRegistered(_rootSponsor, address(0), block.timestamp);
    }

    function activate() external onlyRoot {
        if (spinContract == address(0)) revert SpinUnset();
        if (!slt.minters(address(this))) revert NotMinter();
        activated = true;
        emit Activated(true);
    }

    function setSpinContract(address _spin) external onlyRoot {
        if (_spin == address(0)) revert ZeroAddress();
        if (spinContract != address(0)) revert SpinSet();
        spinContract = _spin;
    }

    function setPaused(bool _paused) external onlyRoot {
        paused = _paused;
        emit Paused(_paused);
    }

    function setTreasury(address _treasury) external onlyRoot {
        require(_treasury != address(0), "Zero treasury");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setIncentivePool(address _pool) external onlyRoot {
        require(_pool != address(0), "Zero pool");
        incentivePool = _pool;
        emit IncentivePoolUpdated(_pool);
    }

    function setSponsorPayments(bool enabled, uint16 clubBps, uint16 pilotBps) external onlyRoot {
        require(clubBps <= MAX_SPONSOR_BPS && pilotBps <= MAX_SPONSOR_BPS, "Bps cap");
        sponsorPaymentsEnabled = enabled;
        clubSponsorBps = clubBps;
        pilotSponsorBps = pilotBps;
        emit SponsorConfigUpdated(enabled, clubBps, pilotBps);
    }

    function rescueTokens(address token, address to, uint256 amount) external onlyRoot {
        require(token != address(dai), "Cannot rescue DAI");
        require(IERC20(token).transfer(to, amount), "Rescue failed");
    }

    function register(address sponsor) external whenNotPaused whenActivated {
        require(!users[msg.sender].registered, "Already registered");
        require(sponsor != address(0), "Invalid sponsor");
        require(users[sponsor].registered, "Sponsor not registered");

        users[msg.sender] = User({
            sponsor: sponsor,
            registered: true,
            registeredAt: uint64(block.timestamp)
        });
        directReferrals[sponsor].push(msg.sender);
        emit UserRegistered(msg.sender, sponsor, block.timestamp);
    }

    function purchaseClub(uint8 level) external whenNotPaused whenActivated onlyRegistered nonReentrant {
        require(level >= 1 && level <= CLUB_LEVELS, "Invalid level");
        require(!clubPackages[msg.sender][level].owned, "Already owns level");

        uint256 amount = clubAmounts[level - 1];
        require(dai.transferFrom(msg.sender, address(this), amount), "DAI transfer failed");
        _assertSolvency();

        clubPackages[msg.sender][level] = PackageState({
            owned: true,
            isManual: true,
            cyclesCompleted: 0
        });

        uint256 matrixId = _createClubMatrix(msg.sender, level, false, 0, 1);
        emit ClubPurchased(msg.sender, level, matrixId, amount, false);

        _distributeSponsorPayment(msg.sender, users[msg.sender].sponsor, level, MatrixType.CLUB, amount);
        _grantWelcomeSlt(msg.sender, level, MatrixType.CLUB);
        _grantDirectSlt(users[msg.sender].sponsor, msg.sender, level, MatrixType.CLUB);
        _grantSpinCoupons(users[msg.sender].sponsor, msg.sender, level, MatrixType.CLUB);

        _enqueue(ActionKind.CLUB_PLACE, msg.sender, users[msg.sender].sponsor, level, 0, MatrixType.CLUB);
        _enqueue(ActionKind.FIRST_LINE_BONUS, msg.sender, address(0), level, 0, MatrixType.CLUB);
    }

    function purchasePilot(uint8 level) external whenNotPaused whenActivated onlyRegistered nonReentrant {
        require(level >= 1 && level <= PILOT_LEVELS, "Invalid level");
        require(!pilotPackages[msg.sender][level].owned, "Already owns level");

        uint256 amount = pilotAmounts[level - 1];
        require(dai.transferFrom(msg.sender, address(this), amount), "DAI transfer failed");
        require(dai.transfer(incentivePool, PILOT_INCENTIVE), "Incentive failed");
        _assertSolvency();

        emit IncomePaid(incentivePool, msg.sender, IncomeType.PILOT_INCENTIVE, MatrixType.PILOT, level, PILOT_INCENTIVE);

        pilotPackages[msg.sender][level] = PackageState({
            owned: true,
            isManual: true,
            cyclesCompleted: 0
        });

        uint256 matrixId = _createPilotMatrix(msg.sender, level, false, 0, 1);
        emit PilotPurchased(msg.sender, level, matrixId, amount, true);

        _distributeSponsorPayment(msg.sender, users[msg.sender].sponsor, level, MatrixType.PILOT, amount);
        _grantWelcomeSlt(msg.sender, level, MatrixType.PILOT);
        _grantDirectSlt(users[msg.sender].sponsor, msg.sender, level, MatrixType.PILOT);

        _enqueue(ActionKind.PILOT_PLACE, msg.sender, users[msg.sender].sponsor, level, 0, MatrixType.PILOT);
        _enqueue(ActionKind.FIRST_LINE_BONUS, msg.sender, address(0), level, 0, MatrixType.PILOT);
    }

    function processPending(uint256 maxSteps) external whenNotPaused whenActivated nonReentrant returns (uint256 processed) {
        while (processed < maxSteps && pendingHead < _pendingQueue.length) {
            PendingAction memory action = _pendingQueue[pendingHead];
            bool complete = _dispatchAction(action);
            if (!complete) break;
            emit PendingProcessed(action.kind, action.user, action.level);
            pendingHead++;
            processed++;
        }
    }

    function pendingLength() external view returns (uint256) {
        if (pendingHead >= _pendingQueue.length) return 0;
        return _pendingQueue.length - pendingHead;
    }

    function withdraw(uint256 amount, bytes32 withdrawRef) external onlyRegistered nonReentrant {
        require(amount > 0, "Zero amount");
        require(daiBalances[msg.sender] >= amount, "Insufficient balance");

        bytes32 key = keccak256(abi.encodePacked(msg.sender, withdrawRef));
        if (processedOps[key]) revert DuplicateWithdraw();
        processedOps[key] = true;

        daiBalances[msg.sender] -= amount;
        totalDaiLiabilities -= amount;
        require(dai.transfer(msg.sender, amount), "Withdraw failed");

        emit Withdraw(msg.sender, amount, withdrawRef);
        emit IncomePaid(msg.sender, address(this), IncomeType.WITHDRAW, MatrixType.CLUB, 0, amount);
    }

    function getDaiBalance(address user) external view returns (uint256) {
        return daiBalances[user];
    }

    function getSltBalance(address user) external view returns (uint256) {
        return slt.balanceOf(user);
    }

    function countQualifiedDirectReferrals(address user, MatrixType matrixType) public view returns (uint256) {
        address[] storage refs = directReferrals[user];
        uint256 count;
        for (uint256 i = 0; i < refs.length; i++) {
            if (matrixType == MatrixType.CLUB) {
                if (_hasClubPackageAtLeast(refs[i], uint8(QUALIFIED_REFERRAL_PACKAGE))) count++;
            } else if (_hasAnyPilotPackage(refs[i])) {
                count++;
            }
        }
        return count;
    }

    function _enqueue(
        ActionKind kind,
        address user,
        address sponsor,
        uint8 level,
        uint256 matrixId,
        MatrixType matrixType
    ) internal {
        _pendingQueue.push(
            PendingAction({
                kind: kind,
                user: user,
                sponsor: sponsor,
                level: level,
                matrixId: matrixId,
                matrixType: matrixType
            })
        );
        emit PendingEnqueued(kind, user, level);
    }

    function _dispatchAction(PendingAction memory action) internal returns (bool) {
        if (action.kind == ActionKind.CLUB_PLACE) {
            return _processClubPlace(action.user, action.sponsor, action.level);
        }
        if (action.kind == ActionKind.CLUB_CYCLE) {
            _finalizeClubCycle(action.matrixId);
            return true;
        }
        if (action.kind == ActionKind.PILOT_PLACE) {
            return _processPilotPlace(action.user, action.sponsor, action.level);
        }
        if (action.kind == ActionKind.PILOT_CYCLE) {
            _finalizePilotCycle(action.matrixId);
            return true;
        }
        if (action.kind == ActionKind.FIRST_LINE_BONUS) {
            _processFirstLineBonusChain(action.user, action.matrixType);
            return true;
        }
        return true;
    }

    function _assertSolvency() internal view {
        if (dai.balanceOf(address(this)) < totalDaiLiabilities) revert Insolvent();
    }

    function _creditDai(address user, uint256 amount, IncomeType t, MatrixType mt, uint8 level, address payer)
        internal
    {
        if (amount == 0) return;
        totalDaiLiabilities += amount;
        if (dai.balanceOf(address(this)) < totalDaiLiabilities) revert Insolvent();
        daiBalances[user] += amount;
        emit IncomePaid(user, payer, t, mt, level, amount);
    }

    function _creditSlt(
        address user,
        uint256 amount,
        IncomeType t,
        MatrixType mt,
        uint8 level,
        address source
    ) internal {
        if (amount == 0) return;
        slt.mint(user, amount);
        emit TokenReward(user, source, t, mt, level, amount);
    }

    function _idempotent(bytes32 key) internal returns (bool) {
        if (processedOps[key]) return false;
        processedOps[key] = true;
        return true;
    }

    function _placementKey(uint8 level, MatrixType mt, address sponsor, address user)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(level, mt, sponsor, user));
    }

    function _initBfs(bytes32 key, address sponsor) internal {
        if (_bfsCursors[key].initialized) return;
        _bfsCursors[key].initialized = true;
        _bfsCursors[key].sponsorChecked = false;
        _bfsCursors[key].queueHead = 0;

        address[] storage refs = directReferrals[sponsor];
        for (uint256 i = 0; i < refs.length; i++) {
            _bfsQueues[key].push(refs[i]);
        }
    }

    function _clearBfs(bytes32 key) internal {
        delete _bfsCursors[key];
        delete _bfsQueues[key];
    }

    function _bfsSearchStep(uint8 level, MatrixType mt, address sponsor, address user)
        internal
        returns (uint256 matrixId, bool spillover, bool finished)
    {
        bytes32 key = _placementKey(level, mt, sponsor, user);
        _initBfs(key, sponsor);
        BfsCursor storage cursor = _bfsCursors[key];

        if (!cursor.sponsorChecked) {
            cursor.sponsorChecked = true;
            matrixId = _openMatrixId(sponsor, level, mt);
            if (matrixId != 0) {
                _clearBfs(key);
                return (matrixId, false, true);
            }
        }

        address[] storage queue = _bfsQueues[key];
        uint256 steps;
        spillover = true;

        while (cursor.queueHead < queue.length && steps < BFS_NODES_PER_STEP) {
            address current = queue[cursor.queueHead];
            cursor.queueHead++;
            steps++;

            matrixId = _openMatrixId(current, level, mt);
            if (matrixId != 0) {
                _clearBfs(key);
                return (matrixId, true, true);
            }

            address[] storage refs = directReferrals[current];
            for (uint256 i = 0; i < refs.length; i++) {
                queue.push(refs[i]);
            }
        }

        if (cursor.queueHead >= queue.length) {
            _clearBfs(key);
            return (0, true, true);
        }

        return (0, true, false);
    }

    function _openMatrixId(address user, uint8 level, MatrixType mt) internal view returns (uint256) {
        if (mt == MatrixType.CLUB) {
            uint256 id = activeClubMatrix[user][level];
            if (id != 0 && _clubMatrixOpen(id)) return id;
            return 0;
        }
        uint256 pid = activePilotMatrix[user][level];
        if (pid != 0 && _pilotMatrixOpen(pid)) return pid;
        return 0;
    }

    function _clubMatrixOpen(uint256 id) internal view returns (bool) {
        ClubMatrix storage m = clubMatrices[id];
        return m.active && !m.cycleCompleted && m.slotsFilled < CLUB_SLOTS;
    }

    function _pilotMatrixOpen(uint256 id) internal view returns (bool) {
        PilotMatrix storage m = pilotMatrices[id];
        return m.active && !m.cycleCompleted && m.slotsFilled < PILOT_SLOTS;
    }

    function _refreshActiveClubMatrix(address owner, uint8 level) internal {
        activeClubMatrix[owner][level] = 0;
    }

    function _refreshActivePilotMatrix(address owner, uint8 level) internal {
        activePilotMatrix[owner][level] = 0;
    }

    function _createClubMatrix(
        address owner,
        uint8 level,
        bool isRebirth,
        uint256 parentId,
        uint32 cycleNumber
    ) internal returns (uint256 matrixId) {
        clubMatrixCount++;
        matrixId = clubMatrixCount;
        clubMatrices[matrixId] = ClubMatrix({
            owner: owner,
            level: level,
            slotsFilled: 0,
            active: true,
            cycleCompleted: false,
            isRebirth: isRebirth,
            parentMatrixId: parentId,
            cycleNumber: cycleNumber,
            createdAt: uint64(block.timestamp)
        });
        activeClubMatrix[owner][level] = matrixId;
    }

    function _fillClubSlot(uint256 targetMatrix, address user) internal returns (uint8 slot) {
        ClubMatrix storage m = clubMatrices[targetMatrix];
        slot = m.slotsFilled;
        if (slot >= CLUB_SLOTS) revert MatrixFull();
        if (clubSlotUsers[targetMatrix][slot] != address(0)) revert SlotTaken();
        clubSlotUsers[targetMatrix][slot] = user;
        m.slotsFilled = slot + 1;
    }

    function _processClubPlace(address user, address sponsor, uint8 level) internal returns (bool) {
        (uint256 targetMatrix, bool spillover, bool finished) =
            _bfsSearchStep(level, MatrixType.CLUB, sponsor, user);
        if (!finished) return false;
        if (targetMatrix == 0) {
            emit PlacementSkipped(user, level, MatrixType.CLUB, "No club matrix");
            return true;
        }

        uint8 slot = _fillClubSlot(targetMatrix, user);
        emit ClubPlacement(user, targetMatrix, slot, sponsor, level, spillover);

        if (clubMatrices[targetMatrix].slotsFilled >= CLUB_SLOTS) {
            _enqueue(ActionKind.CLUB_CYCLE, address(0), address(0), level, targetMatrix, MatrixType.CLUB);
        }
        return true;
    }

    function _finalizeClubCycle(uint256 matrixId) internal {
        ClubMatrix storage m = clubMatrices[matrixId];
        if (m.cycleCompleted || m.slotsFilled < CLUB_SLOTS) revert BadCycle();

        bytes32 cycleKey = keccak256(abi.encodePacked("club-cycle", matrixId));
        if (!_idempotent(cycleKey)) revert DuplicateCycle();

        m.cycleCompleted = true;
        m.active = false;

        uint8 level = m.level;
        address owner = m.owner;
        uint32 cycleNum = m.cycleNumber;
        _refreshActiveClubMatrix(owner, level);

        uint256 withdrawAmount = (clubAmounts[level - 1] * CYCLE_MULTIPLIER * CLUB_WITHDRAW_NUM) / CLUB_WITHDRAW_DEN;
        uint256 reinvestAmount = (clubAmounts[level - 1] * CYCLE_MULTIPLIER) / CLUB_REINVEST_DEN;

        clubPackages[owner][level].cyclesCompleted++;
        uint32 cyclesCompleted = clubPackages[owner][level].cyclesCompleted;

        emit ClubCycleCompleted(matrixId, owner, level, withdrawAmount, reinvestAmount, cyclesCompleted);
        emit IncomePaid(owner, address(this), IncomeType.REBIRTH, MatrixType.CLUB, level, reinvestAmount);

        if (cyclesCompleted == 1 && level < CLUB_LEVELS && !clubPackages[owner][level + 1].owned) {
            _scheduleClubAutoUpgrade(owner, level, withdrawAmount);
        } else {
            _creditDai(owner, withdrawAmount, IncomeType.CYCLE, MatrixType.CLUB, level, address(this));
        }

        _createClubMatrix(owner, level, true, matrixId, cycleNum + 1);
        emit ClubRebirthCreated(activeClubMatrix[owner][level], owner, level, matrixId, cycleNum + 1);

        address sponsor = users[owner].sponsor;
        if (sponsor == address(0)) sponsor = rootSponsor;
        _enqueue(ActionKind.CLUB_PLACE, owner, sponsor, level, 0, MatrixType.CLUB);
        _enqueue(ActionKind.FIRST_LINE_BONUS, owner, address(0), level, 0, MatrixType.CLUB);
    }

    function _scheduleClubAutoUpgrade(address user, uint8 currentLevel, uint256 withdrawAmount) internal {
        uint8 nextLevel = currentLevel + 1;
        bytes32 key = keccak256(abi.encodePacked("club-auto-upgrade", user, currentLevel, nextLevel));
        if (!_idempotent(key)) return;

        if (nextLevel > CLUB_LEVELS) {
            _creditDai(user, withdrawAmount, IncomeType.CYCLE, MatrixType.CLUB, currentLevel, address(this));
            return;
        }

        if (withdrawAmount < clubAmounts[nextLevel - 1]) revert UpgradeUnderfunded();

        clubPackages[user][nextLevel] = PackageState({
            owned: true,
            isManual: false,
            cyclesCompleted: 0
        });

        emit IncomePaid(user, address(this), IncomeType.UPGRADE, MatrixType.CLUB, nextLevel, withdrawAmount);
        emit AutoUpgrade(user, MatrixType.CLUB, currentLevel, nextLevel, key);

        _createClubMatrix(user, nextLevel, false, 0, 1);
        emit ClubPurchased(user, nextLevel, activeClubMatrix[user][nextLevel], 0, false);

        address sponsor = users[user].sponsor;
        if (sponsor == address(0)) sponsor = rootSponsor;
        _enqueue(ActionKind.CLUB_PLACE, user, sponsor, nextLevel, 0, MatrixType.CLUB);
    }

    function _createPilotMatrix(
        address owner,
        uint8 level,
        bool isRebirth,
        uint256 parentId,
        uint32 cycleNumber
    ) internal returns (uint256 matrixId) {
        pilotMatrixCount++;
        matrixId = pilotMatrixCount;
        pilotMatrices[matrixId] = PilotMatrix({
            owner: owner,
            level: level,
            slotsFilled: 0,
            active: true,
            cycleCompleted: false,
            isRebirth: isRebirth,
            parentMatrixId: parentId,
            cycleNumber: cycleNumber,
            createdAt: uint64(block.timestamp)
        });
        activePilotMatrix[owner][level] = matrixId;
    }

    function _fillPilotSlot(uint256 targetMatrix, address user) internal returns (uint8 slot) {
        PilotMatrix storage m = pilotMatrices[targetMatrix];
        slot = m.slotsFilled;
        if (slot >= PILOT_SLOTS) revert MatrixFull();
        if (pilotSlotUsers[targetMatrix][slot] != address(0)) revert SlotTaken();
        pilotSlotUsers[targetMatrix][slot] = user;
        m.slotsFilled = slot + 1;
    }

    function _creditDaiPilotDirect(address to, uint256 amount, uint8 level, address payer) internal {
        _creditDai(to, amount, IncomeType.DIRECT, MatrixType.PILOT, level, payer);
    }

    function _completePilotPlacement(
        uint256 targetMatrix,
        address user,
        address sponsor,
        uint8 level,
        bool spillover
    ) internal {
        uint8 slot = _fillPilotSlot(targetMatrix, user);
        emit PilotPlacement(user, targetMatrix, slot, sponsor, level, spillover);

        uint256 pool = pilotPoolAmounts[level - 1];
        if (slot == 0) {
            _creditDaiPilotDirect(pilotMatrices[targetMatrix].owner, pool, level, user);
            return;
        }

        address owner = pilotMatrices[targetMatrix].owner;
        address recipient = users[owner].sponsor;
        if (recipient == address(0)) recipient = owner;
        _creditDaiPilotDirect(recipient, pool, level, user);
        _enqueue(ActionKind.PILOT_CYCLE, address(0), address(0), level, targetMatrix, MatrixType.PILOT);
    }

    function _processPilotPlace(address user, address sponsor, uint8 level) internal returns (bool) {
        (uint256 targetMatrix, bool spillover, bool finished) =
            _bfsSearchStep(level, MatrixType.PILOT, sponsor, user);
        if (!finished) return false;
        if (targetMatrix == 0) {
            emit PlacementSkipped(user, level, MatrixType.PILOT, "No pilot matrix");
            return true;
        }
        _completePilotPlacement(targetMatrix, user, sponsor, level, spillover);
        return true;
    }

    function _finalizePilotCycle(uint256 matrixId) internal {
        PilotMatrix storage m = pilotMatrices[matrixId];
        if (m.cycleCompleted || m.slotsFilled < PILOT_SLOTS) revert BadCycle();

        bytes32 cycleKey = keccak256(abi.encodePacked("pilot-cycle", matrixId));
        if (!_idempotent(cycleKey)) revert DuplicateCycle();

        m.cycleCompleted = true;
        m.active = false;

        uint8 level = m.level;
        address owner = m.owner;
        _refreshActivePilotMatrix(owner, level);

        pilotPackages[owner][level].cyclesCompleted++;
        uint32 cyclesCompleted = pilotPackages[owner][level].cyclesCompleted;
        uint256 pool = pilotPoolAmounts[level - 1];

        emit PilotCycleCompleted(matrixId, owner, level, pool, cyclesCompleted);
        _schedulePilotAutoUpgrade(owner, level, cyclesCompleted, matrixId);

        _createPilotMatrix(owner, level, true, matrixId, m.cycleNumber + 1);
        emit PilotRebirthCreated(activePilotMatrix[owner][level], owner, level, matrixId, m.cycleNumber + 1);

        address sponsor = users[owner].sponsor;
        if (sponsor == address(0)) sponsor = rootSponsor;
        _enqueue(ActionKind.PILOT_PLACE, owner, sponsor, level, 0, MatrixType.PILOT);
        _enqueue(ActionKind.FIRST_LINE_BONUS, owner, address(0), level, 0, MatrixType.PILOT);
    }

    function _schedulePilotAutoUpgrade(
        address user,
        uint8 level,
        uint32 cyclesCompleted,
        uint256 sourceMatrixId
    ) internal {
        uint256 pool = pilotPoolAmounts[level - 1];
        if (cyclesCompleted == 1) return;

        if (cyclesCompleted == 2 || cyclesCompleted == 3) {
            uint8 nextLevel = level + 1;
            bytes32 key = keccak256(abi.encodePacked("pilot-auto-upgrade", user, level, nextLevel));
            if (!_idempotent(key)) return;

            if (nextLevel > PILOT_LEVELS) {
                _creditDai(user, pool, IncomeType.CYCLE, MatrixType.PILOT, level, address(this));
                return;
            }

            if (pilotPackages[user][nextLevel].owned) {
                _creditDai(user, pool, IncomeType.CYCLE, MatrixType.PILOT, level, address(this));
                return;
            }

            pilotPackages[user][nextLevel] = PackageState({
                owned: true,
                isManual: false,
                cyclesCompleted: 0
            });

            emit IncomePaid(user, address(this), IncomeType.UPGRADE, MatrixType.PILOT, nextLevel, pool);
            emit AutoUpgrade(user, MatrixType.PILOT, level, nextLevel, key);

            _createPilotMatrix(user, nextLevel, false, 0, 1);
            emit PilotPurchased(user, nextLevel, activePilotMatrix[user][nextLevel], 0, false);

            address sponsor = users[user].sponsor;
            if (sponsor == address(0)) sponsor = rootSponsor;
            _enqueue(ActionKind.PILOT_PLACE, user, sponsor, nextLevel, 0, MatrixType.PILOT);
            return;
        }

        bytes32 walletKey = keccak256(abi.encodePacked("pilot-wallet", user, level, cyclesCompleted, sourceMatrixId));
        if (_idempotent(walletKey)) {
            _creditDai(user, pool, IncomeType.CYCLE, MatrixType.PILOT, level, address(this));
        }
    }

    function _distributeSponsorPayment(
        address buyer,
        address sponsor,
        uint8 level,
        MatrixType matrixType,
        uint256 packageAmount
    ) internal {
        if (!sponsorPaymentsEnabled || sponsor == address(0)) return;

        uint16 bps = matrixType == MatrixType.CLUB ? clubSponsorBps : pilotSponsorBps;
        if (bps == 0) return;

        uint256 amount = (packageAmount * bps) / 10_000;
        bytes32 key = keccak256(abi.encodePacked("sponsor-pay", buyer, sponsor, level, uint8(matrixType)));
        if (!_idempotent(key)) return;

        _creditDai(sponsor, amount, IncomeType.SPONSOR_PAYMENT, matrixType, level, buyer);
    }

    function _grantWelcomeSlt(address user, uint8 level, MatrixType matrixType) internal {
        bytes32 key = keccak256(abi.encodePacked("slt-welcome", user, level, uint8(matrixType)));
        if (!_idempotent(key)) return;

        uint256 amount = matrixType == MatrixType.CLUB ? clubSltWelcome[level - 1] : pilotSltWelcome[level - 1];
        _creditSlt(user, amount, IncomeType.TOKEN_WELCOME, matrixType, level, address(this));
    }

    function _grantDirectSlt(address sponsor, address referral, uint8 level, MatrixType matrixType) internal {
        if (sponsor == address(0)) return;
        bytes32 key = keccak256(abi.encodePacked("slt-direct", sponsor, referral, level, uint8(matrixType)));
        if (!_idempotent(key)) return;

        uint256 amount = matrixType == MatrixType.CLUB ? clubSltDirect[level - 1] : pilotSltDirect[level - 1];
        _creditSlt(sponsor, amount, IncomeType.TOKEN_DIRECT, matrixType, level, referral);
    }

    function _grantSpinCoupons(address sponsor, address referral, uint8 level, MatrixType matrixType) internal {
        if (matrixType != MatrixType.CLUB || level < QUALIFIED_REFERRAL_PACKAGE) return;
        if (sponsor == address(0)) return;
        bytes32 key = keccak256(abi.encodePacked("spin", sponsor, referral, level));
        if (!_idempotent(key)) return;

        ISensoSpin(spinContract).creditCoupons(sponsor, SPIN_COUPONS_PER_QUALIFIED);
        emit SpinCouponsGranted(sponsor, referral, SPIN_COUPONS_PER_QUALIFIED);
    }

    function _processFirstLineBonusChain(address user, MatrixType matrixType) internal {
        _processFirstLineMemberBonus(user, matrixType);
        address sponsor = users[user].sponsor;
        if (sponsor != address(0)) {
            _processFirstLineMemberBonus(sponsor, matrixType);
        }
    }

    function _processFirstLineMemberBonus(address user, MatrixType matrixType) internal {
        if (countQualifiedDirectReferrals(user, matrixType) < DIRECT_REFERRALS_FOR_FIRST_LINE) return;

        address[] storage refs = directReferrals[user];
        for (uint256 i = 0; i < refs.length; i++) {
            address member = refs[i];
            uint8 pkgLevel = matrixType == MatrixType.CLUB ? _highestClubLevel(member) : _highestPilotLevel(member);
            if (pkgLevel == 0) continue;

            bytes32 key = keccak256(abi.encodePacked("first-line", user, member, uint8(matrixType), pkgLevel));
            if (!processedOps[key]) {
                processedOps[key] = true;
                uint256 amount = matrixType == MatrixType.CLUB
                    ? clubSltDirect[pkgLevel - 1]
                    : pilotSltDirect[pkgLevel - 1];
                _creditSlt(user, amount, IncomeType.FIRST_LINE_BONUS, matrixType, pkgLevel, member);
            }
        }
    }

    function _hasClubPackageAtLeast(address user, uint8 minLevel) internal view returns (bool) {
        for (uint8 l = minLevel; l <= uint8(CLUB_LEVELS); l++) {
            if (clubPackages[user][l].owned) return true;
        }
        return false;
    }

    function _hasAnyPilotPackage(address user) internal view returns (bool) {
        for (uint8 l = 1; l <= uint8(PILOT_LEVELS); l++) {
            if (pilotPackages[user][l].owned) return true;
        }
        return false;
    }

    function _highestClubLevel(address user) internal view returns (uint8) {
        for (uint8 l = uint8(CLUB_LEVELS); l >= 1; l--) {
            if (clubPackages[user][l].owned) return l;
        }
        return 0;
    }

    function _highestPilotLevel(address user) internal view returns (uint8) {
        for (uint8 l = uint8(PILOT_LEVELS); l >= 1; l--) {
            if (pilotPackages[user][l].owned) return l;
        }
        return 0;
    }
}
