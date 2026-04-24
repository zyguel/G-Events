# Detailed Report - Baseline Checks and Remediation (Auth Service + API Gateway)

Date: 2026-04-20
Branch: `qa/fix-auth-open-redirect-next-path`

## 1. Baseline Checks Run

1. Lint: `npm run lint`
   - Result: FAIL
   - Summary: Large pre-existing error set across API/admin files (explicit-any, set-state-in-effect, unescaped entities, and related issues).

2. CI build: `npm run build`
   - Result: PASS
   - Summary: Next.js build compiled successfully with route generation complete.

3. Unit and integration tests:
   - Initial state: no test framework.
   - Implemented tooling: Vitest config and scripts.
   - Run: `npm run test`
   - Result: PASS (7/7 tests)

4. Dependency vulnerability scan:
   - Run: `npm run audit:deps`
   - Result: PASS (0 vulnerabilities)

5. OWASP SAST:
   - Tooling added: Semgrep + custom auth redirect rule.
   - Run: `npm run sast:owasp`
   - Result: PASS (0 findings)

6. Basic performance smoke:
   - Tooling added: `scripts/perf/smoke-auth-api.mjs`
   - Run: `npm run perf:smoke`
   - Result: FAIL
   - Summary: Multiple unexpected `500` statuses on unauthenticated or invalid-id requests across API surface.

## 2. Failing Test Cases Added (Repro First)

1. Auth open redirect repro
   - File: `tests/integration/auth/sessionRoleChooseRoute.test.ts`
   - Baseline failure: role chooser redirected to external host when `next=//evil.example/...`

2. Auth callback open redirect repro
   - File: `tests/integration/auth/callbackRoute.test.ts`
   - Baseline failure: callback preserved protocol-relative `next`, enabling unsafe redirect chain.

3. API Gateway auth error mapping repro
   - File: `tests/integration/api/usersSearchRoute.test.ts`
   - Baseline failure: unauthenticated `GET /api/users/search` returned `500` instead of `401`.

## 3. Fixes Implemented

1. Auth role chooser redirect safety
   - File: `app/auth/session-role/choose/route.ts`
   - Change: `next` path guard now rejects protocol-relative values (`//...`) and falls back to `/dashboard`.

2. Auth callback redirect safety
   - File: `app/auth/callback/route.ts`
   - Change: callback `next` sanitation now rejects protocol-relative values before redirect composition.

3. API users search auth response handling
   - File: `app/api/users/search/route.ts`
   - Change: integrated `getAuthErrorResponse` in catch handling so thrown auth responses are preserved instead of downgraded to `500`.

## 4. Tooling and Pipeline Additions

1. Test harness and scripts
   - `vitest.config.ts`
   - Added scripts in `package.json`: `test`, `test:unit`, `test:integration`, `test:auth-api`

2. Security and quality scripts
   - Added scripts in `package.json`: `audit:deps`, `sast:owasp`, `perf:smoke`, `ci:baseline`
   - Added custom Semgrep rule file: `semgrep/rules/auth-api.yml`

3. Performance smoke framework
   - Added `scripts/perf/smoke-auth-api.mjs`

4. CI scaffolding
   - Added `.github/workflows/qa-baseline.yml`
   - Updated `.gitignore` to allow workflow tracking.

## 5. Current Gate Matrix (Post-fix)

- Lint: FAIL (pre-existing repository issues)
- Build: PASS
- Tests: PASS
- Dependency scan: PASS
- OWASP SAST: PASS
- Perf smoke: FAIL (unexpected `500` responses on multiple endpoints)
- CI baseline aggregate: FAIL (stops at lint)

## 6. Critical Blockers Remaining

1. Repository lint debt blocks CI pass enforcement.
2. API endpoints returning `500` under unauth/invalid-context smoke scenarios require route-by-route hardening.
3. Full PR automation could not be completed in-tool due missing GitHub CLI (`gh` not installed); remote URL available for manual PR opening after push.
