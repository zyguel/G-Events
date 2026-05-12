# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: Vitest (^3.2.4)
- Assertion/mocking tools: Vitest globals
- Commands:

```bash
npm run test
npm run test:unit
npm run test:integration
npm run test:auth-api
```

### 2) Test Layout

- Test file placement pattern: tests/**/*.test.ts
- Naming convention: *.test.ts
- Setup files and where they run: [TODO]

### 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | Yes | lib/ helpers and server actions | tests/unit |
| Integration | Yes | API routes and flows | tests/integration |
| E2E | No | [TODO] | No e2e config detected |

### 4) Mocking and Isolation Strategy

- Main mocking approach: Vitest module mocking
- Isolation guarantees: restoreMocks/clearMocks/unstubGlobals enabled
- Common failure mode in tests: [TODO]

### 5) Coverage and Quality Signals

- Coverage tool + threshold: [TODO]
- Current reported coverage: [TODO]
- Known gaps/flaky areas: [TODO]

### 6) Evidence

- vitest.config.ts
- package.json
- docs/codebase/.codebase-scan.txt

## Extended Sections (Optional)

- [TODO]
