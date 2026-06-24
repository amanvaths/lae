// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MatrixStorage
 * @notice Storage layout, types, constants and events for the 14-Position Matrix
 *         MLM system with recycle cycles.
 *
 * @dev    DESIGN MODEL (read this before editing anything):
 *
 *  - This is a "14 Position Matrix" (positions 1..14), NOT a "12-slot" matrix.
 *    The word "slot" refers to the optional slot/upgrade progression
 *    (slot 1, slot 2, ...). The word "position" refers to the 14 fill spots
 *    inside a single matrix cycle. They are different concepts.
 *
 *  - A single matrix cycle is a 2x3 forced layout drawn as:
 *
 *                         OWNER (matrix owner)
 *                        /                    \
 *                      p1                      p2
 *                    /    \                  /    \
 *                  p3      p4              p5       p6
 *                 /  \    /  \           /  \      /  \
 *               p7  p8  p9  p10        p11  p12  p13  p14
 *
 *    Positions fill strictly left-to-right, level by level (BFS / level order):
 *    p1, p2, p3, ... p14.
 *
 *  - PLACEMENT is a single global BFS queue (a "company forced matrix").
 *    Each registered user owns one matrix node per cycle. New entrants are
 *    placed into the queue head's next free position. When the head fills all
 *    14 positions it is removed and (on recycle) re-queued for its next cycle.
 *    This guarantees: O(1) placement, exact left-to-right BFS order, exactly
 *    one placement per registration (no duplicates, no spillover ambiguity).
 *
 *  - The SPONSOR chain (referrer recorded at registration) is independent of
 *    placement and is used only for the position 1 / position 2 upline income.
 *
 *  - FUND CONSERVATION: every registration pays exactly `entryPrice` (X) once,
 *    and that single X funds exactly one position's income. 90% to the resolved
 *    receiver and 10% to the treasury (liquidity), except the treasury-only
 *    positions (4, 5 in cycle 1, and 14) where 100% goes to treasury.
 */
abstract contract MatrixStorage {
    // --------------------------------------------------------------------- //
    //                              CONSTANTS                                 //
    // --------------------------------------------------------------------- //

    /// @notice Number of fill positions in a single matrix cycle.
    uint8 internal constant MATRIX_SIZE = 14;

    /// @notice Basis points denominator.
    uint256 internal constant BPS = 10_000;

    /// @notice Treasury / liquidity cut applied to every 90/10 payout (10%).
    uint256 internal constant TREASURY_BPS = 1_000;

    // --------------------------------------------------------------------- //
    //                                TYPES                                   //
    // --------------------------------------------------------------------- //

    /**
     * @dev One matrix cycle for a user. `positions[1..14]` hold the user id of
     *      the occupant placed at that position; index 0 is unused so that the
     *      on-chain index matches the human position number.
     */
    struct MatrixCycle {
        uint8 filled; // number of positions filled so far (0..14)
        bool completed; // true once position 14 filled
        bool slot2Opened; // slot 2 opened from this cycle (cycle 1 only)
        uint32[15] positions; // positions[1..14] => occupant user id
    }

    /**
     * @dev A user record. `cycles[cycleId]` is keyed by 1-based cycle number.
     *      `slotActive[slotId]` tracks the slot/upgrade progression.
     */
    struct User {
        uint32 id;
        address wallet;
        uint32 sponsorId;
        uint32 currentCycle; // 1-based; the cycle currently being filled
        bool exists;
        bool blocked; // admin block => income lapses to ownerId
        uint32 directReferrals; // count of users that registered under this user
        uint32 highestSlot; // highest slot opened (starts at 1)
        // income accounting (units of payment token)
        uint128 totalEarned;
        uint128 totalCycles; // completed cycles
        mapping(uint256 => MatrixCycle) cycles;
        mapping(uint256 => bool) slotActive;
    }

    /// @dev A node awaiting placement fills in the global BFS queue.
    struct QueueNode {
        uint32 userId;
        uint32 cycleId;
    }

    /// @dev Lightweight income ledger entry kept for on-chain history reads.
    struct IncomeRecord {
        uint32 fromUserId; // entrant whose entry funded this income
        uint32 matrixOwnerId; // matrix in which the position was filled
        uint8 position; // 1..14
        uint8 kind; // 0=user income, 1=treasury, 2=lapsed
        uint128 amount;
    }

    // --------------------------------------------------------------------- //
    //                                STATE                                   //
    // --------------------------------------------------------------------- //

    /// @notice BEP-20 payment token (e.g. BTC token on BSC).
    address public paymentToken;

    /// @notice Entry price per registration (X). Immutable after construction.
    uint256 public entryPrice;

    /// @notice Treasury wallet: slot openings, recycle payments, treasury & 10% liquidity.
    address public treasuryWallet;

    /// @notice Root user id. Receives all lapsed income and is the tree root.
    uint32 public ownerId;

    /// @notice Auto-incrementing user id counter (owner = 1).
    uint32 public lastUserId;

    /// @notice Aggregate lapsed income routed to ownerId.
    uint256 public totalLapsedIncome;

    /// @notice Aggregate treasury income (all treasury-bound transfers).
    uint256 public totalTreasuryIncome;

    /// @notice Aggregate income distributed to users (the 90% legs).
    uint256 public totalUserIncome;

    /// @notice users by id.
    mapping(uint32 => User) internal users;

    /// @notice wallet => user id (0 = not registered).
    mapping(address => uint32) public userIdOf;

    /// @notice Global BFS placement queue.
    QueueNode[] internal placementQueue;

    /// @notice Index of the queue head currently being filled.
    uint256 public queueHead;

    /// @notice Per-user income history (ids).
    mapping(uint32 => IncomeRecord[]) internal incomeHistory;

    /// @notice Direct referral user ids per sponsor (for getDirectReferrals).
    mapping(uint32 => uint32[]) internal directReferralIds;

    // --------------------------------------------------------------------- //
    //                                EVENTS                                  //
    // --------------------------------------------------------------------- //

    event UserRegistered(uint32 indexed id, address indexed wallet, uint32 indexed sponsorId);
    event PositionFilled(uint32 indexed matrixOwnerId, uint32 cycle, uint8 position, uint32 occupantId);
    event IncomeDistributed(
        uint32 indexed fromUserId, uint32 indexed toUserId, uint8 position, uint256 amount
    );
    event TreasuryIncome(uint32 indexed matrixOwnerId, uint8 position, uint256 amount);
    event LapsedIncome(uint32 indexed intendedReceiverId, uint8 position, uint256 amount);
    event SlotOpened(uint32 indexed userId, uint256 slotId);
    event CycleCompleted(uint32 indexed userId, uint32 cycle);
    event RecycleStarted(uint32 indexed userId, uint32 newCycle);

    // --------------------------------------------------------------------- //
    //                          INTERNAL HELPERS                              //
    // --------------------------------------------------------------------- //

    /// @dev Returns the wallet for a user id (zero if none).
    function _walletOf(uint32 id) internal view returns (address) {
        return users[id].wallet;
    }

    /// @dev True if `id` is a usable income receiver (exists, not blocked).
    function _isReceivable(uint32 id) internal view returns (bool) {
        if (id == 0) return false;
        User storage u = users[id];
        return u.exists && !u.blocked && u.wallet != address(0);
    }

    /// @dev nth sponsor up the referral chain (n>=1). Returns 0 if chain ends.
    function _uplineOf(uint32 id, uint256 n) internal view returns (uint32) {
        uint32 cur = id;
        for (uint256 i = 0; i < n; i++) {
            cur = users[cur].sponsorId;
            if (cur == 0) return 0;
        }
        return cur;
    }

    /// @dev First child of a user = position 1 occupant of their first cycle.
    function _firstChild(uint32 id) internal view returns (uint32) {
        if (id == 0) return 0;
        return users[id].cycles[1].positions[1];
    }
}
