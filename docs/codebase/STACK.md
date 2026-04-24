# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript | `package.json`, `tsconfig.json` |
| Runtime + version | Node.js 20+ (recommended) | `README.md` |
| Package manager | npm | `package.json` scripts |
| Module/build system | Next.js App Router + ES module-based TypeScript | `package.json`, `next.config.ts`, `app/layout.tsx` |

### 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| `next` | `latest` | React App Router framework, SSR/SSG, API routes | `package.json` |
| `react` / `react-dom` | `19.2.3` | UI components and client rendering | `package.json` |
| `@supabase/supabase-js` | `^2.97.0` | Supabase client for database, auth, storage, realtime | `package.json`, `lib/supabase.ts` |
| `@supabase/ssr` | `^0.9.0` | Server-side Supabase client support for cookies and SSR | `package.json`, `lib/supabase-server.ts` |
| `tailwindcss` / `@tailwindcss/postcss` | `^4` | Utility-first styling pipeline | `package.json`, `postcss.config.mjs` |
| `nodemailer` | `^8.0.4` | SMTP email transport backend | `package.json`, `lib/emailProvider.ts` |
| `exceljs` | `^4.4.0` | XLSX export generator | `package.json` |
| `jspdf` / `jspdf-autotable` | `^4.2.1` / `^5.0.7` | PDF export generation | `package.json` |

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| `typescript` | Static typing and compile-time validation | `package.json`, `tsconfig.json` |
| `eslint` / `eslint-config-next` | Linting and code quality | `package.json`, `eslint.config.mjs` |
| `vitest` | Unit and integration testing | `package.json`, `vitest.config.ts` |
| `vite-tsconfig-paths` | Resolve TS path alias imports in tests | `package.json`, `vitest.config.ts` |
| `tailwindcss` | CSS utilities compiler | `package.json`, `postcss.config.mjs` |

### 4) Key Commands

```bash
npm install
npm run build
npm run test
npm run lint
```

### 5) Environment and Config

- Config sources: `.env.local`, `process.env`, `next.config.ts`, `lib/emailProvider.ts`, `lib/supabase-server.ts`
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_DEFAULT_ORG_ID`, `CRON_SECRET`, `APP_URL`, `EMAIL_PROVIDER`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
- Deployment/runtime constraints: Next.js App Router host; production uses Vercel and requires `APP_URL` for secure absolute URLs and email HTML URL normalization.

### 6) Evidence

- `package.json`
- `README.md`
- `tsconfig.json`
- `next.config.ts`
- `lib/emailProvider.ts`
- `lib/supabase-server.ts`
