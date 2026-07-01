// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @dev Minimal NFT stubs so LAEClubMatrix can mint on registration / rank unlock.
contract MockRegistrationPassNFT {
    address public matrix;

    function setMatrix(address m) external {
        require(matrix == address(0), "already set");
        matrix = m;
    }

    function mint(address to, uint256 tokenId) external {
        require(msg.sender == matrix, "only matrix");
        to;
        tokenId;
    }
}

contract MockRoyaltyCardNFT {
    address public matrix;

    function setMatrix(address m) external {
        require(matrix == address(0), "already set");
        matrix = m;
    }

    function mint(address to) external {
        require(msg.sender == matrix, "only matrix");
        to;
    }
}
