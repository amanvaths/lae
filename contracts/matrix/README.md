# 14 Position Matrix MLM — Smart Contracts

A fresh, modular Solidity implementation of a **14 Position Matrix** (positions
1–14) with **recycle cycles**, paid in a BEP-20 token (BTC token) on BSC.

> **Naming (read first):** This is a **14 Position Matrix**, *not* a "12-slot
> matrix". A **position** is one of the 14 fill spots inside one cycle. A
> **slot** is a separate upgrade level (slot 1, slot 2, …) opened via
> `openNextSlot`. Do not conflate the two.

## Files (inheritance chain)

```
MatrixStorage  ──>  MatrixIncome  ──>  MatrixRecycle  ──>  MatrixPlacement  ──>  MatrixCore
   (state)          (distribution)      (cycle reset)        (BFS queue)        (deployable)
```

- **MatrixStorage.sol** — structs, state, constants, events, pure helpers.
- **MatrixIncome.sol** — the exact 14-position payout rules, lapse routing, slot opening.
- **MatrixRecycle.sol** — completes a cycle at position 14 and re-queues the user.
- **MatrixPlacement.sol** — global BFS placement queue (O(1) placement).
- **MatrixCore.sol** — `Ownable`/`Pausable`/`ReentrancyGuard`, `register`, admin & views.

## The matrix (one cycle)

```
                     OWNER (matrix owner = "You")
                    /                            \
                  p1                              p2
                /    \                          /    \
              p3      p4                      p5       p6
             /  \    /  \                   /  \      /  \
           p7  p8  p9  p10               p11  p12  p13  p14
```

Positions fill strictly **left-to-right, level by level** (p1→p14). Filling p14
**completes the cycle**, the user is **recycled**, and a new cycle starts.

## Income rules (entry amount = X, 90% receiver / 10% treasury)

| Pos | Receiver |
|---:|---|
| 1 | Owner's 1st upline (sponsor) — *lapses to ownerId if none* |
| 2 | Owner's 2nd upline — *lapses to ownerId if none* |
| 3 | You |
| 4 | Treasury (funds slot 2) — 100% |
| 5 | Cycle 1: Treasury (funds slot 2, 100%) · Cycle ≥2: You (90/10) |
| 6 | You |
| 7 | 1st downline (position-1 occupant), fallback You |
| 8 | You |
| 9 | You |
| 10 | 2nd downline (position-2 occupant), fallback You |
| 11 | You |
| 12 | You |
| 13 | 1st downline's 1st downline (search occupants), fallback You |
| 14 | Treasury (recycle trigger) — 100% |

- **Slot 2** opens automatically once p4 **and** p5 are funded in cycle 1.
- **Lapse**: any missing/blocked/inactive receiver → 90% leg routes to `ownerId`
  (`totalLapsedIncome`), 10% treasury still paid.

## Placement model (why it is correct)

Placement uses a single global **FIFO queue** of matrix nodes `(userId, cycleId)`:

- The root (`ownerId`) opens the first node at deploy.
- Each `register` appends the entrant's own cycle-1 node, **then** fills the
  queue head's next free position (1..14).
- When the head reaches position 14 it completes, the head pointer advances, and
  (on recycle) the user's next cycle is appended at the tail.

This reproduces exact level-order fill across the whole company tree, gives
**O(1)** placement, and guarantees each entrant occupies **exactly one** position
once — no duplicates, no spillover ambiguity. The **sponsor chain** is recorded
separately and used only for the position 1/2 upline income.

## Two system wallets

- **ownerId** — root user; receives all **lapsed** income; root of the tree.
- **treasuryWallet** — slot openings (p4/p5), recycle payments (p14), treasury
  income, and the **10% liquidity** cut from every payout.

## Deploy (constructor args)

```
MatrixCore(
  paymentToken,    // BEP-20 (BTC token) address
  entryPrice,      // X in base units; 0.001 token @18 decimals = 1000000000000000
  treasuryWallet,  // treasury address
  rootWallet,      // ownerId wallet
  admin            // Ownable owner (multisig recommended)
)
```

Front-end flow: `paymentToken.approve(MatrixCore, entryPrice)` → `MatrixCore.register(sponsorWallet)`.

## Events (for the indexer)

`UserRegistered`, `PositionFilled`, `IncomeDistributed`, `TreasuryIncome`,
`LapsedIncome`, `SlotOpened`, `CycleCompleted`, `RecycleStarted`.

## Verify locally

```bash
node contracts/matrix/compile-check.js   # solc compile + 24KB size check
node contracts/matrix/simulate.js        # 100/500/1000/5000-user invariant sims
```

See **AUDIT_REPORT.md** for results, **db/schema.sql** for the PostgreSQL schema,
and **BACKEND_EVENT_FLOW.md** for the Node.js + Fastify integration.
