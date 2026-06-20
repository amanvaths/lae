# Remix Deploy — LAE Club (2 contracts only)

**Total deploys: 2** (LAECoin + LAEClubMatrix). **No NFTs.**

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
