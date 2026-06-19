# Remix Deploy — LAE Contracts

## Error: `Fetch failed 404 ... LAEToken.sol`

Remix shows this when **`LAEToken.sol` is missing** from your workspace.  
It tries to download from npm (`contracts@0.4.0`) and fails.

**Fix:** Upload **all** `.sol` files below into the **same Remix folder** (e.g. `contracts/`).

| File | Required |
|------|----------|
| `LAEToken.sol` | Yes — import dependency |
| `LAELimitless.sol` | Yes — main matrix |
| `LAESpin.sol` | Yes — spin |
| `LAEStaking.sol` | Yes — staking |
| `MockDAI.sol` | Yes — testnet DAI |

Do **not** upload only `LAELimitless.sol` alone.

---

## Remix compiler settings

| Setting | Value |
|---------|--------|
| Compiler | **0.8.20** |
| Optimization | **Enabled**, 200 runs |
| **Enable via IR** | **ON** (required for LAELimitless size) |
| EVM | default |

---

## Deploy order (BSC Testnet)

1. **MockDAI** — deploy, note address  
2. **LAEToken** — constructor: `1000000000000000000000000000` (1B × 10¹⁸)  
3. **LAELimitless** — `(mockDai, laeToken, rootSponsor, treasury)`  
4. **LAESpin** — `(laeToken, laeLimitlessAddress)`  
5. **LAEStaking** — `(laeToken, laeLimitlessAddress)`  
6. On **LAEToken** (owner): `setMinter(laeLimitless, true)` and `setMinter(spin, true)`  
7. On **LAELimitless** (root): `setSpinContract(spinAddress)`  
8. On **LAELimitless** (root): `setActivated(true)`  

Then update GitHub secrets / `.env` with new addresses.

---

## Quick upload

From repo root:

```bash
cd contracts && ls *.sol
# Copy all 5 files into Remix File Explorer → contracts/ folder
```

Or use **Remix GitHub** plugin: load repo `amanvaths/lae`, open `contracts/` folder.
