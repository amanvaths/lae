# Sponsor Payment Architecture

## Overview

Marketing-cycle sponsor payments distribute a configurable percentage of each package purchase to the buyer's **direct sponsor**. This mirrors the PDF marketing cycle diagram where registration value flows to the partner network.

## Configuration (Admin Panel)

`PATCH /api/admin/config/sponsor-payment`

```json
{
  "enabled": true,
  "clubPercent": 0.10,
  "pilotPercent": 0.10
}
```

Stored in `system_config` key `sponsor_payment`.

## Flow

1. User completes `executePackagePurchase`
2. `distributeSponsorPayment()` reads admin config
3. If enabled, credits sponsor: `packageAmount × percent`
4. Records in `IncomeLedger` as `SPONSOR_PAYMENT`
5. Idempotency key: `income:SPONSOR_PAYMENT:{purchaseRef}:{sponsorId}-{level}`

## Reporting

- `GET /api/admin/sponsor-payments` — paginated ledger entries
- `GET /api/admin/income-report` — aggregated by type including `SPONSOR_PAYMENT`

## Design Principles

- **Configurable**: Admin enables/disables and sets % per matrix type
- **Idempotent**: Duplicate purchases never double-pay sponsor
- **Atomic**: Runs inside the same Serializable transaction as placement
- **Append-only**: All payments recorded in immutable `income_ledger`

## Default

Disabled with 0% until admin enables — avoids unintended payouts in development.
