# SENSO Limitless Backend

Production-ready backend for the SENSO Limitless decentralized MLM Matrix platform.

## Tech Stack

- **PostgreSQL** — primary database with Serializable transactions + row-level locking
- **Prisma ORM** — schema, migrations, type-safe queries
- **Redis** — BullMQ job queues + dashboard/leaderboard cache
- **BullMQ** — all background jobs
- **Fastify + Socket.io + Polygon/Ethers v6**

## Quick Start

```bash
cd backend
cp .env.example .env
docker compose up -d postgres redis
npm install
npm run db:migrate:deploy
npm run db:seed
npm run dev        # API server
npm run worker     # Background workers (separate terminal)
```

## Database Architecture

### Referral Tree — Materialized Path + Recursive CTEs

Each user stores:
- `treePath` — e.g. `/rootId/sponsorId/userId/`
- `treeDepth` — depth in sponsor hierarchy

**Upline lookup:** `WITH RECURSIVE upline` query or parse `treePath`  
**Downline lookup:** `WITH RECURSIVE downline` query or `treePath LIKE prefix%`  
**Team size:** prefix count on indexed `tree_path`

### Atomic Matrix Operations

All matrix steps run inside a **single Serializable transaction** via `runMatrixTransaction()`:

1. Placement
2. Cycle completion
3. Income distribution
4. Rebirth creation
5. Auto upgrade
6. Token rewards

Any failure → **full rollback**. No partial state.

### Row-Level Locking (`SELECT FOR UPDATE`)

- `club_matrices` / `pilot_matrices` — placement & cycle races
- `wallets` — payout & withdrawal races
- `withdrawal_requests` — duplicate processing

### Append-Only Financial Ledger

`income_ledger` is **immutable**:
- PostgreSQL trigger blocks UPDATE/DELETE
- Monotonic `sequence_num` per entry
- `direction` (CREDIT/DEBIT) + `balance_after` snapshot
- Never mutate historical records

### Idempotency Protection

| Operation | Key Pattern |
|-----------|-------------|
| Package Purchase | `purchase:{type}:{level}:{txHash}` |
| Cycle Completion | `cycle:{matrixId}` |
| Rebirth | `rebirth:{parentMatrixId}:{cycleNumber}` |
| Auto Upgrade | `upgrade:{userId}:{from}:{to}` |
| Income | `income:{type}:{matrixId}:{suffix}` |
| Withdrawal | `withdraw:{withdrawalId}` |
| Token Reward | `token:{userId}:{type}:{ref}` |
| Placement | `placement:{userId}:{type}:{level}` |

### Redis Usage

| Purpose | Key / Queue |
|---------|-------------|
| Placement Queue | `placement` |
| Rebirth Queue | `rebirth` |
| Auto Upgrade Queue | `auto-upgrade` |
| Income Distribution | `income-distribution` |
| Withdrawal Queue | `withdrawal` |
| Notification Queue | `notification` |
| Package Purchase | `package-purchase` |
| Dashboard Cache | `cache:dashboard:{userId}` (60s TTL) |
| Leaderboard Cache | `cache:leaderboard:global` (300s TTL) |

## API Endpoints

```
POST /api/auth/register|login
GET  /api/referral/tree|tree/recursive|sponsor-chain|team-size
GET  /api/cache/dashboard|leaderboard
GET  /api/wallet/ledger          # append-only immutable ledger
POST /api/transactions/purchase|withdraw
```

OpenAPI docs: `http://localhost:4000/docs`

## Migrations

```bash
npm run db:migrate:deploy   # production
npm run db:migrate          # development
```

Migrations:
- `20250618000000_init` — base schema
- `20250618120000_production_hardening` — path strategy, idempotency, ledger trigger, cache tables

## Tests

```bash
npm test    # 25 unit tests
```

## Root Seed User

- Wallet: `0x0000000000000000000000000000000000000001`
- Referral Code: `SENSOROOT`
