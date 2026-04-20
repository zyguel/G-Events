# Remediation Plan - Auth Service and API Gateway

Date: 2026-04-20

## Phase 1 - Immediate (Complete)

1. Establish baseline tooling for tests, SAST, and smoke checks.
2. Add reproducible failing tests for critical auth redirect and API auth error mapping defects.
3. Implement and verify fixes for those defects.

## Phase 2 - Critical Blocker Burn-down (In Progress)

1. Eliminate unauthenticated `500` responses in API Gateway:
   - Prioritize endpoints failing smoke check: `api/audit`, `api/events/[eventId]` family, `api/management/*`, `api/orderform/[id]`, and any route using broad `catch` that drops auth response status.
   - Pattern: use `getAuthErrorResponse` in route handlers where `requireUser` can throw.

2. Introduce lint debt reduction by slices:
   - Slice A: Auth and API gateway folders (`app/auth`, `app/api`).
   - Slice B: Shared libs and middleware.
   - Slice C: Admin UI lint debt unrelated to Auth/API.

3. Tighten perf smoke expectations:
   - Add per-endpoint expected status map so intentional `405`/`404`/`401` responses remain acceptable and only true regressions fail.

## Phase 3 - CI Hardening

1. Keep `qa-baseline` workflow as required PR gate once lint and smoke blockers are cleared.
2. Add artifact publishing for:
   - Test report output
   - Semgrep SARIF/JSON output
   - Smoke summary JSON

## Branch and PR Plan

1. Branch created: `qa/fix-auth-open-redirect-next-path`
2. Recommended follow-up branch: `qa/fix-api-auth-response-hardening`
3. Recommended follow-up branch: `qa/fix-auth-api-lint-slice-a`

## Exit Criteria for Auth/API Wave

1. `npm run lint` passes for Auth/API scope (or fully repo-wide if policy requires).
2. `npm run test` passes with regression tests covering fixed issues.
3. `npm run audit:deps` returns zero high/critical vulnerabilities.
4. `npm run sast:owasp` returns zero blocking findings.
5. `npm run perf:smoke` has zero failed routes after expected-status normalization.
6. `npm run ci:baseline` passes end-to-end.
