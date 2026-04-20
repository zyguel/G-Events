# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: Vitest (`^3.2.4`).
- Assertion/mocking tools: built-in `expect`, `vi`, `vi.mock`.
- Commands:

```bash
npm run test
npm run test:unit
npm run test:integration
npm run test:auth-api
```

### 2) Test Layout

- Test file placement pattern: dedicated `tests/unit/` and `tests/integration/` directories.
- Naming convention: `.test.ts` suffix for files.
- Setup files and where they run: no separate global setup file is present; Vitest config enables `restoreMocks` and `clearMocks`.

### 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | Yes | Library helpers, auth helpers, API route behavior | `tests/unit/auth` contains unit-style tests |
| Integration | Yes | API routes and auth gateway behavior | `tests/integration/api`, `tests/integration/auth` |
| E2E | No | No browser-level end-to-end suite detected | No Cypress or Playwright config found |

### 4) Mocking and Isolation Strategy

- Main mocking approach: module mocking using `vi.mock(...)`.
- Isolation guarantees: `restoreMocks`, `clearMocks`, and `unstubGlobals` are enabled in `vitest.config.ts`.
- Common failure mode in tests: direct route handler imports are mocked to simulate auth conditions rather than full end-to-end flows.

### 5) Coverage and Quality Signals

- Coverage tool + threshold: not configured in repository; threshold is unknown.
- Current reported coverage: not available from repo files.
- Known gaps/flaky areas: no explicit coverage or flaky test artifacts were detected.

### 6) Evidence

- `vitest.config.ts`
- `package.json`
- `tests/integration/api/usersSearchRoute.test.ts`
- `tests/unit/auth` directory
