// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MatrixIncome} from "./MatrixIncome.sol";

/**
 * @title MatrixRecycle
 * @notice Completes a cycle when position 14 is filled and re-queues the user
 *         for a fresh cycle (recycle / re-entry).
 *
 * @dev A user's cycles are independent and sequential: cycle 1, 2, 3, ...
 *      Completing a cycle simply opens the next one and appends the user's new
 *      node to the global placement queue so it can be filled again. The
 *      position-14 income itself is handled in MatrixIncome (100% treasury).
 */
abstract contract MatrixRecycle is MatrixIncome {
    /// @dev Marks `cycleId` complete and starts the user's next cycle.
    function _completeAndRecycle(uint32 userId, uint32 cycleId) internal returns (uint32 newCycle) {
        User storage u = users[userId];
        u.cycles[cycleId].completed = true;
        u.totalCycles += 1;
        emit CycleCompleted(userId, cycleId);

        newCycle = cycleId + 1;
        u.currentCycle = newCycle;
        // New MatrixCycle storage is implicitly zero-initialized on first write.
        placementQueue.push(QueueNode({userId: userId, cycleId: newCycle}));
        emit RecycleStarted(userId, newCycle);
    }
}
