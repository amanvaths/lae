# LAE Club — Deployment (4 contracts)

## 1. Deploy

1. Payment token (BTC/USDT mock on testnet)
2. `LAECoin`
3. `LAERegistrationPassNFT` + 4× `LAERoyalCardNFT` (ranks 1–4)
4. `LAEClubMatrix` (owner, payment token, royal pool, treasury, NFT addresses)

## 2. Wire

```solidity
// LAECoin
coin.setWallets(treasury, rewardWallet, liquidityWallet, operations);
coin.setMatrixContract(matrix);
coin.bootstrapSupply(
  400_000 ether,  // reward pool → matrix holds LAE
  40_000 ether,   // example residual split
  30_000 ether,
  30_000 ether
);
coin.setP2PPaymentToken(paymentToken);
coin.setTaxExempt(matrix, true);

// LAEClubMatrix
matrix.setLaeCoin(coin);
matrix.setLiquidityPool(liquidityWallet);
// defaults: 9000/1000 split, 5%/month × 20, direct M1=2…M20=21
```

## 3. NFT minters

Set matrix as minter on registration pass + royal card NFTs.

## 4. PancakeSwap

After LP created:

```solidity
coin.setLiquidityPair(pancakePair, true);
coin.setTaxes(buyBps, sellBps, transferBps);
```

## 5. User flows

- Register: approve matrix → `registrationExt(referrerId)`
- Claim LAE: `claimLaeRewards()` when time + directs qualify
- P2P: approve LAE → `createP2POrder` → buyer `fillP2POrder`
