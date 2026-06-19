# On-chain contract layer (`lib/contracts/`)

All dashboard data and writes go through this module — **no backend mock data** for matrix/wallet flows.

## Structure

```
lib/contracts/
  addresses.ts      # BSC Testnet contract addresses + explorer URLs
  config.ts         # CHAIN_ID, CONTRACTS env overrides
  abis/             # LAELimitless, ERC20, Spin, Staking ABIs + events
  services/
    reader.ts       # Viem read helpers (matrices, wallet, events, referrals)
    utils.ts        # withdrawRef, referral links, sponsor from URL
  hooks/
    useReads.ts     # React Query + wagmi reads + event watcher
    useWrites.ts    # register, purchase, withdraw, spin, stake, processPending
  query-keys.ts
  format.ts
```

Import via `@/lib/contracts` or `@/contracts/*` (tsconfig alias).

## Deployed addresses (defaults)

| Contract | Address |
|----------|---------|
| MockDAI | `0xf8E556996042b34cc706F040c59955abB678995e` |
| LAEToken | `0xc842c083E703ecf82496813cc3BFe6d36c0A49b0` |
| LAELimitless | `0x6521619C38fe4be6B800263CC783d9524ED4F7BA` |
| LAESpin | `0xF9bdE4a2Ca487b18DA8546124b63Ec9e938ea1aE` |
| LAEStaking | `0xdb25Af21346aD358D5e52835934AF5f326169984` |

## Run locally

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_WC_PROJECT_ID from cloud.walletconnect.com
npm run dev
```

Connect wallet on **BSC Testnet (97)** → `/login` → `/dashboard`.

## User flow (UI)

1. **Register** — `register(sponsor)` (sponsor from `?sponsor=0x…` or root)
2. **Faucet + Approve** — MockDAI on Deposit page
3. **Purchase** — `purchaseClub` / `purchasePilot`
4. **Process queue** — `processPending()` until empty
5. **Withdraw / Spin / Stake** — dedicated pages

Events auto-refresh UI via `useWatchContractEvent` on LAELimitless.
