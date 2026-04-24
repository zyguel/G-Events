# Module Compliance Checklist - Auth Service and API Gateway

Date: 2026-04-20

| Control Area | Status | Notes |
|---|---|---|
| Authentication enforcement in routes | Partial | `requireUser` is used in many routes; `users/search` catch path fixed to preserve auth response mapping. Additional endpoints still return `500` in unauth smoke and require review. |
| Authorization and org boundary controls | Partial | Existing patterns (`getCurrentUserActiveOrganization`, `getAdminSupabaseForEventOr404`) remain; smoke run indicates potential unhandled auth errors in some endpoints. |
| Redirect safety (open redirect prevention) | Pass | Auth `next` handling now rejects protocol-relative (`//`) targets in callback and role choose routes. |
| Input validation and sanitization | Partial | Baseline improvements in auth redirect path safety; broad validation consistency still varies by route. |
| Unit test coverage | Pass (baseline established) | New unit tests added for `sessionRole` helpers. |
| Integration test coverage (Auth/API critical paths) | Partial | Added reproducer and regression tests for auth redirects and API auth error mapping; broader endpoint matrix still required. |
| Dependency vulnerability hygiene | Pass | `npm audit --audit-level=high` reports 0 vulnerabilities. |
| OWASP SAST baseline | Pass | Semgrep OWASP + custom rule runs successfully with 0 findings. |
| CI workflow definition | Pass (scaffolded) | Added `.github/workflows/qa-baseline.yml`; workflow tracking unblocked by `.gitignore` update. |
| CI gate pass status | Fail | `npm run ci:baseline` blocked by pre-existing lint errors. |
| Performance smoke for critical endpoints | Fail | Broad auth/api smoke finds multiple unexpected `500` responses needing remediation. |
| Acceptance readiness for Auth/API wave | Fail | Critical blockers remain (lint debt and API `500` smoke failures). |
