# SENSO Limitless — Smart Contracts (Production)

All matrix business logic on-chain. Backend indexes events only.

## Contracts

| File | Role |
|------|------|
| `SLTToken.sol` | ERC20 reward token (capped supply, multi-minter) |
| `SensoLimitless.sol` | Club + Pilot matrices, async pending queue |
| `SensoSpin.sol` | PDF weighted spin execution |
| `SensoStaking.sol` | 365-day SLT lock (level 10+ or 5M SLT) |
| `MockDAI.sol` | Testnet DAI only |

## Architecture (post gap-fix)

- **GAP-03:** `processPending(maxSteps)` — cycle/rebirth/upgrade never recurse in one TX
- **GAP-07:** `totalDaiLiabilities` enforced on every `_creditDai`
- **GAP-01:** BFS spillover via persistent `_bfsQueues` + 32 nodes/step (unbounded across TXs)
- **GAP-02:** No global FIFO fallback — reverts if no sponsor-tree matrix exists
- **GAP-04:** SLT minted via `SLTToken` ERC20 (not internal mapping)
- **GAP-09:** Pilot slot-2 pays matrix owner when upline is zero

## Remix Deploy Order

```
1. MockDAI (testnet) OR use Polygon DAI
2. SLTToken(maxSupply)          e.g. 1_000_000_000 ether
3. SensoLimitless(dai, slt, rootSponsor, treasury)
4. SensoSpin(slt, sensoAddress)
5. SensoStaking(slt, sensoAddress)
6. SLTToken.setMinter(senso, true)
7. SLTToken.setMinter(spin, true)
8. SensoLimitless.setSpinContract(spinAddress)
9. (optional) setSponsorPayments(true, 500, 500)  // max 5% each
```

**Compiler:** Solidity 0.8.20, optimizer 200 runs, **`viaIR: true`** (required)

## User Flow

```
register(sponsor)
dai.approve(senso, amount)
purchaseClub(level) / purchasePilot(level)
processPending(10)   // repeat until pendingLength() == 0
withdraw(amount, uniqueRef)
spin(seed)           // on SensoSpin contract
stake(amount)        // on SensoStaking contract
```

## Polygon Addresses

| Network | DAI |
|---------|-----|
| Mainnet | `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063` |
| Amoy | Deploy MockDAI |

## Backend

```bash
SENSO_CONTRACT_ADDRESS=0x...
```

Indexer: all `SensoLimitless` events + `SLTToken` Transfer from zero address (mints).

## Compile locally

```bash
cd contracts && node compile-check.js
```

Requires `solc@0.8.20` with `viaIR: true`.
