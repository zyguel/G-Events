# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript (React) | package.json, tsconfig.json |
| Runtime + version | Node.js 20+ (dev), Next.js App Router runtime | README.md, package.json |
| Package manager | npm | README.md, package.json |
| Module/build system | Next.js (App Router) + Vite config for Vitest | package.json, vitest.config.ts |

### 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| next | ^16.2.6 | App Router framework/runtime | package.json |
| react / react-dom | 19.2.3 | UI runtime | package.json |
| @supabase/supabase-js | ^2.97.0 | Database/auth client | package.json |
| @supabase/ssr | ^0.9.0 | Server/client Supabase helpers | package.json |
| nodemailer | ^8.0.4 | SMTP email transport | package.json, lib/emailProvider.ts |
| jspdf / jspdf-autotable | ^4.2.1 / ^5.0.7 | PDF export | package.json |
| exceljs | ^4.4.0 | XLSX export | package.json |
| framer-motion | ^12.29.2 | UI animation | package.json |
| tiptap packages | ^3.17.1 | Rich-text editor | package.json |

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| eslint + eslint-config-next | Linting | eslint.config.mjs, package.json |
| typescript | Type checking | tsconfig.json, package.json |
| vitest | Unit/integration tests | vitest.config.ts, package.json |
| tailwindcss + @tailwindcss/postcss | Styling build pipeline | package.json, postcss.config.mjs |

### 4) Key Commands

```bash
npm install
npm run build
npm run test
npm run lint
```

### 5) Environment and Config

- Config sources: package.json, tsconfig.json, next.config.ts, eslint.config.mjs, postcss.config.mjs
- Required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_DEFAULT_ORG_ID, EMAIL_PROVIDER, SMTP_* or RESEND_*, CRON_SECRET, APP_URL
- Deployment/runtime constraints: README.md documents Node.js v20+ and npm v10+ as prerequisites; APP_URL required for production email link normalization.

### 6) Evidence

- package.json
- tsconfig.json
- next.config.ts
- README.md
- docs/HANDOFF.md

## Extended Sections (Optional)

- [TODO]
