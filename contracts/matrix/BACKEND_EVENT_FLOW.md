# Backend Event Flow — Node.js + Fastify + PostgreSQL

How the backend indexes `MatrixCore` and projects on-chain state into the
PostgreSQL schema (`db/schema.sql`). The DB is a **verifiable projection** of the
chain: every row traces back to a `(tx_hash, log_index)`.

## 1. Architecture

```
        BSC node (RPC/WSS)
              │  eth_getLogs (range polling) + head subscription
              ▼
   ┌──────────────────────┐    upsert (idempotent)    ┌──────────────┐
   │  Indexer worker       │ ─────────────────────────▶│ PostgreSQL    │
   │  (viem + cron loop)   │                           │ (schema.sql)  │
   └──────────┬───────────┘                           └──────┬───────┘
              │ emit domain events                            │ reads
              ▼                                               ▼
   ┌──────────────────────┐                         ┌──────────────────┐
   │ Fastify HTTP API      │  ◀──────────────────────│ Dashboards / app │
   │ (+ Socket.IO push)    │                         └──────────────────┘
   └──────────────────────┘
```

- **Indexer worker** (`backend/src/worker.ts` style): a single process that polls
  logs in batches, writes raw events, then applies them transactionally.
- **Fastify API**: read-only endpoints over the projected tables; pushes live
  updates over Socket.IO.

## 2. Ingestion loop (reorg-safe, exactly-once)

```ts
// pseudocode — runs every INDEXER_POLL_MS
async function tick() {
  const { last_block } = await getIndexerState();
  const head = await client.getBlockNumber();
  const safeHead = head - BigInt(INDEXER_REORG_DEPTH); // confirmations buffer
  if (safeHead <= last_block) return;

  const from = last_block + 1n;
  const to = min(from + BigInt(INDEXER_BATCH_SIZE) - 1n, safeHead);

  const logs = await client.getLogs({
    address: MATRIX_CONTRACT,
    fromBlock: from,
    toBlock: to,
    events: MATRIX_ABI_EVENTS, // all 8 events
  });

  await db.tx(async (t) => {
    for (const log of logs) {
      // 1) raw insert, deduped on (tx_hash, log_index)
      await t.none(
        `INSERT INTO chain_events (block_number, block_hash, tx_hash, log_index, event_name, payload)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (tx_hash, log_index) DO NOTHING`,
        [log.blockNumber, log.blockHash, log.transactionHash, log.logIndex,
         log.eventName, decode(log)]
      );
      // 2) apply to projection (handlers below). All handlers are idempotent.
      await applyEvent(t, log);
    }
    await t.none(`UPDATE indexer_state SET last_block=$1, updated_at=now() WHERE id=1`, [to]);
  });
}
```

- **Reorg safety:** only index up to `head - INDEXER_REORG_DEPTH`. On a detected
  reorg (block_hash mismatch for an already-seen height), roll back rows with
  `block_number >= reorgPoint` and re-scan. Because handlers are idempotent
  upserts, replays are safe.
- **Ordering:** process logs in `(block_number, log_index)` order. The contract
  emits in the natural order: `UserRegistered` → `PositionFilled` →
  `IncomeDistributed`/`TreasuryIncome`/`LapsedIncome` → (`SlotOpened`) →
  (`CycleCompleted` → `RecycleStarted`).

## 3. Event → table mapping

| Solidity event | Handler effect |
|---|---|
| `UserRegistered(id, wallet, sponsorId)` | upsert `users`; `users.direct_referrals++` for sponsor; `global_stats.total_users++`, `total_entries += X` (X from config). |
| `PositionFilled(matrixOwnerId, cycle, position, occupantId)` | upsert `matrix_cycles` (filled = position); insert `matrix_positions` (UNIQUE guards duplicates). |
| `IncomeDistributed(fromUserId, toUserId, position, amount)` | insert `income_events(kind='user')`; `users.total_earned += amount` for `toUserId`; `global_stats.total_user_income += amount`. |
| `TreasuryIncome(matrixOwnerId, position, amount)` | insert `income_events(kind='treasury', to_user_id=NULL)`; `global_stats.total_treasury_income += amount`. |
| `LapsedIncome(intendedReceiverId, position, amount)` | insert `income_events(kind='lapsed', to_user_id=ownerId)`; `global_stats.total_lapsed_income += amount`. |
| `SlotOpened(userId, slotId)` | insert `slot_openings`; `users.highest_slot = max(highest_slot, slotId)`; set `matrix_cycles.slot2_opened` when slotId=2. |
| `CycleCompleted(userId, cycle)` | `matrix_cycles.completed = TRUE`; `users.total_cycles++`. |
| `RecycleStarted(userId, newCycle)` | insert `recycles`; `users.current_cycle = newCycle`; ensure a `matrix_cycles` row for the new cycle exists. |

> Note on amounts: the chain emits both the 10% treasury leg and the 90% user
> leg as separate `TreasuryIncome` + `IncomeDistributed`/`LapsedIncome` events,
> so summing `income_events.amount` reconstructs every entry's full `X`.

### Example handler (idempotent upsert)

```ts
async function onPositionFilled(t, ev) {
  const { matrixOwnerId, cycle, position, occupantId } = ev.args;
  await t.none(
    `INSERT INTO matrix_cycles (matrix_owner_id, cycle_id, filled)
     VALUES ($1,$2,$3)
     ON CONFLICT (matrix_owner_id, cycle_id)
     DO UPDATE SET filled = GREATEST(matrix_cycles.filled, EXCLUDED.filled)`,
    [matrixOwnerId, cycle, position]
  );
  await t.none(
    `INSERT INTO matrix_positions
       (matrix_owner_id, cycle_id, position, occupant_id, block_number, tx_hash, log_index)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (tx_hash, log_index) DO NOTHING`,
    [matrixOwnerId, cycle, position, occupantId, ev.blockNumber, ev.txHash, ev.logIndex]
  );
}
```

## 4. Fastify API surface (read models)

| Route | Backed by | Purpose |
|---|---|---|
| `GET /users/:wallet` | `users` | profile, current cycle, slot, earnings |
| `GET /users/:id/matrix?cycle=` | `matrix_positions` + `matrix_cycles` | 14-position layout of a cycle (mirrors `getCyclePositions`) |
| `GET /users/:id/directs` | `users` (sponsor_id) | direct referrals (mirrors `getDirectReferrals`) |
| `GET /users/:id/income?offset=&limit=` | `income_events` | paginated income history (mirrors `getIncomeHistoryPaged`) |
| `GET /users/:id/recycles` | `recycles` | recycle/cycle history |
| `GET /users/:id/slots` | `slot_openings` | slot status (mirrors `getSlotStatus`) |
| `GET /stats` | `global_stats` / `v_fund_reconciliation` | totals + balanced flag |
| `GET /tree/:id?depth=` | recursive CTE over `matrix_positions` | matrix subtree for visualization |

Matrix subtree (recursive CTE):

```sql
WITH RECURSIVE tree AS (
  SELECT matrix_owner_id, cycle_id, position, occupant_id, 1 AS depth
  FROM matrix_positions WHERE matrix_owner_id = $1 AND cycle_id = $2
  UNION ALL
  SELECT mp.matrix_owner_id, mp.cycle_id, mp.position, mp.occupant_id, t.depth + 1
  FROM matrix_positions mp
  JOIN tree t ON mp.matrix_owner_id = t.occupant_id
  WHERE t.depth < $3
)
SELECT * FROM tree;
```

## 5. Live updates (Socket.IO)

After each batch commit, broadcast the domain events so dashboards update without
polling:

```ts
io.to(`user:${ev.toUserId}`).emit('income', { position, amount, kind });
io.to(`user:${ev.matrixOwnerId}`).emit('positionFilled', { cycle, position, occupantId });
io.to(`user:${ev.userId}`).emit('recycle', { completedCycle, newCycle });
```

## 6. Reconciliation job (safety net)

A periodic job asserts the chain-truth invariants against the DB:

1. `SELECT balanced FROM v_fund_reconciliation` must be `true`
   (`total_in == total_out`).
2. `total_entries / X == (SELECT count(*) FROM matrix_positions)` — one position
   per entry, no duplicates (the `uq_positions_occupant_once` index also enforces
   this at write time).
3. Every `recycles` row has a matching `matrix_cycles.completed = TRUE` with
   `filled = 14`.
4. Optionally cross-check `getGlobalStats()` from the contract against
   `global_stats`. Any drift pages the operator and pauses ingestion.

## 7. Config (env)

```
MATRIX_CONTRACT_ADDRESS=0x...
MATRIX_DEPLOY_BLOCK=...
ENTRY_PRICE_WEI=1000000000000000      # 0.001 token @ 18 decimals (X)
BSC_RPC_URL=...
CHAIN_ID=56                            # 97 for testnet
INDEXER_BATCH_SIZE=2000
INDEXER_POLL_MS=8000
INDEXER_REORG_DEPTH=12
```

This mirrors the existing indexer conventions in `backend/src/modules/blockchain`.
