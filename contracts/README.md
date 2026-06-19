# LAE Protocol — Smart Contracts (Production)

All matrix business logic on-chain. Backend indexes events only.

## Contracts

| File | Role |
|------|------|
| `LAEToken.sol` | ERC20 **LAE Token** (capped supply, multi-minter) |
| `LAELimitless.sol` | Club + Pilot matrices, async pending queue |
| `LAESpin.sol` | PDF weighted spin execution |
| `LAEStaking.sol` | 365-day LAE lock (level 10+ or 5M LAE) |
| `MockDAI.sol` | Testnet DAI only |

## Architecture (post gap-fix)

- **GAP-03:** `processPending(maxSteps)` — cycle/rebirth/upgrade never recurse in one TX
- **GAP-07:** `totalDaiLiabilities` enforced on every `_creditDai`
- **GAP-01:** BFS spillover via persistent `_bfsQueues` + 32 nodes/step (unbounded across TXs)
- **GAP-02:** No global FIFO fallback — reverts if no sponsor-tree matrix exists
- **GAP-04:** LAE minted via `LAEToken` ERC20 (not internal mapping)
- **GAP-09:** Pilot slot-2 pays matrix owner when upline is zero

## Remix Deploy Order

```
1. MockDAI (testnet) OR use Polygon DAI
2. LAEToken(maxSupply)          e.g. 1_000_000_000 ether
3. LAELimitless(dai, laeToken, rootSponsor, treasury)
4. LAESpin(laeToken, laeCoreAddress)
5. LAEStaking(laeToken, laeCoreAddress)
6. LAEToken.setMinter(laeCore, true)
7. LAEToken.setMinter(spin, true)
8. LAELimitless.setSpinContract(spinAddress)
9. LAELimitless.activate()
10. (optional) setSponsorPayments(true, 500, 500)  // max 5% each
```

**Compiler:** Solidity 0.8.20, optimizer 200 runs, **`viaIR: true`** (required)

## User Flow

```
register(sponsor)
dai.approve(laeCore, amount)
purchaseClub(level) / purchasePilot(level)
processPending(10)   // repeat until pendingLength() == 0
withdraw(amount, uniqueRef)
spin()               // on LAESpin contract
stake(amount)        // on LAEStaking contract
```

## BSC Testnet (current)

| Contract | Address |
|----------|---------|
| MockDAI | `0xf8E556996042b34cc706F040c59955abB678995e` |
| LAEToken | `0xc842c083E703ecf82496813cc3BFe6d36c0A49b0` |
| LAELimitless | `0x6521619C38fe4be6B800263CC783d9524ED4F7BA` |
| LAESpin | `0xF9bdE4a2Ca487b18DA8546124b63Ec9e938ea1aE` |
| LAEStaking | `0xdb25Af21346aD358D5e52835934AF5f326169984` |

## Polygon Addresses

| Network | DAI |
|---------|-----|
| Mainnet | `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063` |
| Amoy | Deploy MockDAI |

## Backend

```bash
SENSO_CONTRACT_ADDRESS=0x...   # LAELimitless deploy address
SLT_CONTRACT_ADDRESS=0x...     # LAEToken deploy address
```

Indexer: all `LAELimitless` events + `LAEToken` Transfer from zero address (mints).

## Compile locally

```bash
cd contracts && node compile-check.js
```

Requires `solc@0.8.20` with `viaIR: true`.
