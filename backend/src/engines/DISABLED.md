# Legacy MLM engines — DISABLED

Business logic now lives **100% on-chain** in deployed BSC Testnet contracts.

These files are kept for reference only. They are **not imported** by `app.ts` or `server.ts`.

Do not re-enable without a deliberate migration plan.

Active backend entry points:

- `src/server.ts` — analytics API + blockchain sync indexer
- `src/modules/blockchain/sync-engine.ts` — block sync + event replay
- `src/modules/analytics/` — read-only REST APIs
