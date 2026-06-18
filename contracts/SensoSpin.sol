// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./SLTToken.sol";

/**
 * @title SensoSpin — on-chain spin rewards (PDF weighted table)
 */
contract SensoSpin {
    SLTToken public immutable slt;
    address public immutable sensoCore;

    mapping(address => uint256) public spinCoupons;
    uint256 private _spinNonce;

    uint256[6] public spinAmounts;
    uint16[6] public spinWeightsBps;

    event SpinExecuted(address indexed user, uint8 tier, uint256 sltAmount, uint256 nonce);

    modifier onlySenso() {
        require(msg.sender == sensoCore, "Not senso");
        _;
    }

    constructor(address _slt, address _sensoCore) {
        require(_slt != address(0) && _sensoCore != address(0), "Zero addr");
        slt = SLTToken(_slt);
        sensoCore = _sensoCore;
        spinAmounts = [0, 10 ether, 200 ether, 2000 ether, 10000 ether, 100000 ether];
        spinWeightsBps = [5000, 2500, 1500, 700, 200, 100];
    }

    function creditCoupons(address user, uint256 count) external onlySenso {
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
                    slt.mint(msg.sender, amount);
                }
                emit SpinExecuted(msg.sender, tier, amount, nonce);
                return (amount, tier);
            }
        }

        emit SpinExecuted(msg.sender, 0, 0, nonce);
        return (0, 0);
    }
}
