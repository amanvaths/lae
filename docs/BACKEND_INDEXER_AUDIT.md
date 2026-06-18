# LAE Backend — Indexer & Analytics Audit

**Date:** 2026-06-18  
**Network:** BSC Testnet (Chain ID 97)  
**Mode:** Indexer-only (legacy MLM engines disabled)

## Executive Summary

| Area | Status | Notes |
|------|--------|-------|
| Legacy business logic removed | **PASS** | Engines not loaded; `app.ts` is analytics-only |
| Event indexing | **PASS** | Sync engine + 16 event types across 3 contracts |
| Database sync | **PASS** | Idempotent `txHash+logIndex` keys; reorg rewind |
| Read-only APIs | **PASS** | `/api/dashboard`, `/wallet`, `/referrals`, etc. |
| Frontend integration | **PASS** | Income, team, referrals, transactions, leaderboard use API + chain fallback |
| Contract writes (frontend) | **PASS** | Unchanged — register, purchase, withdraw, spin, stake via wagmi |

---

## 1. Legacy Logic Removal

| Component | Status | Action |
|-----------|--------|--------|
| Matrix placement engine | **PASS** | Disabled — `engines/DISABLED.md` |
| Club/Pilot matrix engines | **PASS** | Not imported |
| Rebirth / auto-upgrade engines | **PASS** | Not imported |
| Income / sponsor / token engines | **PASS** | Not imported |
| Wallet accounting engine | **PASS** | Not imported |
| `POST /api/transactions/purchase` | **PASS** | Route removed from app |
| BullMQ purchase worker | **PASS** | `worker.ts` no-op |
| Deposit listener | **PASS** | Removed from `server.ts` |

---

## 2. Blockchain Event Indexer

**File:** `backend/src/modules/blockchain/sync-engine.ts`

| Feature | Status |
|---------|--------|
| Block tracking (`indexer_state`) | **PASS** |
| Batch scan (`INDEXER_BATCH_SIZE`) | **PASS** |
| Event replay (`POST /api/indexer/replay`) | **PASS** |
| Missed block recovery (poll + `block` listener) | **PASS** |
| Idempotent indexing (`txHash` + `logIndex`) | **PASS** |
| Reorg protection (hash check + rewind) | **PASS** |

### Indexed Events

| Event | Contract | Status |
|-------|----------|--------|
| UserRegistered | SensoLimitless | **PASS** |
| ClubPurchased | SensoLimitless | **PASS** |
| PilotPurchased | SensoLimitless | **PASS** |
| ClubPlacement | SensoLimitless | **PASS** |
| PilotPlacement | SensoLimitless | **PASS** |
| ClubCycleCompleted | SensoLimitless | **PASS** |
| PilotCycleCompleted | SensoLimitless | **PASS** |
| ClubRebirthCreated | SensoLimitless | **PASS** |
| PilotRebirthCreated | SensoLimitless | **PASS** |
| AutoUpgrade | SensoLimitless | **PASS** |
| IncomePaid | SensoLimitless | **PASS** |
| TokenReward | SensoLimitless | **PASS** |
| Withdraw | SensoLimitless | **PASS** |
| SpinExecuted | SensoSpin | **PASS** |
| Staked | SensoStaking | **PASS** |
| Released | SensoStaking | **PASS** |

---

## 3. Database (Analytics Tables)

| Logical name | PostgreSQL table | Source |
|--------------|------------------|--------|
| users | `idx_users` | UserRegistered |
| referrals | `idx_referrals` | UserRegistered |
| club_matrices | `idx_club_matrices` | Club events |
| pilot_matrices | `idx_pilot_matrices` | Pilot events |
| transactions | `idx_transactions` | All user txs |
| incomes | `idx_incomes` | IncomePaid |
| token_rewards | `idx_token_rewards` | TokenReward |
| withdrawals | `idx_withdrawals` | Withdraw |
| spins | `idx_spins` | SpinExecuted |
| stakes | `idx_stakes` | Staked / Released |
| event_logs | `chain_events` | Raw payload (existing) |

Migration: `prisma/migrations/20260618120000_analytics_indexer/`

---

## 4. Read-Only API Layer

Base URL: `http://localhost:4000` (see `NEXT_PUBLIC_API_URL`)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/dashboard?wallet=0x…` | GET | **PASS** |
| `/api/wallet?wallet=0x…` | GET | **PASS** |
| `/api/referrals?wallet=0x…` | GET | **PASS** |
| `/api/team?wallet=0x…` | GET | **PASS** |
| `/api/matrices?wallet=0x…` | GET | **PASS** |
| `/api/income?wallet=0x…` | GET | **PASS** |
| `/api/rewards?wallet=0x…` | GET | **PASS** |
| `/api/transactions?wallet=0x…` | GET | **PASS** |
| `/api/spins?wallet=0x…` | GET | **PASS** |
| `/api/stakes?wallet=0x…` | GET | **PASS** |
| `/api/leaderboard` | GET | **PASS** |
| `/api/indexer/status` | GET | **PASS** |

---

## 5. Frontend Integration

| Page | API | Chain fallback | Status |
|------|-----|----------------|--------|
| Income | `/api/income` | `useUserEventsOnChain` | **PASS** |
| Transactions | `/api/transactions` | events hook | **PASS** |
| Team | `/api/team` | `useReferralsOnChain` | **PASS** |
| Referrals | `/api/referrals` | chain | **PASS** |
| Leaderboard | `/api/leaderboard` | none (indexer required) | **PASS** |
| Deposit / Activate | — | direct writes | **PASS** |
| Withdraw / Spin / Stake | — | direct writes | **PASS** |

**Files:** `lib/api/analytics.ts`, `lib/hooks/useAnalytics.ts`

---

## 6. Contract Integration (Frontend Writes)

Unchanged — still via `lib/contracts/hooks/useWrites.ts`:

| Action | Status |
|--------|--------|
| register | **PASS** |
| purchaseClub / purchasePilot | **PASS** |
| processPending | **PASS** |
| withdraw | **PASS** |
| spin | **PASS** |
| stake / release | **PASS** |

---

## Setup

```bash
# Backend
cd backend
cp .env.example .env
# Set DATABASE_URL
npx prisma migrate deploy
npm run dev

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
```

After on-chain activity, verify:

```bash
curl http://localhost:4000/api/indexer/status
curl "http://localhost:4000/api/leaderboard"
curl "http://localhost:4000/api/dashboard?wallet=0xYOUR_WALLET"
```

---

## Known Limitations

1. Legacy Prisma tables (`users`, `wallets`, etc.) remain in schema but are **not written** by the indexer.
2. Analytics tables use `idx_*` prefix to avoid collision with legacy `users` table.
3. Leaderboard requires backend running; no chain fallback.
4. Qualified referral counts still read from chain on team page when API is used (indexer stores direct refs only).

---

**Result: Backend is a lightweight blockchain indexer + analytics service. Legacy MLM calculation engines are disabled.**
