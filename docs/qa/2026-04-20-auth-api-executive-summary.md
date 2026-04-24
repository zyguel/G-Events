# Executive Summary - Auth Service and API Gateway Baseline

Date: 2026-04-20
Scope: Auth Service (`app/auth`, session role flows, auth helpers) and API Gateway (`app/api`, shared API auth utilities)

## Release Decision

Status: NO-GO (Critical blockers remain)

## Critical Blockers

1. Repository lint gate fails with large pre-existing error set, including many `@typescript-eslint/no-explicit-any` and React hook effect violations in API and admin components.
2. Broad API smoke check fails with multiple unexpected `500` responses on unauthenticated access paths; expected behavior should generally be auth-safe status responses (`401`, `403`, `404`, or method-safe `405`) rather than internal error status.
3. CI baseline command (`npm run ci:baseline`) fails at lint stage, preventing full in-pipeline quality gate completion.

## Remediations Implemented in this cycle

1. Added test infrastructure using Vitest with path alias support.
2. Added unit and integration suites for Auth/API baseline verification.
3. Added OWASP SAST baseline via Semgrep and a custom auth redirect safety rule.
4. Added API/auth performance smoke script and workflow scaffold.
5. Fixed open redirect vectors in auth callback and session role chooser by rejecting protocol-relative `next` values.
6. Fixed API Gateway auth error handling for `GET /api/users/search` so auth failures now return `401` rather than being converted to `500`.

## Key Evidence Snapshot

- Build: PASS (`npm run build`)
- Unit/Integration tests: PASS (`npm run test`, 7 tests)
- Dependency audit: PASS (`npm run audit:deps`, 0 vulnerabilities)
- OWASP SAST: PASS (`npm run sast:owasp`, 0 findings)
- Perf smoke: FAIL (`npm run perf:smoke`, multiple unexpected `500` statuses)
- Lint: FAIL (`npm run lint`, pre-existing repo-wide violations)

## Immediate Recommendation

Proceed with a targeted stabilization wave to remove unauthorized `500` responses on API endpoints and to reduce lint debt in staged batches so CI gating can be enforced on PRs.
