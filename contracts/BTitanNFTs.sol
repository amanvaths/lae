// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * BTitan NFT collection contracts.
 *
 * BTitanXMatrix mints these during registration / level upgrades:
 *   - RegistrationPassNFT.mint(address to, uint256 tokenId)  // tokenId = userId
 *   - RoyaltyCardNFT.mint(address to)                        // auto-increment tokenId
 *
 * Deploy 1x RegistrationPassNFT + 4x RoyaltyCardNFT (ranks 1-4), then call
 * setMinter(<BTitanXMatrix address>) on each so only the matrix can mint.
 *
 * Self-contained, minimal ERC-721 (metadata) — no external imports so it
 * compiles in Remix as a single file.
 */
abstract contract MiniERC721 {
    string public name;
    string public symbol;
    string internal _baseTokenURI;

    address public owner;
    address public minter;

    uint256 public totalSupply;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed tokenOwner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed tokenOwner, address indexed operator, bool approved);
    event MinterUpdated(address indexed newMinter);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "NFT: not owner");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == minter || msg.sender == owner, "NFT: not minter");
        _;
    }

    constructor(string memory name_, string memory symbol_, string memory baseURI_) {
        name = name_;
        symbol = symbol_;
        _baseTokenURI = baseURI_;
        owner = msg.sender;
    }

    // --- Admin ---
    function setMinter(address newMinter) external onlyOwner {
        minter = newMinter;
        emit MinterUpdated(newMinter);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "NFT: zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // --- ERC721 metadata / views ---
    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "NFT: zero address");
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address o = _owners[tokenId];
        require(o != address(0), "NFT: nonexistent token");
        return o;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "NFT: nonexistent token");
        return bytes(_baseTokenURI).length > 0
            ? string(abi.encodePacked(_baseTokenURI, _toString(tokenId)))
            : "";
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x80ac58cd || // ERC721
            interfaceId == 0x5b5e139f || // ERC721Metadata
            interfaceId == 0x01ffc9a7;   // ERC165
    }

    // --- ERC721 approvals / transfers ---
    function approve(address to, uint256 tokenId) external {
        address o = ownerOf(tokenId);
        require(
            msg.sender == o || _operatorApprovals[o][msg.sender],
            "NFT: not authorized"
        );
        _tokenApprovals[tokenId] = to;
        emit Approval(o, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "NFT: nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator) external view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "NFT: not authorized");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) external {
        transferFrom(from, to, tokenId);
    }

    // --- Internal ---
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address o = ownerOf(tokenId);
        return spender == o || _tokenApprovals[tokenId] == spender || _operatorApprovals[o][spender];
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "NFT: wrong from");
        require(to != address(0), "NFT: zero to");
        _tokenApprovals[tokenId] = address(0);
        unchecked {
            _balances[from] -= 1;
            _balances[to] += 1;
        }
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "NFT: zero to");
        require(_owners[tokenId] == address(0), "NFT: token exists");
        unchecked {
            _balances[to] += 1;
            totalSupply += 1;
        }
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
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
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

/**
 * Registration Pass — tokenId is the user's matrix userId (supplied by the matrix).
 * Matches IRegistrationPassNFT.mint(address,uint256).
 */
contract RegistrationPassNFT is MiniERC721 {
    constructor(string memory baseURI_)
        MiniERC721("BTitan Registration Pass", "BTITAN-PASS", baseURI_)
    {}

    function mint(address to, uint256 tokenId) external onlyMinter {
        _mint(to, tokenId);
    }
}

/**
 * Royalty Card — auto-incrementing tokenId. Deploy one instance per rank
 * (Rank 1/2/3/4) with its own name, symbol and baseURI.
 * Matches IRoyaltyCardNFT.mint(address).
 */
contract RoyaltyCardNFT is MiniERC721 {
    uint256 public nextTokenId = 1;

    constructor(string memory name_, string memory symbol_, string memory baseURI_)
        MiniERC721(name_, symbol_, baseURI_)
    {}

    function mint(address to) external onlyMinter {
        _mint(to, nextTokenId);
        unchecked {
            nextTokenId += 1;
        }
    }
}
