# Remix Deploy — BTitanXMatrix (BSC Testnet)

Deploys the new **BTitanXMatrix** + its **5 required NFT contracts**, using the
existing test payment token. Total deploys: **6** (1 matrix + 5 NFTs).

> The matrix constructor REQUIRES the 5 NFT addresses and the contract calls
> `.mint()` on them during registration / upgrades. Deploy the NFTs first.

---

## Compiler settings (Remix → Solidity Compiler)

| Setting | Value |
|---------|-------|
| Compiler | **0.8.26** |
| Optimization | **Enabled**, 200 runs |
| **Enable via IR** | **ON** (required) |

Upload these 2 files into Remix `contracts/`:

- `BTitanNFTs.sol` (contains `RegistrationPassNFT` + `RoyaltyCardNFT`)
- `BTitanXMatrix.sol`

## Network

- **BSC Testnet** (Chain ID 97)
- MetaMask → Remix "Injected Provider"
- Deployer wallet needs testnet BNB (faucet: https://testnet.bnbchain.org/faucet-smart)

## Fixed values used below

| Name | Value |
|------|-------|
| Owner wallet | `0xef9594fC5145404BfC7B5640296C3864319e3d86` |
| Payment token (BTC, same as live) | `0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575` |

For testing you can use the owner wallet for the Royal Pool and Platform
Treasury too.

---

## STEP 1 — Deploy the 5 NFT contracts

In Remix "Deploy & Run", select the contract from the dropdown each time.

### 1a. `RegistrationPassNFT`
Constructor: `baseURI_` (string) — e.g. `https://laeclub.com/nft/pass/`
→ save address as **REG_PASS**

### 1b. `RoyaltyCardNFT` — Rank 1
Constructor: `name_`, `symbol_`, `baseURI_`
```
"BTitan Royal Rank 1", "BTITAN-R1", "https://laeclub.com/nft/rank1/"
```
→ save as **RANK1**

### 1c. `RoyaltyCardNFT` — Rank 2
```
"BTitan Royal Rank 2", "BTITAN-R2", "https://laeclub.com/nft/rank2/"
```
→ save as **RANK2**

### 1d. `RoyaltyCardNFT` — Rank 3
```
"BTitan Royal Rank 3", "BTITAN-R3", "https://laeclub.com/nft/rank3/"
```
→ save as **RANK3**

### 1e. `RoyaltyCardNFT` — Rank 4
```
"BTitan Royal Rank 4", "BTITAN-R4", "https://laeclub.com/nft/rank4/"
```
→ save as **RANK4**

---

## STEP 2 — Deploy `BTitanXMatrix`

Constructor has **9 address args, in this exact order**:

| # | Param (as named in code) | Use this value | Becomes |
|---|--------------------------|----------------|---------|
| 1 | `ownerAddress` | `0xef9594fC5145404BfC7B5640296C3864319e3d86` | owner (ID 1) |
| 2 | `btcTokenAddress` | `0xb2bE66BE07E1AD04074B32B8b13DcdFaB6B57575` | payment token |
| 3 | `treasuryPoolAddress` | owner wallet (test) | **Royal Pool** |
| 4 | `platformAddress` | owner wallet (test) | **Platform Treasury** |
| 5 | `registrationPassNftAddress` | **REG_PASS** | reg pass NFT |
| 6 | `royalRank1NftAddress` | **RANK1** | |
| 7 | `royalRank2NftAddress` | **RANK2** | |
| 8 | `royalRank3NftAddress` | **RANK3** | |
| 9 | `royalRank4NftAddress` | **RANK4** | |

> ⚠️ Note the naming: param **3** (`treasuryPoolAddress`) is actually the
> **Royal Pool**, and param **4** (`platformAddress`) is the **Platform
> Treasury**. Don't swap them.

→ save address as **MATRIX**, and **note the deploy block number** (BscScan →
the contract creation tx → block) — needed later for the indexer.

---

## STEP 3 — Authorize the matrix to mint NFTs

On **each** of the 5 NFT contracts, call:

```
setMinter(MATRIX)
```

(REG_PASS, RANK1, RANK2, RANK3, RANK4 — all 5.) Without this, registration
reverts with `NFT: not minter`.

---

## STEP 4 — (Optional) Initialize partners

On **MATRIX** (owner wallet only):

```
initializePartners(<partner2 address>, <partner3 address>)
```

This registers IDs 2 & 3 under the owner and locks the owner's direct slot.
Regular users then start at ID 4.

---

## STEP 5 — Fund the matrix for payouts (testing)

The matrix pays winners from **its own token balance**. A single registration
can trigger several payouts via spill, so seed the contract with test tokens:

1. On the **payment token** contract (`0xb2bE66…`), call `transfer(MATRIX, amount)`
   (e.g. a few whole tokens) from a funded wallet, **or** mint test tokens to it
   if the token has a public faucet `mint`.

---

## STEP 6 — How a user registers (frontend or Remix)

1. User must hold the payment token and **approve** the matrix first.
   On the **payment token**: `approve(MATRIX, amount)` (amount ≥ `levelTokenCost(1)` = `1000000000000000`).
2. On **MATRIX**: `registrationExt(<referrerId>)` (e.g. `1` for owner).

Level costs: L1 = `0.001` (1e15). Each level doubles, up to **LAST_LEVEL = 12**.

---

## STEP 7 — After deploy: give me these values

Paste these back so I can do Phase 2 (frontend + backend migration):

```
MATRIX            = 0x...
MATRIX_DEPLOY_BLOCK = <number>
REG_PASS          = 0x...
RANK1 / RANK2 / RANK3 / RANK4 = 0x... (x4)
ROYAL_POOL        = 0x...   (param 3 you used)
PLATFORM_TREASURY = 0x...   (param 4 you used)
```

---

## Quick checklist

```
[ ] RegistrationPassNFT            -> REG_PASS
[ ] RoyaltyCardNFT x4              -> RANK1..RANK4
[ ] BTitanXMatrix (9 args)         -> MATRIX  (note deploy block)
[ ] setMinter(MATRIX) on all 5 NFTs
[ ] (optional) initializePartners(p2, p3)
[ ] fund MATRIX with test tokens
[ ] approve + registrationExt test
[ ] send me the addresses + deploy block
```

---

## What changes vs the live LAEClubMatrix (FYI for Phase 2)

- **12 levels** (not 15); `ClubPoolPayment` → **`TreasuryPool`**; new
  `MissedIncome` event; `Spillover` has extra args.
- **No LAE-coin reward layer** (no `claimLaeRewards` / vesting). The Rewards,
  Staking and LAE-coin P2P features won't have on-chain backing under this
  contract — I'll adjust/hide them during the frontend migration.
- Matrix / tree / TokenReceived income all keep working (same view functions).
