# LAE Club — Deployment (2 contracts)

## 1. Deploy

1. Payment token — BTC (BEP-20); a mock on testnet
2. `LAECoin`
3. `LAEClubMatrix` — `(owner, paymentToken, clubPool, platformTreasury)`

## 2. Wire

```solidity
// LAECoin
coin.setWallets(treasury, liquidityWallet, operations);
coin.setMatrixContract(matrix);
coin.bootstrapSupply(
  450_000 ether,  // reward pool → matrix holds LAE
  20_000 ether,   // example residual split (≤ 50k total)
  20_000 ether,
  10_000 ether
);
coin.setP2PPaymentToken(paymentToken);
coin.setTaxExempt(matrix, true);

// LAEClubMatrix
matrix.setLaeCoin(coin);
matrix.setLiquidityPool(liquidityWallet);
// defaults: 9000/1000 split, 5%/month × 20, direct M1=1…M20=20
```

## 3. Initialize partners (optional)

```solidity
matrix.initializePartners(partner2, partner3); // locks owner's direct slots
```

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
