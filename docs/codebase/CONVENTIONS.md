# Coding Conventions

## Core Sections (Required)

### 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files | Route files named page.tsx/layout.tsx/route.ts | app/(admin_side)/dashboard/page.tsx | docs/codebase/.codebase-scan.txt |
| Functions/methods | camelCase | createClient, sendEmail | lib/supabase-server.ts, lib/emailProvider.ts |
| Types/interfaces | PascalCase | CreateEventState, User | lib/actions/events.ts, lib/supabase.ts |
| Constants/env vars | UPPER_SNAKE for constants | DEFAULT_ORG_ID, SESSION_ROLE_COOKIE_NAME | lib/constants.ts |

### 2) Formatting and Linting

- Formatter: [TODO]
- Linter: eslint-config-next (core-web-vitals, typescript)
- Most relevant enforced rules: [TODO]
- Run commands: npm run lint

### 3) Import and Module Conventions

- Import grouping/order: [TODO]
- Alias vs relative import policy: @/* alias used for app-root imports
- Public exports/barrel policy: [TODO]

### 4) Error and Logging Conventions

- Error strategy by layer: API routes and server actions return structured JSON or { success, error } objects.
- Logging style and required context fields: logger.debug/info/warn/error with [scope] prefix.
- Sensitive-data redaction rules: [TODO]

### 5) Testing Conventions

- Test file naming/location rule: tests/**/*.test.ts
- Mocking strategy norm: Vitest restoreMocks/clearMocks/unstubGlobals enabled
- Coverage expectation: [TODO]

### 6) Evidence

- eslint.config.mjs
- lib/logger.ts
- tsconfig.json
- vitest.config.ts
- lib/constants.ts

## Extended Sections (Optional)

- [TODO]
