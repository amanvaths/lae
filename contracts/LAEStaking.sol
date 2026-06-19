// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./LAEToken.sol";

interface ILAEPackages {
    function clubPackages(address user, uint8 level)
        external
        view
        returns (bool owned, bool isManual, uint32 cyclesCompleted);
}

/**
 * @title LAEStaking — 365-day LAE lock (PDF: club level 10+ OR 5M LAE minimum)
 */
contract LAEStaking {
    LAEToken public immutable laeToken;
    address public immutable laeCore;

    uint256 public constant LOCK_DURATION = 365 days;
    uint256 public constant MIN_TOKENS = 5_000_000 ether;
    uint8 public constant MIN_CLUB_LEVEL = 10;

    struct Stake {
        uint256 amount;
        uint64 lockEnd;
        bool released;
    }

    mapping(address => Stake[]) public stakes;

    event Staked(address indexed user, uint256 amount, uint64 lockEnd, uint256 stakeIndex);
    event Released(address indexed user, uint256 amount, uint256 stakeIndex);

    constructor(address _laeToken, address _laeCore) {
        require(_laeToken != address(0) && _laeCore != address(0), "Zero addr");
        laeToken = LAEToken(_laeToken);
        laeCore = _laeCore;
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Zero");
        require(_eligible(msg.sender, amount), "Ineligible");
        require(laeToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint64 lockEnd = uint64(block.timestamp + LOCK_DURATION);
        stakes[msg.sender].push(Stake({amount: amount, lockEnd: lockEnd, released: false}));
        emit Staked(msg.sender, amount, lockEnd, stakes[msg.sender].length - 1);
    }

    function release(uint256 index) external {
        Stake storage s = stakes[msg.sender][index];
        require(!s.released, "Released");
        require(block.timestamp >= s.lockEnd, "Locked");
        s.released = true;
        require(laeToken.transfer(msg.sender, s.amount), "Transfer failed");
        emit Released(msg.sender, s.amount, index);
    }

    function stakeCount(address user) external view returns (uint256) {
        return stakes[user].length;
    }

    function _eligible(address user, uint256 amount) internal view returns (bool) {
        if (amount >= MIN_TOKENS) return true;
        for (uint8 l = MIN_CLUB_LEVEL; l <= 12; l++) {
            (bool owned,,) = ILAEPackages(laeCore).clubPackages(user, l);
            if (owned) return true;
        }
        return false;
    }
}
