// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title TestPaymentToken
 * @notice BSC Testnet mock BUSD — any wallet can mint via faucet() (no owner gate).
 *         Used for LAE Club registration / upgrade testing only.
 */
contract TestPaymentToken {
    string public constant name = "LAE Test BUSD";
    string public constant symbol = "tBUSD";
    uint8 public constant decimals = 18;

    /// @dev Max per faucet call (1000 tokens) — enough for testing, limits spam.
    uint256 public constant MAX_FAUCET_AMOUNT = 1000 ether;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /// @notice Mint test tokens to msg.sender. Frontend register page calls this.
    function faucet(uint256 amount) external {
        _faucet(amount);
    }

    /// @notice Alias — some tools call mint() instead of faucet().
    function mint(uint256 amount) external {
        _faucet(amount);
    }

    function _faucet(uint256 amount) private {
        require(amount > 0, "TestPaymentToken: zero amount");
        require(amount <= MAX_FAUCET_AMOUNT, "TestPaymentToken: max 1000 per call");
        _mint(msg.sender, amount);
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
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "TestPaymentToken: allowance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _mint(address to, uint256 amount) private {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) private {
        require(to != address(0), "TestPaymentToken: zero address");
        require(balanceOf[from] >= amount, "TestPaymentToken: balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
