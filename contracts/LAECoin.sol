// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20Pay {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/**
 * @title LAECoin — LAE Club reward token (BEP-20)
 * @notice 500,000 max supply · 400,000 reward pool (held by LAEClubMatrix)
 *         Matrix income stays in BTC/USDT — LAE is reward layer only.
 *         Admin-configurable buy/sell/transfer tax + internal P2P marketplace.
 */
contract LAECoin {
    string public constant name = "LAE Coin";
    string public constant symbol = "LAE";
    uint8 public constant decimals = 18;
    uint256 public constant BPS = 10_000;

    uint256 public constant TOTAL_SUPPLY_CAP = 500_000 ether;
    uint256 public constant REWARD_POOL_CAP = 400_000 ether;
    uint256 public constant RESIDUAL_SUPPLY_CAP = 100_000 ether;

    uint256 public immutable maxSupply;
    uint256 public totalSupply;
    uint256 public totalBurned;

    uint256 public rewardPoolAllocated;
    uint256 public rewardPoolMinted;

    address public owner;
    address public matrixContract;
    address public treasuryWallet;
    address public liquidityWallet;
    address public operationsWallet;

    uint256 public buyTaxBps;
    uint256 public sellTaxBps;
    uint256 public transferTaxBps;
    address public taxTreasury;
    address public p2pPaymentToken;

    bool public p2pEnabled;
    uint256 public p2pFeeBps;
    uint256 public nextOrderId;

    mapping(address => bool) public isTaxExempt;
    mapping(address => bool) public isLiquidityPair;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    struct P2POrder {
        address seller;
        uint256 laeAmount;
        uint256 pricePerLae;
        bool active;
    }

    mapping(uint256 => P2POrder) public p2pOrders;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Burned(address indexed from, uint256 amount, uint256 totalBurned);
    event MatrixContractUpdated(address indexed matrix);
    event WalletsUpdated(address treasury, address liquidity, address operations);
    event RewardPoolAllocated(uint256 amount, uint256 totalAllocated);
    event TaxesUpdated(uint256 buyBps, uint256 sellBps, uint256 transferBps);
    event TaxExemptUpdated(address indexed account, bool exempt);
    event LiquidityPairUpdated(address indexed pair, bool isPair);
    event P2PEnabledUpdated(bool enabled);
    event P2PFeeUpdated(uint256 feeBps);
    event P2POrderCreated(uint256 indexed orderId, address indexed seller, uint256 laeAmount, uint256 pricePerLae);
    event P2POrderFilled(uint256 indexed orderId, address indexed buyer, uint256 paymentAmount);
    event P2POrderCancelled(uint256 indexed orderId);

    modifier onlyOwner() {
        require(msg.sender == owner, "LAE: not owner");
        _;
    }

    modifier onlyMatrix() {
        require(msg.sender == matrixContract, "LAE: not matrix");
        _;
    }

    constructor() {
        maxSupply = TOTAL_SUPPLY_CAP;
        owner = msg.sender;
        taxTreasury = msg.sender;
        isTaxExempt[address(this)] = true;
    }

    function circulatingSupply() external view returns (uint256) {
        return totalSupply;
    }

    function rewardPoolRemaining() external view returns (uint256) {
        return rewardPoolMinted > rewardPoolAllocated ? rewardPoolMinted - rewardPoolAllocated : 0;
    }

    function setMatrixContract(address _matrix) external onlyOwner {
        require(_matrix != address(0), "LAE: zero matrix");
        matrixContract = _matrix;
        isTaxExempt[_matrix] = true;
        emit MatrixContractUpdated(_matrix);
    }

    function setWallets(address _treasury, address _liquidity, address _operations) external onlyOwner {
        require(_treasury != address(0) && _liquidity != address(0) && _operations != address(0), "LAE: zero wallet");
        treasuryWallet = _treasury;
        liquidityWallet = _liquidity;
        operationsWallet = _operations;
        emit WalletsUpdated(_treasury, _liquidity, _operations);
    }

    function setTaxes(uint256 _buyBps, uint256 _sellBps, uint256 _transferBps) external onlyOwner {
        require(_buyBps <= BPS && _sellBps <= BPS && _transferBps <= BPS, "LAE: bad tax");
        buyTaxBps = _buyBps;
        sellTaxBps = _sellBps;
        transferTaxBps = _transferBps;
        emit TaxesUpdated(_buyBps, _sellBps, _transferBps);
    }

    function setTaxTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "LAE: zero treasury");
        taxTreasury = _treasury;
    }

    function setTaxExempt(address account, bool exempt) external onlyOwner {
        isTaxExempt[account] = exempt;
        emit TaxExemptUpdated(account, exempt);
    }

    function setLiquidityPair(address pair, bool isPair) external onlyOwner {
        isLiquidityPair[pair] = isPair;
        emit LiquidityPairUpdated(pair, isPair);
    }

    function setP2PEnabled(bool enabled) external onlyOwner {
        p2pEnabled = enabled;
        emit P2PEnabledUpdated(enabled);
    }

    function setP2PFeeBps(uint256 feeBps) external onlyOwner {
        require(feeBps <= BPS, "LAE: bad fee");
        p2pFeeBps = feeBps;
        emit P2PFeeUpdated(feeBps);
    }

    function setP2PPaymentToken(address token) external onlyOwner {
        require(token != address(0), "LAE: zero token");
        p2pPaymentToken = token;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "LAE: zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Mint 400k to matrix (reward pool) + up to 100k residual to admin wallets.
     */
    function bootstrapSupply(
        uint256 rewardPoolAmount,
        uint256 treasuryAmount,
        uint256 liquidityAmount,
        uint256 operationsAmount
    ) external onlyOwner {
        require(matrixContract != address(0), "LAE: matrix unset");
        require(rewardPoolAmount == REWARD_POOL_CAP, "Reward pool must be exactly 400000 LAE");
        require(treasuryAmount + liquidityAmount + operationsAmount <= RESIDUAL_SUPPLY_CAP, "LAE: residual cap");
        require(totalSupply == 0, "LAE: bootstrapped");

        _mint(matrixContract, rewardPoolAmount);
        rewardPoolMinted = rewardPoolAmount;

        if (treasuryAmount > 0) _mint(treasuryWallet, treasuryAmount);
        if (liquidityAmount > 0) _mint(liquidityWallet, liquidityAmount);
        if (operationsAmount > 0) _mint(operationsWallet, operationsAmount);
    }

    /// @dev Matrix records locked LAE allocation (tokens remain in matrix balance).
    function recordRewardAllocation(uint256 amount) external onlyMatrix {
        require(rewardPoolAllocated + amount <= rewardPoolMinted, "LAE: pool exhausted");
        rewardPoolAllocated += amount;
        emit RewardPoolAllocated(amount, rewardPoolAllocated);
    }

    // ─── P2P marketplace ─────────────────────────────────────────────────────

    function createP2POrder(uint256 laeAmount, uint256 pricePerLae) external returns (uint256 orderId) {
        require(p2pEnabled, "LAE: p2p off");
        require(laeAmount > 0 && pricePerLae > 0, "LAE: zero order");
        _transfer(msg.sender, address(this), laeAmount);
        orderId = ++nextOrderId;
        p2pOrders[orderId] = P2POrder({
            seller: msg.sender,
            laeAmount: laeAmount,
            pricePerLae: pricePerLae,
            active: true
        });
        emit P2POrderCreated(orderId, msg.sender, laeAmount, pricePerLae);
    }

    function fillP2POrder(uint256 orderId) external {
        require(p2pEnabled, "LAE: p2p off");
        require(p2pPaymentToken != address(0), "LAE: pay token unset");
        P2POrder storage o = p2pOrders[orderId];
        require(o.active, "LAE: inactive");
        require(o.seller != msg.sender, "LAE: self fill");

        uint256 payment = (o.laeAmount * o.pricePerLae) / 1e18;
        require(payment > 0, "LAE: zero pay");
        require(IERC20Pay(p2pPaymentToken).transferFrom(msg.sender, o.seller, payment), "LAE: pay fail");

        o.active = false;
        uint256 fee = (o.laeAmount * p2pFeeBps) / BPS;
        uint256 toBuyer = o.laeAmount - fee;
        if (fee > 0) _transferInternal(address(this), taxTreasury, fee);
        _transferInternal(address(this), msg.sender, toBuyer);
        emit P2POrderFilled(orderId, msg.sender, payment);
    }

    function cancelP2POrder(uint256 orderId) external {
        P2POrder storage o = p2pOrders[orderId];
        require(o.active, "LAE: inactive");
        require(msg.sender == o.seller || msg.sender == owner, "LAE: not seller");
        o.active = false;
        _transferInternal(address(this), o.seller, o.laeAmount);
        emit P2POrderCancelled(orderId);
    }

    function burn(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "LAE: balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        totalBurned += amount;
        emit Transfer(msg.sender, address(0), amount);
        emit Burned(msg.sender, amount, totalBurned);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "LAE: allowance");
        allowance[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "LAE: zero to");
        require(totalSupply + amount <= maxSupply, "LAE: max supply");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "LAE: zero to");
        require(balanceOf[from] >= amount, "LAE: balance");

        if (isTaxExempt[from] || isTaxExempt[to]) {
            _transferInternal(from, to, amount);
            return;
        }

        uint256 taxBps = transferTaxBps;
        if (isLiquidityPair[from]) taxBps = buyTaxBps;
        else if (isLiquidityPair[to]) taxBps = sellTaxBps;

        uint256 tax = (amount * taxBps) / BPS;
        uint256 sendAmount = amount - tax;

        if (tax > 0) {
            balanceOf[from] -= tax;
            balanceOf[taxTreasury] += tax;
            emit Transfer(from, taxTreasury, tax);
        }
        _transferInternal(from, to, sendAmount);
    }

    function _transferInternal(address from, address to, uint256 amount) internal {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
