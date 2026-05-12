# Codebase Structure

## Core Sections (Required)

### 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| app/ | Next.js App Router routes, layouts, API routes | docs/codebase/.codebase-scan.txt |
| components/ | Shared UI components | docs/codebase/.codebase-scan.txt |
| contexts/ | React context providers (locale, permissions, notifications) | docs/codebase/.codebase-scan.txt |
| lib/ | Server actions, helpers, integrations | docs/codebase/.codebase-scan.txt |
| database/ | SQL migrations and DB docs | docs/codebase/.codebase-scan.txt |
| docs/ | Product and technical documentation | docs/codebase/.codebase-scan.txt |
| scripts/ | Debug, maintenance, perf scripts | docs/codebase/.codebase-scan.txt |
| tests/ | Unit/integration tests | docs/codebase/.codebase-scan.txt |
| public/ | Static assets | docs/codebase/.codebase-scan.txt |

### 2) Entry Points

- Main runtime entry: app/layout.tsx (App Router root layout)
- Secondary entry points (worker/cli/jobs): scripts/*.js, app/api/* route handlers
- How entry is selected (script/config): Next.js App Router discovers app/; npm scripts in package.json

### 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| app/ | Route handlers, layouts, page composition | Low-level integrations and shared helpers |
| components/ | Reusable UI components | Server-only logic and API handlers |
| contexts/ | Client-side providers/state | Direct DB access |
| lib/ | Supabase clients, server actions, helpers | JSX route layout markup |
| database/ | SQL migration scripts | Runtime application code |

### 4) Naming and Organization Rules

- File naming pattern: Next.js route files use page.tsx/layout.tsx/route.ts; components use PascalCase (e.g., components/admin/EventOverview.tsx).
- Directory organization pattern: feature-oriented with admin vs client route groups under app/(admin_side) and app/(client_side).
- Import aliasing or path conventions: @/* alias maps to repo root (tsconfig.json paths).

### 5) Evidence

- docs/codebase/.codebase-scan.txt
- app/layout.tsx
- package.json
- tsconfig.json

## Extended Sections (Optional)

- [TODO]
