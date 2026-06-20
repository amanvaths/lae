// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title LAERegistrationPassNFT — one pass per registered user (tokenId = userId)
 */
contract LAERegistrationPassNFT {
    string public constant name = "LAE Registration Pass";
    string public constant symbol = "LAEPASS";

    address public owner;
    address public minter;
    string private _baseURI;

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

    constructor(string memory baseUri_) {
        owner = msg.sender;
        _baseURI = baseUri_;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
        emit MinterUpdated(_minter);
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        _baseURI = uri;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(ownerOf[tokenId] != address(0), "LAE: no token");
        return string(abi.encodePacked(_baseURI, _toString(tokenId)));
    }

    function mint(address to, uint256 tokenId) external onlyMinter {
        require(to != address(0), "LAE: zero to");
        require(ownerOf[tokenId] == address(0), "LAE: exists");
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

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
