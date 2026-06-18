# On-chain contract layer (`lib/contracts/`)

All dashboard data and writes go through this module — **no backend mock data** for matrix/wallet flows.

## Structure

```
lib/contracts/
  addresses.ts      # BSC Testnet contract addresses + explorer URLs
  config.ts         # CHAIN_ID, CONTRACTS env overrides
  abis/             # SensoLimitless, ERC20, Spin, Staking ABIs + events
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
| SLTToken | `0x7a509cb5cF853BaE4C4A76B7e37037cf8ec2A146` |
| SensoLimitless | `0x74Ddbe4bcb6000bD9AA357E02B874C3D0e0248D5` |
| SensoSpin | `0xE5BD47a1bA6D742c147b74c54Ca6CFd95cACD50D` |
| SensoStaking | `0xDAB2Ef2396b53D64cf22Fe58fE0275fDdb0fe5D8` |

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

Events auto-refresh UI via `useWatchContractEvent` on SensoLimitless.
