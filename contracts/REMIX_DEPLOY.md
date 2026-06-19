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
8. On **LAELimitless** (root): `activate()` — **not** `setActivated` (that function does not exist)

Then update GitHub secrets / `.env` with new addresses.

---

## Current BSC Testnet deploy (verified)

| Contract | Address |
|----------|---------|
| MockDAI | `0xf8E556996042b34cc706F040c59955abB678995e` |
| LAEToken | `0xc842c083E703ecf82496813cc3BFe6d36c0A49b0` |
| LAELimitless | `0x6521619C38fe4be6B800263CC783d9524ED4F7BA` |
| LAESpin | `0xF9bdE4a2Ca487b18DA8546124b63Ec9e938ea1aE` |
| LAEStaking | `0xdb25Af21346aD358D5e52835934AF5f326169984` |

Root sponsor (admin): `0xef9594fC5145404BfC7B5640296C3864319e3d86`

---

## Quick upload

From repo root:

```bash
cd contracts && ls *.sol
# Copy all 5 files into Remix File Explorer → contracts/ folder
```

Or use **Remix GitHub** plugin: load repo `amanvaths/lae`, open `contracts/` folder.
