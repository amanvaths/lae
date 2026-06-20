// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title LAERoyalCardNFT — Royal Rank cards (Rank 1–4 at levels 3,6,9,12)
 */
contract LAERoyalCardNFT {
    string public name;
    string public symbol;
    uint8 public rank;

    address public owner;
    address public minter;

    uint256 public nextTokenId = 1;
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event MinterUpdated(address indexed minter);

    modifier onlyOwner() {
        require(msg.sender == owner, "LAE: not owner");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == minter, "LAE: not minter");
        _;
    }

    constructor(string memory name_, string memory symbol_, uint8 rank_) {
        name = name_;
        symbol = symbol_;
        rank = rank_;
        owner = msg.sender;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
        emit MinterUpdated(_minter);
    }

    function mint(address to) external onlyMinter returns (uint256 tokenId) {
        require(to != address(0), "LAE: zero to");
        tokenId = nextTokenId++;
        ownerOf[tokenId] = to;
        balanceOf[to]++;
        emit Transfer(address(0), to, tokenId);
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf[tokenId];
        require(msg.sender == tokenOwner || isApprovedForAll[tokenOwner][msg.sender], "LAE: not approved");
        getApproved[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "LAE: not approved");
        require(from == ownerOf[tokenId], "LAE: wrong from");
        require(to != address(0), "LAE: zero to");
        delete getApproved[tokenId];
        balanceOf[from]--;
        balanceOf[to]++;
        ownerOf[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf[tokenId];
        return spender == tokenOwner || getApproved[tokenId] == spender || isApprovedForAll[tokenOwner][spender];
    }
}
