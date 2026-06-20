# LAE Club Smart Contracts

Four contracts only — based on deployed **BTitanXMatrix** (`0xD6759d47Fccdef7b8E318479cEC4D128366f2a44`).

| Contract | Purpose |
|---|---|
| `LAEClubMatrix.sol` | BTitan 12×14 matrix + integrated LAE reward layer |
| `LAECoin.sol` | 500,000 cap token (400,000 reward pool to matrix) |
| `LAERegistrationPassNFT.sol` | Registration pass (tokenId = userId) |
| `LAERoyalCardNFT.sol` | Royal rank cards at levels 3, 6, 9, 12 |

## Deploy order

1. `LAECoin` — set treasury/liquidity/operations wallets
2. `LAERegistrationPassNFT` + four `LAERoyalCardNFT` instances
3. `LAEClubMatrix` — constructor args match BTitan (owner, payment token, royal pool, platform treasury, NFT addresses)
4. On each NFT: `setMinter(matrixAddress)`
5. On `LAECoin`: `bootstrapSupply()` then `setMatrixContract(matrixAddress)`
6. On matrix: `setLaeCoin(laeAddress)` + `setLiquidityPool(liquidityWallet)`

## Compile

```bash
node contracts/compile-check.js
```

See `DEPLOY.md` for full deployment notes.
