// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MatrixRecycle} from "./MatrixRecycle.sol";

/**
 * @title MatrixPlacement
 * @notice Global BFS placement engine.
 *
 * @dev The placement queue is a FIFO of matrix nodes (userId, cycleId). New
 *      entrants always fill the head node's next free position (1..14). When the
 *      head node reaches position 14 it is completed/recycled and the head
 *      pointer advances. Because every registration appends the entrant's own
 *      cycle-1 node BEFORE placing it, the queue reproduces exact left-to-right
 *      level-order fill across the whole company tree:
 *
 *        owner.c1, user2.c1, user3.c1, ... user15.c1, owner.c2, user2.c2, ...
 *
 *      Placement is O(1), every entrant fills exactly one position once, and no
 *      position can be filled twice.
 */
abstract contract MatrixPlacement is MatrixRecycle {
    /// @dev Initializes the root user (ownerId) and opens its first matrix.
    function _initRoot(address rootWallet) internal {
        require(lastUserId == 0, "root exists");
        lastUserId = 1;
        uint32 id = 1;
        User storage u = users[id];
        u.id = id;
        u.wallet = rootWallet;
        u.sponsorId = 0;
        u.currentCycle = 1;
        u.exists = true;
        u.highestSlot = 1;
        u.slotActive[1] = true;
        userIdOf[rootWallet] = id;
        ownerId = id;
        placementQueue.push(QueueNode({userId: id, cycleId: 1}));
        emit UserRegistered(id, rootWallet, 0);
    }

    /// @dev Creates a new user record (does not place it).
    function _createUser(address wallet, uint32 sponsorId) internal returns (uint32 id) {
        lastUserId += 1;
        id = lastUserId;
        User storage u = users[id];
        u.id = id;
        u.wallet = wallet;
        u.sponsorId = sponsorId;
        u.currentCycle = 1;
        u.exists = true;
        u.highestSlot = 1;
        u.slotActive[1] = true;
        userIdOf[wallet] = id;
        if (sponsorId != 0) {
            users[sponsorId].directReferrals += 1;
            directReferralIds[sponsorId].push(id);
        }
        emit UserRegistered(id, wallet, sponsorId);
    }

    /// @dev Places `entrantId` into the current queue head, distributes income,
    ///      and recycles the head matrix if it just completed.
    function _placeEntrant(uint32 entrantId) internal {
        QueueNode storage head = placementQueue[queueHead];
        uint32 M = head.userId;
        uint32 c = head.cycleId;

        MatrixCycle storage cyc = users[M].cycles[c];
        uint8 position = cyc.filled + 1; // 1..14
        cyc.positions[position] = entrantId;
        cyc.filled = position;
        emit PositionFilled(M, c, position, entrantId);

        _distributeIncome(M, c, position, entrantId);

        if (position == MATRIX_SIZE) {
            queueHead += 1; // advance head; node is now full
            _completeAndRecycle(M, c);
        }
    }
}
