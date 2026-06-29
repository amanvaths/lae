"use strict";
/**
 * Faithful JS re-implementation of LAEClubMatrix.sol — GENEALOGY placement +
 * FRONTIER income (the user's working model, income bug fixed).
 *
 * Placement: every new member on ALL upline boards (genealogy arrival order).
 * paid ONCE per registration from the upline board with minimum reinvestCount.
 * Ties at cycle 1 (rc==0) go to the highest upline; ties at cycle 2+ keep the
 * closest upline so each board earns from its own recycled cycle in parallel.
 */

const MATRIX_SIZE = 14;
const BPS = 10000n;
const MATRIX_BPS = 9000n;
const AMOUNT = 1000000000000000n;

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

  _newUser(id, referrerId) {
    const u = {
      id, referrerId, directReferrals: [],
      slots: [], reinvestCount: 0, totalFilled: 0,
      totalEarning: 0n, totalIncome: 0n,
    };
    this.users.set(id, u);
    return u;
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

  /** Snapshot direct counts only for target + lapse chain (memory-safe at 100k+). */
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

  _sendTreasury(amount, fromId, boardOwnerId, slot, kind, recycledAtPay, directSnap, intendedTarget = 0) {
    const share = matrixShare(amount);
    this.totalTreasuryIncome += share;
    this.payouts.push({ fromId, boardOwnerId, slot, kind, receiverId: 0, amount: share, treasury: true, recycledAtPay, directSnap, intendedTarget: 0 });
  }

  _sendDividends(receiverId, amount, fromId, boardOwnerId, slot, kind, viaLapse, recycledAtPay, directSnap, intendedTarget) {
    const share = matrixShare(amount);
    const u = this.users.get(receiverId);
    u.totalIncome += share;
    u.totalEarning += share;
    this.totalUserIncome += share;
    if (viaLapse) this.totalLapsedIncome += share;
    this.payouts.push({ fromId, boardOwnerId, slot, kind, receiverId, amount: share, treasury: false, recycledAtPay, directSnap, intendedTarget });
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

  _payResolved(targetId, fromId, boardOwnerId, slot, kind, amount, recycledAtPay, directSnap) {
    const r = this._resolveRecipient(targetId, directSnap);
    if (r.isTreasury) this._sendTreasury(amount, fromId, boardOwnerId, slot, "lapse-treasury", recycledAtPay, directSnap, targetId);
    else this._sendDividends(r.recipientId, amount, fromId, boardOwnerId, slot, kind, r.viaLapse, recycledAtPay, directSnap, targetId);
  }

  _payByRole(fromId, boardOwnerId, slot) {
    const amount = AMOUNT;
    const recycledAtPay = this.users.get(boardOwnerId).reinvestCount > 0;

    if (slot === 4 || slot === 14) {
      this._sendTreasury(amount, fromId, boardOwnerId, slot, "treasury-slot", recycledAtPay, new Map(), 0);
      return;
    }
    if (slot === 5) {
      if (!recycledAtPay) {
        this._sendTreasury(amount, fromId, boardOwnerId, slot, "treasury-slot5c1", recycledAtPay, new Map(), 0);
        return;
      }
      const snap = this._snapshotForTarget(boardOwnerId);
      this._payResolved(boardOwnerId, fromId, boardOwnerId, slot, "self-slot5c2", amount, recycledAtPay, snap);
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
        this._sendTreasury(amount, fromId, boardOwnerId, slot, "treasury-slot13", recycledAtPay, new Map(), 0);
        return;
      }
    } else if (slot === 3 || slot === 6 || slot === 8 || slot === 9 || slot === 11 || slot === 12) {
      target = boardOwnerId;
    } else {
      this._sendTreasury(amount, fromId, boardOwnerId, slot, "treasury-other", recycledAtPay, new Map(), 0);
      return;
    }
    const snap = this._snapshotForTarget(target);
    this._payResolved(target, fromId, boardOwnerId, slot, "role", amount, recycledAtPay, snap);
  }

  _appendBoard(boardOwnerId, memberId) {
    const b = this.users.get(boardOwnerId);
    b.slots.push(memberId);
    b.totalFilled += 1;
    return b.slots.length;
  }

  _afterFill(boardOwnerId, slot, memberId) {
    if (slot === MATRIX_SIZE) {
      const b = this.users.get(boardOwnerId);
      b.slots = [];
      b.reinvestCount += 1;
    }
  }

  _placeMember(memberId, doPay) {
    let cur = this.users.get(memberId).referrerId;
    let hops = 0;
    let paymentBoardOwner = 0;
    let paymentSlot = 0;
    let minReinvest = Infinity;

    while (cur !== 0 && hops < 60) {
      const rc = this.users.get(cur).reinvestCount;
      const slot = this._appendBoard(cur, memberId);
      this.placements.push({
        fromId: memberId,
        boardOwnerId: cur,
        slot,
        cycle: rc + 1,
      });
      if (doPay) {
        if (rc < minReinvest) {
          minReinvest = rc;
          paymentBoardOwner = cur;
          paymentSlot = slot;
        } else if (rc === minReinvest && rc === 0) {
          paymentBoardOwner = cur;
          paymentSlot = slot;
        }
      }
      this._afterFill(cur, slot, memberId);
      cur = this.users.get(cur).referrerId;
      hops++;
    }

    if (!doPay) return;
    if (paymentBoardOwner !== 0) this._payByRole(memberId, paymentBoardOwner, paymentSlot);
    else this._sendTreasury(AMOUNT, memberId, 0, 0, "treasury-noboard");
  }

  register(referrerId) {
    if (!this.users.has(referrerId)) throw new Error(`invalid referrer ${referrerId}`);
    const id = this.lastUserId;
    this._newUser(id, referrerId);
    this.users.get(referrerId).directReferrals.push(id);
    this.lastUserId += 1;
    this.registrations += 1;
    this._placeMember(id, true);
    return id;
  }
}

module.exports = { Reference, AMOUNT, MATRIX_BPS, BPS, matrixShare, MATRIX_SIZE };
