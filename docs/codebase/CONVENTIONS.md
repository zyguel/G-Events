# Coding Conventions

## Core Sections (Required)

### 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files | React components and page modules use `PascalCase`; route directories and utility modules use `kebab-case`/`camelCase` | `Header.tsx`, `OrderFormDisplay.tsx`, `emailProvider.ts`, `app/api/cron/process-email-campaigns/route.ts` | `components/admin/Header.tsx`, `lib/emailProvider.ts`, `app/api/cron/process-email-campaigns/route.ts` |
| Functions/methods | `camelCase` for normal functions; `PascalCase` for React components | `sendEmail`, `createClient`, `AdminCompactShell` | `lib/emailProvider.ts`, `lib/supabase-server.ts`, `components/admin/AdminCompactShell.tsx` |
| Types/interfaces | `PascalCase` | `SendEmailParams`, `CreateEventState` | `lib/emailProvider.ts`, `lib/actions/events.ts` |
| Constants/env vars | `SCREAMING_SNAKE_CASE` for env names; `camelCase` or `UPPER_SNAKE_CASE` for JS constants | `CRON_SECRET`, `APP_URL`, `SESSION_ROLE_COOKIE_NAME` | `lib/emailProvider.ts`, `lib/constants.ts` |

### 2) Formatting and Linting

- Formatter: no explicit Prettier config detected; formatting is implicitly driven by the Next.js/TypeScript ecosystem and editor defaults.
- Linter: ESLint via `eslint.config.mjs` with `eslint-config-next` and TypeScript support.
- Most relevant enforced rules: Next.js core web vitals rules, TypeScript lint rules, and global ignore overrides for `.next/`, `out/`, `build/`, `next-env.d.ts`.
- Run commands: `npm run lint`, `npm run build`, `npm run test`.

### 3) Import and Module Conventions

- Import grouping/order is not enforced by a separate formatter config in the repo, but aliased imports use `@/...` consistently for root-level modules.
- Alias policy: use `@/*` for repo root imports, configured in `tsconfig.json`.
- Barrel exports are not required by observed code; modules are imported directly from explicit paths.

### 4) Error and Logging Conventions

- Error strategy: API routes and server actions return structured JSON errors via `NextResponse.json(...)`, while lower-level helpers throw exceptions that are caught by route handlers.
- Logging style: `console.error`, `console.warn`, and occasional `console.log` are used in server-side code.
- Sensitive-data redaction: no dedicated redaction layer present; secrets are kept out of code and loaded from environment variables.

### 5) Testing Conventions

- Test file naming/location rule: test files live under `tests/unit/` and `tests/integration/` and use `.test.ts` suffix.
- Mocking strategy norm: mocking is performed with `vi.mock(...)` from Vitest and mock state resets are enabled globally.
- Coverage expectation: not configured in repository; coverage threshold is unknown.

### 6) Evidence

- `eslint.config.mjs`
- `tsconfig.json`
- `vitest.config.ts`
- `tests/integration/api/usersSearchRoute.test.ts`
- `lib/constants.ts`
