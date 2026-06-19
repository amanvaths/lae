// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./LAEToken.sol";

/**
 * @title LAESpin — on-chain spin rewards (PDF weighted table)
 */
contract LAESpin {
    LAEToken public immutable laeToken;
    address public immutable laeCore;

    mapping(address => uint256) public spinCoupons;
    uint256 private _spinNonce;

    uint256[6] public spinAmounts;
    uint16[6] public spinWeightsBps;

    event SpinExecuted(address indexed user, uint8 tier, uint256 laeAmount, uint256 nonce);

    modifier onlyLaeCore() {
        require(msg.sender == laeCore, "Not LAE core");
        _;
    }

    constructor(address _laeToken, address _laeCore) {
        require(_laeToken != address(0) && _laeCore != address(0), "Zero addr");
        laeToken = LAEToken(_laeToken);
        laeCore = _laeCore;
        spinAmounts = [0, 10 ether, 200 ether, 2000 ether, 10000 ether, 100000 ether];
        spinWeightsBps = [5000, 2500, 1500, 700, 200, 100];
    }

    function creditCoupons(address user, uint256 count) external onlyLaeCore {
        require(user != address(0), "Zero user");
        spinCoupons[user] += count;
    }

    function spin() external returns (uint256 amount, uint8 tier) {
        require(spinCoupons[msg.sender] > 0, "No coupons");
        spinCoupons[msg.sender]--;

        uint256 nonce = ++_spinNonce;
        uint256 roll = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    block.number,
                    msg.sender,
                    nonce,
                    address(this)
                )
            )
        ) % 10000;

        uint256 cumulative;
        for (uint8 i = 0; i < 6; i++) {
            cumulative += spinWeightsBps[i];
            if (roll < cumulative) {
                tier = i;
                amount = spinAmounts[i];
                if (amount > 0) {
                    laeToken.mint(msg.sender, amount);
                }
                emit SpinExecuted(msg.sender, tier, amount, nonce);
                return (amount, tier);
            }
        }

        emit SpinExecuted(msg.sender, 0, 0, nonce);
        return (0, 0);
    }
}
