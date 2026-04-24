# Codebase Concerns

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| High | No committed `.env.example` or env template for required runtime secrets | `README.md` shows env vars, scan output shows no env template | Onboarding and deployment risk | Add `.env.example` or `.env.template` with required vars |
| High | `next` is pinned to `latest` in `package.json` | `package.json` | Upgrade risk and unpredictable breaking changes | Pin a specific Next.js version used in production |
| Medium | Large shared action and auth layers have high churn | `lib/actions/events.ts`, `proxy.ts` in scan high-churn list | Maintenance complexity and regression risk | Refactor large files into smaller, focused modules |
| Medium | Email provider lacks retry/backoff and monitoring | `lib/emailProvider.ts`, `app/api/cron/process-email-campaigns/route.ts` | Failed emails may go undetected | Add retry logic, failure logging, and alerting |
| Low | No container/orchestration config in repo | scan output `No containerization configs detected` | Deployment documentation gap for Vercel app settings | Document Vercel deployment runtime and required environment variables |

### 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| Missing documented environment template | README documents env vars but repo lacks sample file | root | New developers may misconfigure required secrets | Add `.env.example` or `.env.template` |
| Mixed route and business logic size | Large `lib/actions/events.ts` and `app/api/notifications/route.ts` | `lib/actions/events.ts`, `app/api/notifications/route.ts` | Harder to maintain and test | Split into smaller service files and clearer boundaries |
| Implicit formatting without explicit Prettier config | no `.prettierrc` found | repo root | inconsistent formatting across contributors | Add formatting config or editor standards document |

### 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap |
|------|---------------|----------|--------------------|-----|
| Cron endpoints protected by secret header only | A01: Broken Access Control | `app/api/cron/process-email-campaigns/route.ts`, `app/api/cron/process-certificate-emails/route.ts` | `safeCompareSecrets` with `x-cron-secret` header | No explicit rate limiting or secondary auth factor |
| Production absolute URL generation depends on env config | N/A | `lib/security.ts`, `lib/emailProvider.ts` | checks `APP_URL` in production | Missing deployment validation may permit insecure links |
| Missing env sample for secrets | N/A | scan output, `README.md` | env vars use `process.env` | Onboarding confusion could lead to insecure manual config |

### 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| High-churn large server action file | `lib/actions/events.ts` | Complexity may hide slow queries | Hard to scale and Optimize | Split into domain-specific service modules |
| No explicit external call timeouts | `lib/emailProvider.ts` | Potential hangs on SMTP or Resend failures | Could block cron or API request execution | Add timeout handling or retry wrappers |
| No container/runtime config | scan output | Deployment depends on platform-specific config | Harder to replicate environment across stages | Add Docker/compose or deployment docs |

### 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| `lib/actions/events.ts` | Large volume of event CRUD, uploads, audit logging, and form handling | 29 changes in last 90 days | Refactor to smaller helpers and add regression tests |
| `proxy.ts` | Central session role and access control logic | 15 changes in last 90 days | Keep auth gating simple and add focused tests |
| `components/admin/EventsSidebar.tsx` | Frequent UI behavior updates and event routing | 31 changes in last 90 days | Extract stable navigation vs dynamic event state |
| `package.json` | Dependency and script churn | 34 changes in last 90 days | Lock dependency versions and stabilize toolchain |

### 6) `[ASK USER]` Questions

None. All open questions were resolved.

### 7) Evidence

- `README.md`
- `package.json`
- `lib/actions/events.ts`
- `proxy.ts`
- `lib/emailProvider.ts`
- `app/api/cron/process-email-campaigns/route.ts`
- `docs/codebase/.codebase-scan.txt`
