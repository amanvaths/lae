# Remix Deploy — LAE Club (2 contracts only)

**Total deploys: 2** (LAECoin + LAEClubMatrix). **No NFTs.**

---

## ⚡ MODEL B — BOARD DRIVES SLOT UNLOCK (only LAEClubMatrix)

> Two things are now cleanly separated:
>
> **1. INCOME (money) — single recipient per registration.** A member is placed
> under its own sponsor's leg (top→bottom / left→right) and the money is decided by
> the member's **position in its sponsor's board** using the role table:
> `1,2 = upline · 3,6,8,9,11,12 = self · 4,5,14 = treasury · 7,10 = 1st downline ·
> 13 = 2nd downline`. The earner receives it as real matrix income (shows on the
> dashboard, increments on-chain `totalIncome`).
>
> **2. PROGRESSION (slot unlock / recycle) — follows the DISPLAYED board.** When
> **your displayed board's position 5 fills** (even by spillover from your upline),
> **your next slot unlocks for FREE** (`_progressUpgrades` → `_upgradeLevel`,
> idempotent). When position 14 fills, the board records a recycle. So the slot
> unlock now matches exactly what the dashboard tree shows — fixing the case where
> "4th & 5th positions filled but slot 2 stayed locked".
>
> **LAECoin is unchanged — do NOT redeploy it.** The LAE reward + 10% liquidity
> split is untouched.
>
> ⚠️ **Known simplification:** the 3-generation board is capped at 14 slots, so a
> recycle records the completed cycle but does not yet hand the owner a brand-new
> board for further cycles. Rare in testing.

**Steps:**

1. **Compile** `LAEClubMatrix.sol` — Solidity **0.8.26**, Optimizer **ON (200)**, **Enable via IR ON**.
2. **Deploy** `LAEClubMatrix` with the same 4 constructor args (see table below). Save the new address → call it `NEW_MATRIX`.
3. **Wire on the NEW matrix:**
   ```
   setLaeCoin(0xD6698E6a8Ee4712cC2E36C150f1C34e59884C45A)
   setLiquidityPool(0xef9594fC5145404BfC7B5640296C3864319e3d86)
   ```
4. **Point LAECoin at the new matrix** (call on existing LAECoin `0xD6698E…`):
   ```
   setMatrixContract(NEW_MATRIX)
   setTaxExempt(NEW_MATRIX, true)
   ```
5. **Note the deploy block number** (from the deploy tx on BscScan) → `NEW_BLOCK`.
6. **Initialize partners** (if your old setup had initial partners) the same way you did originally.
7. **Rewire app** — update these 4 places with `NEW_MATRIX` (and `NEW_BLOCK`), then push:
   - `.github/workflows/deploy-vps.yml` → `NEXT_PUBLIC_LAE_MATRIX_CONTRACT`, `NEXT_PUBLIC_MATRIX_CORE_CONTRACT`
   - `.github/workflows/deploy-backend-vps.yml` → `LAE_MATRIX_CONTRACT_ADDRESS`, `MATRIX_CORE_CONTRACT_ADDRESS`, `INDEXER_START_BLOCK` (= `NEW_BLOCK`)
   - `lib/lae-club/contracts.ts` → fallback address
   - `contracts/deployed-bsc-testnet.json` → `LAEClubMatrix` + `deployBlock`
8. After backend redeploys, the indexer re-syncs from `NEW_BLOCK`. The matrix tree
   (`/api/matrix/tree`) now reads the corrected genealogy board automatically — **no
   frontend code change needed**.

> ⚠️ A new address = a **fresh contract**: all current test users (ID 1–28) start
> over on the new contract. This is expected (testnet).

---

## Compiler settings

| Setting | Value |
|---------|--------|
| Compiler | **0.8.26** |
| Optimization | **Enabled**, 200 runs |
| **Enable via IR** | **ON** (required for LAEClubMatrix) |

Upload these 2 files into Remix `contracts/` folder:

- `LAECoin.sol`
- `LAEClubMatrix.sol`

---

## Network

- **BSC Testnet** (Chain ID 97)
- MetaMask → Injected Provider in Remix
- Deployer needs testnet BNB

**Payment token (already deployed — do NOT redeploy):**

```
0xf8E556996042b34cc706F040c59955abB678995e
```

**Or deploy public test faucet token (any user can mint):**

See `TestPaymentToken.sol` — deploy with empty constructor, then on **LAEClubMatrix** call:

```
updateTokenAddress(<NEW_TEST_TOKEN>)
```

Script (owner wallet):

```bash
DEPLOYER_PRIVATE_KEY=0x... node contracts/deploy-test-token.mjs
```

Then set `NEXT_PUBLIC_PAYMENT_TOKEN` to the new address and redeploy frontend.

---

## Deploy order

### 1. LAECoin

- Constructor: **empty** (no args)
- Save address → `LAECOIN`

### 2. LAEClubMatrix

Constructor (4 addresses):

| # | Parameter | Value |
|---|-----------|--------|
| 1 | ownerAddress | `0xef9594fC5145404BfC7B5640296C3864319e3d86` |
| 2 | paymentTokenAddress (BTC) | `0xf8E556996042b34cc706F040c59955abB678995e` |
| 3 | clubPoolAddress | `0xef9594fC5145404BfC7B5640296C3864319e3d86` |
| 4 | platformTreasuryAddress | `0xef9594fC5145404BfC7B5640296C3864319e3d86` |

Save address → `MATRIX`

---

## Wire (Remix — call on deployed contracts)

### LAECoin

```
setWallets(
  0xef9594fC5145404BfC7B5640296C3864319e3d86,
  0xef9594fC5145404BfC7B5640296C3864319e3d86,
  0xef9594fC5145404BfC7B5640296C3864319e3d86
)
setMatrixContract(MATRIX)
bootstrapSupply(
  450000000000000000000000,
  20000000000000000000000,
  20000000000000000000000,
  10000000000000000000000
)
setP2PPaymentToken(0xf8E556996042b34cc706F040c59955abB678995e)
setP2PEnabled(true)
setTaxExempt(MATRIX, true)
```

### LAEClubMatrix

```
setLaeCoin(LAECOIN)
setLiquidityPool(0xef9594fC5145404BfC7B5640296C3864319e3d86)
```

---

## .env after deploy

```env
NEXT_PUBLIC_LAE_MATRIX_CONTRACT=<MATRIX>
NEXT_PUBLIC_LAE_COIN_CONTRACT=<LAECOIN>
NEXT_PUBLIC_PAYMENT_TOKEN=0xf8E556996042b34cc706F040c59955abB678995e
```

Backend:

```env
LAE_MATRIX_CONTRACT_ADDRESS=<MATRIX>
LAE_COIN_CONTRACT_ADDRESS=<LAECOIN>
INDEXER_START_BLOCK=<deploy block number>
```

---

## Quick checklist

```
[ ] LAECoin
[ ] LAEClubMatrix (4 constructor args)
[ ] LAECoin wire × 6
[ ] Matrix wire × 2
[ ] .env updated
```
