# Codebase Concerns

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| High | Large, high-churn server action file | docs/codebase/.codebase-scan.txt (high-churn + largest files) | Regression risk and slow reviews | Split lib/actions/events.ts by domain area |
| Medium | No CI/CD pipeline detected | docs/codebase/.codebase-scan.txt | Manual enforcement of build/test standards | Add CI workflow for lint/build/test |
| Medium | No .env template file detected | docs/codebase/.codebase-scan.txt | Harder onboarding, env drift | Add .env.example mirroring README/HANDOFF |

### 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| High-churn monolith file | Many features in one file | lib/actions/events.ts | Hard to refactor safely | Extract into sub-modules (tickets, reports, registrations) |
| Large UI pages | Pages with many responsibilities | app/(admin_side)/management/page.tsx | Hard to maintain/optimize | Split into smaller components |

### 3) Security Concerns

| Risk | OWASP category (if applicable) | Evidence | Current mitigation | Gap |
|------|--------------------------------|----------|--------------------|-----|
| APP_URL required for secure absolute links | N/A | lib/security.ts | Runtime guard throws in production | [TODO] Document deploy-time checks |
| Cron endpoints require shared secret | A01 | app/api/cron/process-email-campaigns/route.ts | safeCompareSecrets + CRON_SECRET | [TODO] Add rate limiting guidance |

### 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| Large server action file and big client pages | docs/codebase/.codebase-scan.txt (largest files) | Slower reviews/maintenance | More regression risk at scale | Split large modules and use smaller components |

### 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| lib/actions/events.ts | Centralized mutations and data access | High-churn list | Add tests before refactors, split by feature |
| components/admin/EventOverview.tsx | Complex edit UI | High-churn list | Make incremental UI changes with snapshot checks |
| app/(admin_side)/dashboard/page.tsx | Dashboard data mapping | High-churn list | Guard types and add integration tests |

### 6) [ASK USER] Questions

1. [ASK USER] Do you want a formal CI pipeline (GitHub Actions) added now or just documented as a recommendation?
2. [ASK USER] Should we add a canonical .env.example file and keep it in sync with README/HANDOFF?

### 7) Evidence

- docs/codebase/.codebase-scan.txt
- lib/security.ts
- app/api/cron/process-email-campaigns/route.ts

## Extended Sections (Optional)

- [TODO]
