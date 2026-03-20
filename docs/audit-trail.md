# G-Events Audit Trail (No Blockchain Write)

## Overview
This document describes the low-cost, production-safe audit trail implementation for G-Events.
It avoids ongoing blockchain gas costs and wallet/contract complexity, while preserving data integrity with cryptographic hash proofs.

## Why this approach
- Google Developer Group prioritizes low-cost solutions at the moment.
- Blockchain writes have variable transaction fees and infrastructure overhead.
- We need tamper evidence, not necessarily full public blockchain storage.

## Architecture
1. Core data model remains in Supabase/Postgres (`Event`, `Ticket`, `Registration`, etc.).
2. New table: `AuditLog` (append-only reference logs).
3. For each create/update/delete operation on key entities, we insert a row in `AuditLog` with:
   - `entity_type`: `Event`, `Ticket`, `Registration`, `OrderFormEntry`, etc.
   - `entity_id`: numeric reference
   - `action`: `create` / `update` / `delete`
   - `payload`: JSON payload for before/after snapshot
   - `audit_hash`: SHA256 over normalized payload
   - `prev_hash`: previous row hash for chain integrity
   - `ipfs_cid`: optional IPFS content hash for external verification
   - `created_at`: timestamp
4. A lightweight `GET /api/audit` route fetches audit entries for an entity.
5. A client-side component `AuditLogViewer` surfaces audit history in admin event overview.

## Technical details
- `lib/actions/audit.ts`:
  - `computeAuditHash(payload)` normalizes object keys and computes SHA256.
  - `logAuditEntry(entityType, entityId, action, payload, ipfsCid?)` writes to `AuditLog`.
  - `getAuditEntries(entityType, entityId)` queries logs.

- `database/add_audit_log_table.sql`: unsafe overview and RLS policy

- `lib/db.ts`: instrumented with audit logging for:
  - Event create/update/delete
  - Ticket create/update/delete
  - AddOn create/update/delete
  - Promotion create/update/delete

- `lib/actions/orderForm.ts`:
  - On order form entry creation, logs `OrderFormEntry` audit.

- `app/api/audit/route.ts`:
  - `GET` query: `?entityType=Event&entityId=123`
  - returns success + logs or errors.

- `components/admin/AuditLogViewer.tsx`:
  - visual table for audit records
  - includes timestamps, action, hash chain, IPFS links.

- admin event overview optics:
  - `app/(admin_side)/events/[eventId]/overview/page.tsx`
  - includes `AuditLogViewer` for `Event` entries.

## Behaviour
- Data integrity is checked via stored `audit_hash` and `prev_hash`.
- For each modification, we store before/after state.
- UI shows history as records; no blockchain fees required.

## Optional future extension
- IPFS anchoring: optional `ipfs_cid` can be set with `fetch('https://ipfs.io/api/v0/add')` on payload, then stored.
- Optional chain anchoring: single hash can be periodically batch-posted to a low-cost chain (Mumbai) for third-party timestamping.

## Deployment
1. Apply DB migration.
2. Restart app and run tests.
3. Validate audit log by creating/updating an event and verifying `/api/audit` output.

## Notes for stakeholders
- Equivalent security goals are met: tamper evidence through hash-based chain.
- No ongoing blockchain operations.
- Fully aligned with low-cost priority.
