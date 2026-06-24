# Final BTitan Removal Audit

Generated: 2026-06-24T10:52:36.817Z

## Summary

| Metric | Value |
|--------|-------|
| BTitan References Found | **90** |
| BTitan References Removed | N/A (audit pass = 0 remaining) |
| Old Addresses Remaining | **0** |
| MatrixCore Integration | **FAIL** |
| Frontend | **FAIL** |
| Backend | **FAIL** |
| Indexer | **PASS** |
| Ready For Production | **NO** |

## Integration Checks

- [x] Backend chains.ts uses matrixCore
- [x] Backend abis exports MATRIX_CORE_EVENTS
- [ ] matrix-tree.service uses getCyclePositions
- [ ] API /matrix/tree/:cycle
- [x] Prisma MatrixCore tables
- [ ] Frontend matrix page API-only
- [ ] Frontend hooks use matrixCoreAbi
- [x] Frontend contract config — no old address

## Remaining References

- `backend/src/modules/analytics/analytics.routes.ts:96` (usersXMatrixReferrals) — /** Authoritative 14-position matrix tree — LAEClubMatrix usersXMatrixReferrals via backend. */
- `backend/src/modules/blockchain/event-processor.ts:79` (NewUserPlace) — case "NewUserPlace": {
- `backend/src/modules/blockchain/matrix-core-abi.ts:26` (usersXMatrixReferrals) — "function usersXMatrixReferrals(address userAddress, uint8 level) view returns (address[])",
- `backend/src/modules/blockchain/matrix-core-abi.ts:6` (NewUserPlace) — "event NewUserPlace(uint256 indexed user, uint256 indexed referrer, uint8 level, uint256 cycle, uint8 spot)",
- `backend/src/modules/blockchain/matrix-core-abi.ts:2` (indexedLaeUser) — export const LAE_MATRIX_EVENTS = [
- `backend/src/modules/blockchain/matrix-core-abi.ts:16` (indexedLaeUser) — export const MATRIX_CORE_EVENTS = LAE_MATRIX_EVENTS;
- `backend/src/modules/blockchain/matrix-tree.service.ts:123` (usersXMatrixReferrals) — /** Read usersXMatrixReferrals from chain for the current cycle */
- `backend/src/modules/blockchain/matrix-tree.service.ts:149` (usersXMatrixReferrals) — const referrals = (await m.usersXMatrixReferrals(wallet, level)) as string[];
- `backend/src/modules/lae/lae-user.service.ts:59` (NewUserPlace) — "NewUserPlace",
- `components/lae-club/LaeRegisterPanel.tsx:10` (indexedLaeUser) — import { laeClubMatrixAbi } from "@/lib/lae-club/matrix-core-abi";
- `components/lae-club/LaeRegisterPanel.tsx:34` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `components/lae-club/LaeRegisterPanel.tsx:223` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `components/lae-club/LaeRegisterPanel.tsx:233` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `components/lae-club/LaeRegisterPanel.tsx:10` (laeClubMatrixAbi) — import { laeClubMatrixAbi } from "@/lib/lae-club/matrix-core-abi";
- `components/lae-club/LaeRegisterPanel.tsx:34` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `components/lae-club/LaeRegisterPanel.tsx:223` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `components/lae-club/LaeRegisterPanel.tsx:233` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/abis.ts:2` (indexedLaeUser) — export { laeClubMatrixAbi, matrixCoreAbi } from "./matrix-core-abi";
- `lib/lae-club/abis.ts:2` (laeClubMatrixAbi) — export { laeClubMatrixAbi, matrixCoreAbi } from "./matrix-core-abi";
- `lib/lae-club/hooks.ts:150` (usersXMatrixReferrals) — /** Level matrix tree — API (usersXMatrixReferrals via backend). */
- `lib/lae-club/hooks.ts:482` (NewUserPlace) — placementEvents: (events.data ?? []).filter((e) => e.eventName === "NewUserPlace"),
- `lib/lae-club/hooks.ts:15` (indexedLaeUser) — import { laeClubMatrixAbi } from "./matrix-core-abi";
- `lib/lae-club/hooks.ts:83` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:94` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:124` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:207` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:235` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:277` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:287` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:309` (indexedLaeUser) — { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "lastUserId" },
- `lib/lae-club/hooks.ts:310` (indexedLaeUser) — { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "levelTokenCost", args: [1] },
- `lib/lae-club/hooks.ts:311` (indexedLaeUser) — { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "PAYMENT_TOKEN" },
- `lib/lae-club/hooks.ts:396` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:402` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:527` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:565` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:601` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:674` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:684` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:706` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:15` (laeClubMatrixAbi) — import { laeClubMatrixAbi } from "./matrix-core-abi";
- `lib/lae-club/hooks.ts:83` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:94` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:124` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:207` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:235` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:277` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:287` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:309` (laeClubMatrixAbi) — { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "lastUserId" },
- `lib/lae-club/hooks.ts:310` (laeClubMatrixAbi) — { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "levelTokenCost", args: [1] },
- `lib/lae-club/hooks.ts:311` (laeClubMatrixAbi) — { address: LAE_CONTRACTS.matrix, abi: laeClubMatrixAbi, functionName: "PAYMENT_TOKEN" },
- `lib/lae-club/hooks.ts:396` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:402` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:527` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:565` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:601` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:674` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:684` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/hooks.ts:706` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/matrix-api.ts:58` (usersXMatrixReferrals) — /** LAEClubMatrix tree — API (usersXMatrixReferrals via backend). */
- `lib/lae-club/matrix-core-abi.ts:111` (usersXMatrixReferrals) — name: "usersXMatrixReferrals",
- `lib/lae-club/matrix-core-abi.ts:157` (NewUserPlace) — name: "NewUserPlace",
- `lib/lae-club/matrix-core-abi.ts:2` (indexedLaeUser) — export const laeClubMatrixAbi = [
- `lib/lae-club/matrix-core-abi.ts:236` (indexedLaeUser) — /** @deprecated — use laeClubMatrixAbi */
- `lib/lae-club/matrix-core-abi.ts:237` (indexedLaeUser) — export const matrixCoreAbi = laeClubMatrixAbi;
- `lib/lae-club/matrix-core-abi.ts:2` (laeClubMatrixAbi) — export const laeClubMatrixAbi = [
- `lib/lae-club/matrix-core-abi.ts:236` (laeClubMatrixAbi) — /** @deprecated — use laeClubMatrixAbi */
- `lib/lae-club/matrix-core-abi.ts:237` (laeClubMatrixAbi) — export const matrixCoreAbi = laeClubMatrixAbi;
- `lib/lae-club/matrix-core-hooks.ts:5` (indexedLaeUser) — import { laeClubMatrixAbi } from "./matrix-core-abi";
- `lib/lae-club/matrix-core-hooks.ts:13` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/matrix-core-hooks.ts:24` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/matrix-core-hooks.ts:54` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/matrix-core-hooks.ts:5` (laeClubMatrixAbi) — import { laeClubMatrixAbi } from "./matrix-core-abi";
- `lib/lae-club/matrix-core-hooks.ts:13` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/matrix-core-hooks.ts:24` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/matrix-core-hooks.ts:54` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/matrix-events.ts:21` (NewUserPlace) — { eventName: "NewUserPlace", args: { referrer: id } },
- `lib/lae-club/matrix-events.ts:22` (NewUserPlace) — { eventName: "NewUserPlace", args: { user: id } },
- `lib/lae-club/matrix-events.ts:5` (indexedLaeUser) — import { laeClubMatrixAbi } from "./matrix-core-abi";
- `lib/lae-club/matrix-events.ts:8` (indexedLaeUser) — typeof laeClubMatrixAbi
- `lib/lae-club/matrix-events.ts:75` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/matrix-events.ts:5` (laeClubMatrixAbi) — import { laeClubMatrixAbi } from "./matrix-core-abi";
- `lib/lae-club/matrix-events.ts:8` (laeClubMatrixAbi) — typeof laeClubMatrixAbi
- `lib/lae-club/matrix-events.ts:75` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/user-lookup.ts:4` (indexedLaeUser) — import { laeClubMatrixAbi } from "./matrix-core-abi";
- `lib/lae-club/user-lookup.ts:49` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/user-lookup.ts:66` (indexedLaeUser) — abi: laeClubMatrixAbi,
- `lib/lae-club/user-lookup.ts:4` (laeClubMatrixAbi) — import { laeClubMatrixAbi } from "./matrix-core-abi";
- `lib/lae-club/user-lookup.ts:49` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
- `lib/lae-club/user-lookup.ts:66` (laeClubMatrixAbi) — abi: laeClubMatrixAbi,
