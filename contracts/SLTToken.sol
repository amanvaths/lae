// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title SLTToken — SENSO Limitless reward token (ERC20)
 */
contract SLTToken {
    string public constant name = "SENSO Limitless Token";
    string public constant symbol = "SLT";
    uint8 public constant decimals = 18;

    uint256 public immutable maxSupply;
    uint256 public totalSupply;

    address public owner;
    mapping(address => bool) public minters;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event MinterUpdated(address indexed minter, bool allowed);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "Not minter");
        _;
    }

    constructor(uint256 _maxSupply) {
        require(_maxSupply > 0, "Zero cap");
        maxSupply = _maxSupply;
        owner = msg.sender;
    }

    function setMinter(address _minter, bool allowed) external onlyOwner {
        require(_minter != address(0), "Zero minter");
        minters[_minter] = allowed;
        emit MinterUpdated(_minter, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function mint(address to, uint256 amount) external onlyMinter {
        require(to != address(0), "Zero recipient");
        require(totalSupply + amount <= maxSupply, "Max supply exceeded");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
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
        require(allowance[from][msg.sender] >= amount, "Allowance");
        allowance[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "Zero to");
        require(balanceOf[from] >= amount, "Balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
