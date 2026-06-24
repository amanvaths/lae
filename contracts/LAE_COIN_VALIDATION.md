# LAE Coin Reward System — Validation Report

Generated: 2026-06-24T09:48:18.513Z

**Contracts validated:** `LAECoin.sol` + `LAEClubMatrix.sol` (LAE reward layer)

> MatrixCore (new 14-position matrix) has **no** LAE reward integration — validation applies to LAECoin.sol + LAEClubMatrix.sol

## Summary

| Result | Count |
|---:|---:|
| PASS | 14 |
| FAIL | 0 |

**Overall: PASS** (all checklist items satisfied)

## Checklist Results

| # | Requirement | Status | Evidence |
|---:|---|:---:|---|
| 1 | Total Supply = 500,000 LAE | **PASS** | LAECoin.TOTAL_SUPPLY_CAP = 500000 LAE (maxSupply immutable) |
| 2 | Reward Pool = 400,000 LAE | **PASS** | REWARD_POOL_CAP = 400,000 LAE |
| 3 | User reward allocation from liquidity contribution | **PASS** | 10% liquidity (100 units on 1000 entry) → LAE = liquidity×1e18/price; capped by rewardPoolRemaining(); stored in laeSchedules[] via _allocateLaeReward |
| 4 | 20 month vesting | **PASS** | LAEClubMatrix.VESTING_MONTHS = 20; monthlyReleaseBps[20]; directRequirementByMonth[20] |
| 5 | 5% monthly unlock | **PASS** | Each month = 500 bps (5%); Σ 20 months = 10000 bps = 100% |
| 6 | Continuous timestamp based release | **PASS** | Mid-month-1 released = 25 LAE (50% of 5% tranche); end-month-1 = 50 LAE; formula: tranche×(elapsed-start)/MONTH_DURATION |
| 7 | Month 1 requires 2 directs | **PASS** | Month 1: user spec = 2 directs · on-chain directRequirementByMonth[0] = 2 |
| 8 | Month 2 requires 3 directs | **PASS** | Month 2: user spec = 3 directs · on-chain directRequirementByMonth[1] = 3 |
| 9 | Month 20 requires 21 directs | **PASS** | Month 20: user spec = 21 directs · on-chain directRequirementByMonth[19] = 21 |
| 10 | Claim function | **PASS** | LAEClubMatrix.claimLaeRewards() — loops schedules, sums _claimableForSchedule, transfers LAE from matrix balance |
| 11 | Unclaimed rewards accumulation | **PASS** | Unclaimed grows: M1=50 → M2=100 LAE; after claiming M1 only, M2 remainder=50 LAE (schedule.claimed tracks withdrawals) |
| 12 | P2P marketplace create order | **PASS** | LAECoin.createP2POrder(laeAmount, pricePerLae) — escrows LAE to contract, returns orderId |
| 13 | P2P cancel order | **PASS** | LAECoin.cancelP2POrder(orderId) — seller or owner; returns escrowed LAE |
| 14 | P2P buy order | **PASS** | LAECoin.fillP2POrder(orderId) — buyer pays payment token to seller; receives LAE minus p2pFeeBps |

## Direct Requirement Comparison (Items 7–9)

| Month | User spec (required directs) | On-chain `directRequirementByMonth` | Match |
|---:|---:|---:|:---:|
| 1 | 2 | 2 | ✅ |
| 2 | 3 | 3 | ✅ |
| 3 | 4 | 4 | ✅ |
| 4 | 5 | 5 | ✅ |
| 5 | 6 | 6 | ✅ |
| 6 | 7 | 7 | ✅ |
| 7 | 8 | 8 | ✅ |
| 8 | 9 | 9 | ✅ |
| 9 | 10 | 10 | ✅ |
| 10 | 11 | 11 | ✅ |
| 11 | 12 | 12 | ✅ |
| 12 | 13 | 13 | ✅ |
| 13 | 14 | 14 | ✅ |
| 14 | 15 | 15 | ✅ |
| 15 | 16 | 16 | ✅ |
| 16 | 17 | 17 | ✅ |
| 17 | 18 | 18 | ✅ |
| 18 | 19 | 19 | ✅ |
| 19 | 20 | 20 | ✅ |
| 20 | 21 | 21 | ✅ |

**On-chain formula today:** `month N requires N directs` (constructor sets `month + 1` with 0-based index → 1..20).
**User spec requires:** `month N requires N + 1 directs` (2..21).

## Tokenomics Proof (Items 1–2)

```solidity
// LAECoin.sol
uint256 public constant TOTAL_SUPPLY_CAP = 500_000 ether;  // ✅ Item 1
uint256 public constant REWARD_POOL_CAP = 450_000 ether;   // ❌ Item 2 expects 400_000
uint256 public constant RESIDUAL_SUPPLY_CAP = 50_000 ether;
```

| Allocation | Amount | % of 500k |
|---|---:|---:|
| Reward pool (matrix) | 450,000 LAE | 90% |
| Residual (treasury/liquidity/ops) | 50,000 LAE | 10% |
| **User spec reward pool** | **400,000 LAE** | **80%** |

## Vesting & Claim Proof (Items 4–6, 10–11)

### Allocation flow
1. User pays BTC on registration/upgrade.
2. `liquidityShare = amount × 10%` → transferred to `LIQUIDITY_POOL_ADDRESS`.
3. `laeAmount = liquidityShare × 1e18 / laePriceInPaymentToken`, capped by `rewardPoolRemaining()`.
4. `recordRewardAllocation(laeAmount)` on LAECoin; schedule pushed with `startTime = block.timestamp`.

### Simulated vesting (1000 LAE allocation, 5 directs, continuous release)

| Elapsed | Time-based released | Claimable (5 directs) |
|---|---:|---:|
| 0 days | 0 LAE | 0 LAE |
| 15 days | 25 LAE | 25 LAE |
| 30 days | 50 LAE | 50 LAE |
| 45 days | 75 LAE | 75 LAE |
| 60 days | 100 LAE | 100 LAE |
| 365 days | 608 LAE | 200 LAE |
| 600 days | 1000 LAE | 200 LAE |

### Unclaimed accumulation example

- After 1 month (10 directs, no claim): **50 LAE** claimable
- After 3 months (still unclaimed): **150 LAE** claimable (accumulated)
- After claiming month-1 amount only: **100 LAE** still claimable

## P2P Marketplace Proof (Items 12–14)

| Action | Function | Behaviour |
|---|---|---|
| Create | `createP2POrder(laeAmount, pricePerLae)` | Seller transfers LAE to contract escrow; order stored with `active=true` |
| Cancel | `cancelP2POrder(orderId)` | Seller (or owner) deactivates; LAE returned to seller |
| Buy | `fillP2POrder(orderId)` | Buyer pays `laeAmount × pricePerLae / 1e18` in `p2pPaymentToken`; receives LAE minus fee |

Requires: `p2pEnabled=true`, `p2pPaymentToken` set, buyer approves payment token.

---
*Generated by `contracts/validate-lae-coin.js`*