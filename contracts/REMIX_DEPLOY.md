# Remix Deploy — LAE Club (2 contracts only)

**Total deploys: 2** (LAECoin + LAEClubMatrix). **No NFTs.**

---

## ⚡ NEW MODEL — UNLIMITED-UPLINE SEQUENTIAL MATRIX (only LAEClubMatrix)

> **1. PLACEMENT (display / team).** Every user owns an independent 14-slot board
> per level. A new member is appended to the next free slot of its sponsor's board
> **and of every upline's board, all the way to the top** (arrival order: slot
> 1, 2, 3 …). So each user's board shows their entire downline as it grew
> (Owner's board = A,B,D in slots 1,2,3). At 14 the board recycles — Cycle 2
> starts **empty**. The slot-14 member is NOT placed in Cycle 2; only the next
> registration (or owner's new direct) fills Cycle 2 slot 1.
>
> **2. INCOME (money) — SINGLE 90% payout per registration.** Placement happens
> on ALL upline boards (for team display), but income is distributed ONCE.
> If the member lands on a **cycle-2+ board as a direct referral** of that board
> owner, payment uses that board and slot. Otherwise the upline board with
> **minimum reinvestCount** is used (cycle-1 ties → highest upline). The slot
> on the chosen board decides the recipient:
> `1 = board owner's 1st upline (owner wallet if none) · 2 = 2nd upline (owner if none) ·
> 3,6,8,9,11,12 = board owner (self) · 4,14 = board owner's 1st upline (treasury only for root owner) ·
> 5 = 1st upline on cycle 1 (treasury for owner), board owner on cycle 2+ ·
> 7,10 = 1st/2nd downline · 13 = 2nd-level downline`.
> One registration = one payout. Contract stays solvent.
>
> **3. ELIGIBILITY + LAPSE.** A recipient needs **≥ 2 direct referrals** (owner is
> always eligible). If not eligible, the income lapses to the **1st upline**, then
> the **2nd upline**; if neither qualifies it goes to the **Treasury**. Never past
> 2 uplines.
>
> **4. PROGRESSION.** When a board's position 5 fills, the owner's next level
> unlocks **for FREE**; position 14 recycles the board.
>
> **REVENUE SPLIT (unchanged):** 90% matrix · 10% liquidity → vested LAE (20 months).
> **LAECoin is unchanged — do NOT redeploy it.**
>
> ⚠️ **Note:** upward propagation is bounded to `MAX_UPLINE = 60` levels deep for
> gas safety. Higher levels (2–15) unlock for free and fill for display; only the
> level-1 registration moves money (same as before).

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
