"use strict";
/**
 * Faithful JS re-implementation of LAEClubMatrix.sol — genealogy placement across
 * all active levels, frontier income, recycle-pay priority on slot 14.
 */

const LAST_LEVEL = 15;
const MATRIX_SIZE = 14;
const BPS = 10000n;
const MATRIX_BPS = 9000n;
const AMOUNT = 1000000000000000n;

function levelCost(level) {
  return AMOUNT * (2n ** BigInt(level - 1));
}

function matrixShare(amount) {
  return (amount * MATRIX_BPS) / BPS;
}

class Reference {
  constructor() {
    this.users = new Map();
    this.lastUserId = 2;
    this.ownerId = 1;
    this.totalUserIncome = 0n;
    this.totalTreasuryIncome = 0n;
    this.totalLapsedIncome = 0n;
    this.registrations = 0;
    this.payouts = [];
    this.placements = [];
    this.violations = [];
    this._newUser(1, 0);
  }

  _err(m) { this.violations.push(m); }

  _emptyBoard() {
    return { slots: [], reinvestCount: 0, totalFilled: 0, heldTokenForUpgrade: 0n };
  }

  _totalHeld() {
    let sum = 0n;
    for (const u of this.users.values()) {
      for (let lv = 1; lv <= LAST_LEVEL; lv++) {
        sum += u.boards[lv].heldTokenForUpgrade;
      }
    }
    return sum;
  }

  _newUser(id, referrerId) {
    const boards = {};
    for (let lv = 1; lv <= LAST_LEVEL; lv++) boards[lv] = this._emptyBoard();
    const activeLevels = {};
    if (id === this.ownerId) {
      for (let lv = 1; lv <= LAST_LEVEL; lv++) activeLevels[lv] = true;
    } else {
      activeLevels[1] = true;
    }
    const u = {
      id,
      referrerId,
      directReferrals: [],
      boards,
      activeLevels,
      totalEarning: 0n,
      totalIncome: 0n,
    };
    Object.defineProperty(u, "reinvestCount", {
      get() { return u.boards[1].reinvestCount; },
    });
    Object.defineProperty(u, "slots", {
      get() { return u.boards[1].slots; },
    });
    Object.defineProperty(u, "totalFilled", {
      get() { return u.boards[1].totalFilled; },
    });
    this.users.set(id, u);
    return u;
  }

  _board(id, level) {
    return this.users.get(id).boards[level];
  }

  _uplineOf(id, k) {
    let cur = id;
    for (let i = 0; i < k; i++) {
      cur = this.users.get(cur).referrerId;
      if (cur === 0) return 0;
    }
    return cur;
  }

  _directDownline(boardOwnerId, index) {
    const d = this.users.get(boardOwnerId).directReferrals;
    if (index >= d.length) return 0;
    return d[index];
  }

  _targetForPosition13(boardOwnerId) {
    const directs = this.users.get(boardOwnerId).directReferrals;
    let firstAny = 0;
    for (const di of directs) {
      for (const cj of this.users.get(di).directReferrals) {
        if (firstAny === 0) firstAny = cj;
        if (this._isEligible(cj)) return cj;
      }
    }
    return firstAny;
  }

  _isEligible(id) {
    if (id === 0) return false;
    if (id === this.ownerId) return true;
    return this.users.get(id).directReferrals.length >= 2;
  }

  _snapshotForTarget(targetId) {
    const m = new Map();
    let cur = targetId;
    for (let i = 0; i < 3; i++) {
      if (cur === 0) break;
      m.set(cur, this.users.get(cur).directReferrals.length);
      cur = this.users.get(cur).referrerId;
    }
    return m;
  }

  _sendTreasury(amount, fromId, boardOwnerId, slot, kind, recycledAtPay, directSnap, intendedTarget = 0, boardLevel = 1) {
    const share = matrixShare(amount);
    this.totalTreasuryIncome += share;
    this.payouts.push({
      fromId, boardOwnerId, slot, kind, receiverId: 0, amount: share, treasury: true,
      recycledAtPay, directSnap, intendedTarget: 0, boardLevel,
    });
  }

  _sendDividends(receiverId, amount, fromId, boardOwnerId, slot, kind, viaLapse, recycledAtPay, directSnap, intendedTarget, boardLevel = 1) {
    const share = matrixShare(amount);
    const u = this.users.get(receiverId);
    u.totalIncome += share;
    u.totalEarning += share;
    this.totalUserIncome += share;
    if (viaLapse) this.totalLapsedIncome += share;
    this.payouts.push({
      fromId, boardOwnerId, slot, kind, receiverId, amount: share, treasury: false,
      recycledAtPay, directSnap, intendedTarget, boardLevel,
    });
  }

  _resolveRecipient(targetId, directSnap) {
    let cur = targetId;
    for (let i = 0; i < 3; i++) {
      if (cur === 0) break;
      const eligible = cur === this.ownerId || (directSnap.get(cur) || 0) >= 2;
      if (eligible) return { recipientId: cur, isTreasury: false, viaLapse: i > 0 };
      cur = this.users.get(cur).referrerId;
    }
    return { recipientId: 0, isTreasury: true, viaLapse: false };
  }

  _payResolved(targetId, fromId, boardOwnerId, slot, kind, amount, recycledAtPay, directSnap, boardLevel = 1) {
    const r = this._resolveRecipient(targetId, directSnap);
    if (r.isTreasury) {
      this._sendTreasury(amount, fromId, boardOwnerId, slot, "lapse-treasury", recycledAtPay, directSnap, targetId, boardLevel);
    } else {
      this._sendDividends(r.recipientId, amount, fromId, boardOwnerId, slot, kind, r.viaLapse, recycledAtPay, directSnap, targetId, boardLevel);
    }
  }

  _payTreasurySlotToUpline1(fromId, boardOwnerId, slot, kind, amount, recycledAtPay, boardLevel = 1) {
    const upline1 = this._uplineOf(boardOwnerId, 1);
    if (upline1 === 0) {
      this._sendTreasury(amount, fromId, boardOwnerId, slot, kind, recycledAtPay, new Map(), 0, boardLevel);
      return;
    }
    const snap = this._snapshotForTarget(upline1);
    this._payResolved(upline1, fromId, boardOwnerId, slot, kind, amount, recycledAtPay, snap, boardLevel);
  }

  _payByRole(fromId, boardOwnerId, slot, boardLevel = 1, feeLevel = 1) {
    const amount = levelCost(boardLevel);
    const recycledAtPay = this._board(boardOwnerId, boardLevel).reinvestCount > 0;

    if (slot === 4 && !recycledAtPay) {
      if (boardLevel === 1) {
        this._holdHalfForNextLevel(fromId, boardOwnerId, slot, boardLevel);
      } else {
        this._payTreasurySlotToUpline1(fromId, boardOwnerId, slot, "treasury-slot4", amount, recycledAtPay, boardLevel);
      }
      return;
    }
    if (slot === 5 && !recycledAtPay) {
      if (boardLevel === 1) {
        this._holdHalfAndFundUplineNextLevel(fromId, boardOwnerId, slot, boardLevel);
      } else {
        this._payTreasurySlotToUpline1(fromId, boardOwnerId, slot, "treasury-slot5c1", amount, recycledAtPay, boardLevel);
      }
      return;
    }
    if (slot === 4 && recycledAtPay) {
      this._sendTreasury(amount, fromId, boardOwnerId, slot, "treasury-slot4c2", recycledAtPay, new Map(), 0, boardLevel);
      return;
    }
    if (slot === 14) {
      this._payTreasurySlotToUpline1(fromId, boardOwnerId, slot, "treasury-slot14", amount, recycledAtPay, boardLevel);
      return;
    }
    if (slot === 5) {
      const snap = this._snapshotForTarget(boardOwnerId);
      this._payResolved(boardOwnerId, fromId, boardOwnerId, slot, "self-slot5c2", amount, recycledAtPay, snap, boardLevel);
      return;
    }

    let target;
    if (slot === 1) { target = this._uplineOf(boardOwnerId, 1); if (target === 0) target = this.ownerId; }
    else if (slot === 2) { target = this._uplineOf(boardOwnerId, 2); if (target === 0) target = this.ownerId; }
    else if (slot === 7) { target = this._directDownline(boardOwnerId, 0); if (target === 0) target = boardOwnerId; }
    else if (slot === 10) { target = this._directDownline(boardOwnerId, 1); if (target === 0) target = boardOwnerId; }
    else if (slot === 13) {
      target = this._targetForPosition13(boardOwnerId);
      if (target === 0) {
        this._sendTreasury(amount, fromId, boardOwnerId, slot, "treasury-slot13", recycledAtPay, new Map(), 0, boardLevel);
        return;
      }
    } else if (slot === 3 || slot === 6 || slot === 8 || slot === 9 || slot === 11 || slot === 12) {
      target = boardOwnerId;
    } else {
      this._sendTreasury(amount, fromId, boardOwnerId, slot, "treasury-other", recycledAtPay, new Map(), 0, boardLevel);
      return;
    }
    const snap = this._snapshotForTarget(target);
    this._payResolved(target, fromId, boardOwnerId, slot, "role", amount, recycledAtPay, snap, boardLevel);
  }

  _holdHalfForNextLevel(fromId, boardOwnerId, slot, boardLevel) {
    if (boardLevel >= LAST_LEVEL) {
      this._sendTreasury(levelCost(boardLevel), fromId, boardOwnerId, slot, "treasury-slot4max", false, new Map(), 0, boardLevel);
      return;
    }
    const holdShare = matrixShare(AMOUNT);
    this._board(boardOwnerId, boardLevel).heldTokenForUpgrade += holdShare;
    this.payouts.push({
      fromId, boardOwnerId, slot, kind: "hold-slot4", receiverId: 0, amount: holdShare, treasury: false,
      recycledAtPay: false, directSnap: new Map(), intendedTarget: 0, boardLevel, held: true,
    });
  }

  _holdHalfAndFundUplineNextLevel(fromId, boardOwnerId, slot, boardLevel) {
    if (boardLevel >= LAST_LEVEL) {
      this._sendTreasury(levelCost(boardLevel), fromId, boardOwnerId, slot, "treasury-slot5max", false, new Map(), 0, boardLevel);
      return;
    }
    const nextLevel = boardLevel + 1;
    const holdShare = matrixShare(AMOUNT);
    const b = this._board(boardOwnerId, boardLevel);
    b.heldTokenForUpgrade += holdShare;
    const releaseNominal = levelCost(nextLevel);
    const releaseShare = matrixShare(releaseNominal);
    if (b.heldTokenForUpgrade < releaseShare) {
      this.payouts.push({
        fromId, boardOwnerId, slot, kind: "hold-slot5partial", receiverId: 0, amount: holdShare, treasury: false,
        recycledAtPay: false, directSnap: new Map(), intendedTarget: 0, boardLevel, held: true,
      });
      return;
    }
    b.heldTokenForUpgrade -= releaseShare;
    const upline1 = this._uplineOf(boardOwnerId, 1);
    if (upline1 === 0) {
      this._sendTreasury(releaseNominal, fromId, boardOwnerId, slot, "treasury-slot5c1", false, new Map(), 0, nextLevel);
      return;
    }
    const snap = this._snapshotForTarget(upline1);
    this._payResolved(upline1, fromId, boardOwnerId, slot, "fund-upline-next-level", releaseNominal, false, snap, nextLevel);
  }

  _appendBoard(boardOwnerId, memberId, level) {
    const b = this._board(boardOwnerId, level);
    b.slots.push(memberId);
    b.totalFilled += 1;
    return b.slots.length;
  }

  _shouldPlaceOnBoard(boardOwnerId, memberId, level) {
    if (this._board(boardOwnerId, level).reinvestCount === 0) return true;
    return this.users.get(memberId).referrerId === boardOwnerId;
  }

  _placeRecycledMemberOnUplines(recycledMemberId, level) {
    let cur = this.users.get(recycledMemberId).referrerId;
    for (let hops = 0; cur !== 0 && hops < 60; hops++) {
      const u = this.users.get(cur);
      if (u.activeLevels[level] && this._board(cur, level).reinvestCount > 0) {
        const rc = this._board(cur, level).reinvestCount;
        const slot = this._appendBoard(cur, recycledMemberId, level);
        this.placements.push({
          fromId: recycledMemberId,
          boardOwnerId: cur,
          slot,
          level,
          cycle: rc + 1,
          recycleCarry: true,
        });
        this._afterFill(cur, slot, recycledMemberId, level);
      }
      cur = u.referrerId;
    }
  }

  _unlockNextLevel(userId, nextLevel) {
    if (nextLevel > LAST_LEVEL) return;
    const u = this.users.get(userId);
    if (u.activeLevels[nextLevel]) return;
    u.activeLevels[nextLevel] = true;
    this._placeMemberAtLevel(userId, nextLevel, false);
  }

  _afterFill(boardOwnerId, slot, memberId, level) {
    if (slot === 5) this._unlockNextLevel(boardOwnerId, level + 1);
    if (slot === MATRIX_SIZE) {
      const b = this._board(boardOwnerId, level);
      b.slots = [];
      b.reinvestCount += 1;
      this._placeRecycledMemberOnUplines(boardOwnerId, level);
    }
  }

  _processBoardPlacement(memberId, boardOwnerId, level, doPay, targets) {
    const rc = this._board(boardOwnerId, level).reinvestCount;
    const slot = this._appendBoard(boardOwnerId, memberId, level);
    this.placements.push({
      fromId: memberId,
      boardOwnerId,
      slot,
      level,
      cycle: rc + 1,
      boardRcAtPlace: rc,
    });

    if (doPay) {
      if (rc > 0 && this.users.get(memberId).referrerId === boardOwnerId && targets.directOwner === 0) {
        targets.directOwner = boardOwnerId;
        targets.directSlot = slot;
        targets.directLevel = level;
      }
      if (slot === MATRIX_SIZE && targets.recyclePayOwner === 0) {
        targets.recyclePayOwner = boardOwnerId;
        targets.recyclePaySlot = slot;
        targets.recyclePayLevel = level;
      }
      if (level === 1) {
        if (rc < targets.minReinvest) {
          targets.minReinvest = rc;
          targets.frontierOwner = boardOwnerId;
          targets.frontierSlot = slot;
          targets.frontierLevel = level;
        } else if (rc === targets.minReinvest && rc === 0) {
          targets.frontierOwner = boardOwnerId;
          targets.frontierSlot = slot;
          targets.frontierLevel = level;
        }
      }
    }

    this._afterFill(boardOwnerId, slot, memberId, level);
    return targets;
  }

  _walkLevelPlacements(memberId, level, doPay, targets) {
    let cur = this.users.get(memberId).referrerId;
    for (let hops = 0; cur !== 0 && hops < 60; hops++) {
      const u = this.users.get(cur);
      if (u.activeLevels[level] && this._shouldPlaceOnBoard(cur, memberId, level)) {
        targets = this._processBoardPlacement(memberId, cur, level, doPay, targets);
      }
      cur = u.referrerId;
    }
    return targets;
  }

  _settleRegistrationPayment(memberId, targets, feeLevel = 1) {
    if (targets.recyclePayOwner !== 0) {
      this._payByRole(memberId, targets.recyclePayOwner, targets.recyclePaySlot, targets.recyclePayLevel, feeLevel);
    } else if (targets.directOwner !== 0) {
      this._payByRole(memberId, targets.directOwner, targets.directSlot, targets.directLevel, feeLevel);
    } else if (targets.frontierOwner !== 0) {
      this._payByRole(memberId, targets.frontierOwner, targets.frontierSlot, targets.frontierLevel, feeLevel);
    } else {
      this._sendTreasury(AMOUNT, memberId, 0, 0, "treasury-noboard", false, new Map(), 0, 1);
    }
  }

  _placeMemberAllLevels(memberId, doPay) {
    let targets = {
      minReinvest: Infinity,
      frontierOwner: 0,
      frontierSlot: 0,
      frontierLevel: 1,
      directOwner: 0,
      directSlot: 0,
      directLevel: 1,
      recyclePayOwner: 0,
      recyclePaySlot: 0,
      recyclePayLevel: 1,
    };
    for (let level = 1; level <= LAST_LEVEL; level++) {
      targets = this._walkLevelPlacements(memberId, level, doPay, targets);
    }
    if (!doPay) return;
    this._settleRegistrationPayment(memberId, targets);
  }

  _placeMemberAtLevel(memberId, level, doPay) {
    let targets = {
      minReinvest: Infinity,
      frontierOwner: 0,
      frontierSlot: 0,
      frontierLevel: level,
      directOwner: 0,
      directSlot: 0,
      directLevel: level,
      recyclePayOwner: 0,
      recyclePaySlot: 0,
      recyclePayLevel: level,
    };
    targets = this._walkLevelPlacements(memberId, level, doPay, targets);
    if (!doPay) return;
    this._settleRegistrationPayment(memberId, targets);
  }

  register(referrerId) {
    if (!this.users.has(referrerId)) throw new Error(`invalid referrer ${referrerId}`);
    const id = this.lastUserId;
    this._newUser(id, referrerId);
    this.users.get(referrerId).directReferrals.push(id);
    this.lastUserId += 1;
    this.registrations += 1;
    this._placeMemberAllLevels(id, true);
    return id;
  }
}

module.exports = { Reference, AMOUNT, levelCost, MATRIX_BPS, BPS, matrixShare, MATRIX_SIZE, LAST_LEVEL };
