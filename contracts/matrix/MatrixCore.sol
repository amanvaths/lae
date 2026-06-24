// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {MatrixPlacement} from "./MatrixPlacement.sol";

/**
 * @title MatrixCore
 * @notice 14 Position Matrix MLM system with recycle cycles (positions 1..14).
 *         Entry is paid in a BEP-20 payment token (e.g. BTC token on BSC).
 *
 * @dev Deployable entry point. Wires the storage/placement/income/recycle
 *      modules to public registration, admin controls and view functions.
 *
 *      Two system wallets:
 *        - ownerId       : root user, receives all lapsed income.
 *        - treasuryWallet: slot openings, recycle payments, treasury income,
 *                          and the 10% liquidity cut from every payout.
 */
contract MatrixCore is MatrixPlacement, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /**
     * @param _paymentToken   BEP-20 payment token address.
     * @param _entryPrice     Entry amount X in token base units (e.g. 0.001 BTC
     *                        token = 1e15 if the token has 18 decimals).
     * @param _treasuryWallet Treasury wallet.
     * @param _rootWallet     Wallet of the root user (ownerId).
     * @param _admin          Contract admin (OpenZeppelin Ownable owner).
     */
    constructor(
        address _paymentToken,
        uint256 _entryPrice,
        address _treasuryWallet,
        address _rootWallet,
        address _admin
    ) Ownable(_admin) {
        require(_paymentToken != address(0), "token=0");
        require(_treasuryWallet != address(0), "treasury=0");
        require(_rootWallet != address(0), "root=0");
        require(_entryPrice > 0, "price=0");

        paymentToken = _paymentToken;
        entryPrice = _entryPrice;
        treasuryWallet = _treasuryWallet;
        _initRoot(_rootWallet);
    }

    // --------------------------------------------------------------------- //
    //                              REGISTRATION                             //
    // --------------------------------------------------------------------- //

    /**
     * @notice Register `msg.sender` under `sponsorWallet`, paying `entryPrice`.
     * @dev The caller must first approve this contract for `entryPrice` of the
     *      payment token. Placement is automatic (global BFS); sponsor is used
     *      only for the position 1 / position 2 upline income.
     */
    function register(address sponsorWallet) external whenNotPaused nonReentrant {
        require(userIdOf[msg.sender] == 0, "already registered");
        uint32 sponsorId = userIdOf[sponsorWallet];
        require(sponsorId != 0, "invalid sponsor");

        // Pull the entry amount into the contract, then distribute.
        IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), entryPrice);

        uint32 id = _createUser(msg.sender, sponsorId);
        placementQueue.push(QueueNode({userId: id, cycleId: 1}));
        _placeEntrant(id);
    }

    // --------------------------------------------------------------------- //
    //                            ADMIN FUNCTIONS                            //
    // --------------------------------------------------------------------- //

    function setTreasuryWallet(address _treasury) external onlyOwner {
        require(_treasury != address(0), "treasury=0");
        treasuryWallet = _treasury;
    }

    function setOwnerId(uint32 _ownerId) external onlyOwner {
        require(users[_ownerId].exists, "owner !exists");
        ownerId = _ownerId;
    }

    function setBlocked(uint32 userId, bool blocked) external onlyOwner {
        require(users[userId].exists, "user !exists");
        users[userId].blocked = blocked;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Rescue tokens accidentally sent to the contract. Distribution is
    ///         atomic so the contract should never hold the payment token, but
    ///         this protects against stray transfers.
    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to=0");
        IERC20(token).safeTransfer(to, amount);
    }

    // --------------------------------------------------------------------- //
    //                            VIEW FUNCTIONS                             //
    // --------------------------------------------------------------------- //

    function getUserMatrix(uint32 id)
        external
        view
        returns (
            uint32 userId,
            address wallet,
            uint32 sponsorId,
            uint32 currentCycle,
            uint32 directReferrals,
            uint32 highestSlot,
            uint256 totalEarned,
            uint256 totalCycles
        )
    {
        User storage u = users[id];
        return (
            u.id,
            u.wallet,
            u.sponsorId,
            u.currentCycle,
            u.directReferrals,
            u.highestSlot,
            u.totalEarned,
            u.totalCycles
        );
    }

    /// @notice Occupant user ids for positions 1..14 (index 0 => position 1).
    function getCyclePositions(uint32 id, uint32 cycleId)
        external
        view
        returns (uint32[14] memory positions, uint8 filled, bool completed)
    {
        MatrixCycle storage c = users[id].cycles[cycleId];
        for (uint8 i = 0; i < MATRIX_SIZE; i++) {
            positions[i] = c.positions[i + 1];
        }
        return (positions, c.filled, c.completed);
    }

    function getCycleStatus(uint32 id, uint32 cycleId)
        external
        view
        returns (uint8 filled, bool completed, bool slot2Opened)
    {
        MatrixCycle storage c = users[id].cycles[cycleId];
        return (c.filled, c.completed, c.slot2Opened);
    }

    function getIncomeHistory(uint32 id) external view returns (IncomeRecord[] memory) {
        return incomeHistory[id];
    }

    /// @notice Paginated income history to bound gas/return size.
    function getIncomeHistoryPaged(uint32 id, uint256 offset, uint256 limit)
        external
        view
        returns (IncomeRecord[] memory page, uint256 total)
    {
        IncomeRecord[] storage hist = incomeHistory[id];
        total = hist.length;
        if (offset >= total) return (new IncomeRecord[](0), total);
        uint256 end = offset + limit;
        if (end > total) end = total;
        page = new IncomeRecord[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = hist[i];
        }
    }

    function getSlotStatus(uint32 id, uint256 slotId)
        external
        view
        returns (bool active, uint32 highestSlot)
    {
        User storage u = users[id];
        return (u.slotActive[slotId], u.highestSlot);
    }

    function getDirectReferrals(uint32 id) external view returns (uint32[] memory) {
        return directReferralIds[id];
    }

    /// @notice Placement queue introspection (for indexers / debugging).
    function getPlacementInfo()
        external
        view
        returns (uint256 head, uint256 length, uint32 headUserId, uint32 headCycleId)
    {
        head = queueHead;
        length = placementQueue.length;
        if (head < length) {
            headUserId = placementQueue[head].userId;
            headCycleId = placementQueue[head].cycleId;
        }
    }

    /// @notice Global accounting snapshot for reconciliation/audits.
    function getGlobalStats()
        external
        view
        returns (
            uint32 totalUsers,
            uint256 userIncome,
            uint256 treasuryIncome,
            uint256 lapsedIncome
        )
    {
        return (lastUserId, totalUserIncome, totalTreasuryIncome, totalLapsedIncome);
    }
}
