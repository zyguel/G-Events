# Acceptance Evidence - Auth Service and API Gateway

Date: 2026-04-20
Branch: `qa/fix-auth-open-redirect-next-path`

## Command Evidence Matrix

1. `npm run build`
   - Result: PASS
   - Evidence: Next.js production build completed successfully.

2. `npm run test`
   - Result: PASS
   - Evidence: 5 files, 7 tests passed.

3. `npm run audit:deps`
   - Result: PASS
   - Evidence: 0 vulnerabilities at high threshold.

4. `npm run sast:owasp`
   - Result: PASS
   - Evidence: Semgrep scan completed with 0 findings.

5. `npm run perf:smoke`
   - Result: FAIL
   - Evidence: multiple endpoints returned unexpected `500` statuses.

6. `npm run lint`
   - Result: FAIL
   - Evidence: pre-existing repo-wide lint violations.

7. `npm run ci:baseline`
   - Result: FAIL
   - Evidence: pipeline blocked at lint stage.

## Reproducer and Fix Verification

1. Reproducer: `tests/integration/auth/sessionRoleChooseRoute.test.ts`
   - Before: external redirect via `next=//evil.example/phish`
   - After: redirects to safe fallback `/dashboard`.

2. Reproducer: `tests/integration/auth/callbackRoute.test.ts`
   - Before: callback carried unsafe protocol-relative `next`
   - After: callback normalizes to safe internal next path.

3. Reproducer: `tests/integration/api/usersSearchRoute.test.ts`
   - Before: unauthenticated users search emitted `500`
   - After: route now returns `401` via auth error mapping.

## PR and Branch Evidence

- Branch prepared: `qa/fix-auth-open-redirect-next-path`
- Remote repo: `https://github.com/zyguel/G-Events`
- PR link: pending push + PR creation from this branch.

Suggested compare URL after push:
`https://github.com/zyguel/G-Events/compare/nightly...qa/fix-auth-open-redirect-next-path?expand=1`
