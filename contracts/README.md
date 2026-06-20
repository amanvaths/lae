# LAE Club Smart Contracts

Two contracts only — a 15-slot smart matrix + the LAE reward token. **No NFTs.**

| Contract | Purpose |
|---|---|
| `LAEClubMatrix.sol` | 15-slot · 14-spot smart matrix, BTC payment split + LAE reward vesting |
| `LAECoin.sol` | 500,000 cap token (450,000 reward pool to matrix · 50,000 liquidity) |

## Plan (from LAE Club deck)

- **15 slots**, each a 14-position recycling matrix. Slot 1 = 0.001 BTC, doubling to slot 15 (16.384 BTC).
- Every payment: **90%** distributed through the matrix, **10%** to liquidity → mints a **LAE reward** allocation.
- LAE released over **20 months** (5%/month); each month unlocks after one more direct referral.
- "Club Pool" collects spot-4 income on recycle cycles. Platform treasury collects owner-matrix spillover.

## Deploy order

1. `LAECoin` — set treasury/liquidity/operations wallets
2. `LAEClubMatrix` — constructor: `(owner, paymentToken, clubPool, platformTreasury)`
3. On `LAECoin`: `setMatrixContract(matrix)` → `bootstrapSupply()`
4. On matrix: `setLaeCoin(laeAddress)` + `setLiquidityPool(liquidityWallet)`

## Compile

```bash
node contracts/compile-check.js
```

See `DEPLOY.md` for full deployment notes.
