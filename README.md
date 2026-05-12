# 🚀 G-Events

![Build Status](https://img.shields.io/badge/build-passed-brightgreen) ![License](https://img.shields.io/badge/license-Proprietary-red) ![Version](https://img.shields.io/badge/version-1.0.0--alpha-orange)

**G-Events** is a **comprehensive event management dashboard** designed to give organizers full control over every stage of an event — from creation and registration to check-in, analytics, and certificate distribution.

## 📋 Table of Contents
* [About the Project](#-about-the-project)
* [Branching Strategy](#-branching-strategy)
* [Getting Started](#-getting-started)
* [Handoff One-Pager](#-handoff-one-pager)
* [Contribution Guidelines](#-contribution-guidelines)
* [Commit Standards](#-commit-standards)
* [Pull Request Process](#-pull-request-process)
* [Security Policy](#-security-policy)
* [License](#-license)

---

## 📖 About the Project

G-Events provides a robust solution for **managing the full lifecycle of events** — from drafting and publishing, through attendee registration and check-in, to post-event analytics and reporting.

**Key Features:**
* **Event Management:** Create, edit, and publish events with rich-text descriptions, banner images, agendas, themes, and objectives.
* **Attendee Registration & Order Forms:** Customisable multi-section order forms with field types (short answer, multiple choice, dropdowns, file upload, grids, etc.) and automatic confirmation pages.
* **Check-In:** Real-time attendee check-in interface for on-the-day operations.
* **Ticketing & Waitlists:** Manage ticket types, capacity limits, and waitlist queues.
* **Breakout Sessions:** Optional breakout session management per event.
* **Email Attendees:** Compose and send targeted emails to registered attendees directly from the dashboard.
* **Analytics & Reports:** Per-event and cross-event analytics (registrations, revenue, attendance trends, demographics) with export to CSV, Excel (XLSX), and PDF.
* **Certificates:** Certificate generation/distribution with blockchain-style hash-chain verification.
* **Team Management:** Role-based organisation user management with granular permissions.
* **Dark / Light Mode:** Full theme support across the entire admin dashboard.

### Built With

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database / Auth** | Supabase (PostgreSQL + Row-Level Security) |
| **Rich Text** | TipTap v3 (StarterKit, Underline, Link, Image, TextAlign, Color, FontFamily, FontSize, Placeholder) |
| **Charts / Data** | Custom analytics/visualization components |
| **Exports** | jsPDF + jspdf-autotable (PDF), ExcelJS (XLSX), native CSV |
| **Animations** | Framer Motion v12 |
| **Icons** | Lucide React |
| **Date Handling** | date-fns v4, react-datepicker, react-time-picker |
| **Analytics** | Vercel Analytics |

---

## 🌿 Branching Strategy

We utilize a strict branching workflow to ensure stability while allowing for rapid development.

| Branch | Status | Description |
| :--- | :--- | :--- |
| **`main`** | 🟢 **Stable** | Production-ready code. This branch is protected and only accepts merges from `nightly` after thorough testing. **Do not push directly to main.** |
| **`nightly`** | 🟠 **Beta/Dev** | The active development branch. Contains the latest features and fixes. It may be unstable. All PRs should target this branch. |

---

## 🛠 Getting Started

### Prerequisites
* **Node.js** v20 or later
* **npm** v10 or later
* A **Supabase** project (free tier is sufficient for development)

### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/zyguel/G-Events.git
    ```
2.  **Checkout the development branch:**
    ```bash
    git checkout nightly
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Configure environment variables:**

    Create a `.env.local` file in the project root:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_DEFAULT_ORG_ID=1
    EMAIL_PROVIDER=smtp
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=465
    SMTP_SECURE=true
    SMTP_USER=your_smtp_username
    SMTP_PASS=your_smtp_password_or_app_password
    SMTP_FROM_EMAIL=noreply@your-domain.com
    # Optional alternatives
    # SMTP_URL=smtps://username:password@smtp.gmail.com:465
    # RESEND_API_KEY=your_resend_api_key
    # RESEND_FROM_EMAIL=noreply@your-domain.com
    CRON_SECRET=your_cron_secret
    ```
> Generate cron secret key `openssl rand -base64 32`
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

> For email campaigns, run the SQL migration in `database/add_event_email_campaigns_table.sql` in your Supabase SQL editor.
> Scheduled campaigns can be processed through `POST /api/cron/process-email-campaigns` with header `x-cron-secret: <CRON_SECRET>`.
> For certificates, run `database/add_event_certificates_tables.sql` and optionally schedule `POST /api/cron/process-certificate-emails` with the same `x-cron-secret` header.
> For certificate blockchain verification, run `database/add_certificate_blockchain_ledger.sql`.
> For backend waitlist preferences, run `database/add_event_waitlist_settings_table.sql`.

### Project Handoff Checklist

Use this section when handing the project to a new maintainer.

#### 1) Required Environment Variables

| Key | Required | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anon key |
| `NEXT_PUBLIC_DEFAULT_ORG_ID` | Yes | Default organization id used by app context |
| `EMAIL_PROVIDER` | Optional (`auto` default) | Select `smtp`, `resend`, or `auto` |
| `SMTP_HOST` | Yes (for SMTP host mode) | SMTP server hostname (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | Optional (for SMTP host mode) | SMTP port (defaults to `587`) |
| `SMTP_SECURE` | Optional (for SMTP host mode) | Use TLS (`true`/`false`), default inferred from port |
| `SMTP_USER` | Yes (for SMTP host mode) | SMTP auth username |
| `SMTP_PASS` | Yes (for SMTP host mode) | SMTP auth password/app password |
| `SMTP_FROM_EMAIL` | Yes (for SMTP mode) | Sender email address |
| `SMTP_URL` | Optional (for SMTP URL mode) | Full SMTP connection URL instead of host/user/pass |
| `RESEND_API_KEY` | Yes (if using Resend mode) | API key for sending attendee/certificate emails |
| `RESEND_FROM_EMAIL` | Yes (if using Resend mode) | Sender email/domain configured in Resend |
| `CRON_SECRET` | Yes (if cron routes are enabled) | Shared secret for protected cron endpoints; also used to sign e-ticket QR image URLs in emails if `TICKET_QR_EMAIL_SECRET` is unset |
| `TICKET_QR_EMAIL_SECRET` | Optional | HMAC secret for `/api/ticket-qr` links in registration emails (mail apps block inline `data:` QR images). Falls back to `CRON_SECRET`, then a dev-only default in development |
| `APP_URL` | Yes  | dev: http://localhost:3000 |

#### 2) DB Migrations Required for Current Features

Run these in Supabase SQL editor before production use:

- `database/add_order_form_entries_table.sql`
- `database/add_event_waitlist_settings_table.sql`
- `database/add_event_email_campaigns_table.sql`
- `database/add_event_certificates_tables.sql`
- `database/add_certificate_blockchain_ledger.sql`

#### 3) Cron Endpoints (Optional but Recommended)

Set scheduler jobs to call:

- `POST /api/cron/process-email-campaigns`
- `POST /api/cron/process-certificate-emails`

Header required for both:

- `x-cron-secret: <CRON_SECRET>`

#### 4) Features Wired End-to-End (Current)

- Admin + public order form flow connected (`/events/[eventId]/register`)
- Order form submission -> registration/waitlist decision + confirmation email
- Waitlist settings persisted in DB (`EventWaitlistSettings`)
- Admin check-in uses real registration data + API updates
- Email campaigns use DB queue + scheduled processing + configurable SMTP/Resend provider
- Certificates use template storage + issue queue + secure token download route
- Certificates are anchored to a blockchain-style hash chain (`CertificateLedger`) with public verification route
- Analytics pages wired to real registrations/revenue/attendance/demographics data
- Reports use real registrants + breakout stats + CSV/XLSX/PDF export

#### 5) Known Product Scope Decision

- Payment gateway/webhook lifecycle is intentionally excluded for thesis deployment.
  Registration and waitlist are active without payment integration.

#### 6) Certificate Verification (Blockchain-Style)

Each issued certificate can be cryptographically verified via:

- `GET /api/certificates/[token]/verify`

The response includes:

- `verified` flag
- certificate hash
- block hash
- previous hash
- block index and timestamp

This is an application-level blockchain pattern (hash chain in PostgreSQL), suitable for capstone/thesis demonstration without external chain fees.

#### 7) Final QA Before Handoff

Run this exact smoke test flow once on a clean environment:

1. Create + publish an event with at least one ticket.
2. Create an order form and submit through public `/events/[eventId]/register`.
3. Confirm one registrant and force one waitlist case.
4. Test admin check-in toggle and verify reflected status in reports.
5. Send one preview attendee email and one scheduled email; trigger cron processor.
6. Create certificate template, issue certificates, and verify:
   - download endpoint works
   - `/api/certificates/[token]/verify` returns `verified: true`
7. Open analytics and reports pages and export CSV/XLSX/PDF.
8. Run `npm run build` and ensure it succeeds.

### 📦 Handoff One-Pager

For adviser/panel/new-maintainer quick review, see:

- `docs/HANDOFF.md`

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start local development server |
| `npm run build` | Compile production build |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint checks |
| `npm run test` | Run all tests (unit + integration) |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:auth-api` | Run auth API tests (unit + integration) |
| `npm run audit:deps` | Run npm audit for high-severity vulnerabilities |
| `npm run sast:owasp` | Run Semgrep OWASP Top 10 security scan |
| `npm run perf:smoke` | Run smoke test for auth API performance |
| `npm run ci:baseline` | Run full CI baseline (lint, build, test, audit, SAST, perf) |
| `npm run push -- "<message>"` | Stage/commit/pull-merge/push helper for `nightly` |
| `npm run debug:supabase` | Verify Supabase storage access and list buckets |
| `npm run check:event-schema` | Check `Event` table schema visibility |
| `npm run check:objectives` | Verify `Event.objectives` column availability |
| `npm run check:theme` | Verify `Event.theme` column availability |
| `npm run debug:login-layout-diff` | Compare login branding sections between auth pages |
| `npm run translations:split-static` | Split static translation map into per-language modules |
| `npm run backfill:addon-entitlements` | Backfill add-on entitlements for existing registrations |

### Maintainability Baseline (Enterprise)

The codebase now includes shared primitives to keep API and server behavior consistent:

- **Shared constants:** use `lib/constants.ts` for defaults and HTTP status codes (avoid repeated env parsing).
- **Structured logging:** use `lib/logger.ts` with scope-based logging (`debug/info/warn/error`) instead of ad-hoc `console.log`.
- **Script organization:** debug and maintenance utilities are primarily under `scripts/debug/` and `scripts/maintenance/`, with additional helper checks under `scripts/`.

When adding or updating routes, prefer these shared modules first to keep behavior predictable across the API surface.

### Architecture Documentation

For detailed architectural analysis, module breakdown, data flows, and dependency diagrams, see:
- [architecture-analysis.md](architecture-analysis.md)

---

## 🤝 Contribution Guidelines

We welcome contributions from the internal team. To ensure a smooth collaboration, please follow the standards outlined below.

### 📝 Commit Standards

We follow the **Conventional Commits** specification. This allows us to automatically generate changelogs and version numbers.

**Format:**
`type(scope): subject`

**Types:**
* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation only changes
* `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
* `refactor`: A code change that neither fixes a bug nor adds a feature
* `perf`: A code change that improves performance
* `test`: Adding missing tests or correcting existing tests
* `chore`: Changes to the build process or auxiliary tools and libraries

**Examples:**
> ✅ `feat(auth): implement google oauth login`
>
> ✅ `fix(calendar): correct timezone offset calculation`
>
> ✅ `docs(readme): update installation instructions`

**Bad Examples:**
> ❌ `added login` (Missing type)
>
> ❌ `fixed stuff` (Vague)

### ⚡ Safe Commit & Push Helper

A cross-platform Node.js script (`push-nightly.mjs`) is included at the repo root. It works on **macOS and Windows** using the Node.js already required by the project, and mirrors the GitHub Desktop workflow — pulling remote changes before committing, and auto-merging if the remote receives new commits between your pull and push.

```bash
# Via npm (recommended — works identically on macOS and Windows)
npm run push -- "feat(events): add certificate expiry field"

# Or directly with Node.js
node push-nightly.mjs "feat(events): add certificate expiry field"

# Commit only pre-staged files (skip auto git add --all)
npm run push -- "fix(checkin): resolve null ref" --no-add
```

The script will:
1. Ensure you are on the `nightly` branch (switches automatically if not).
2. Fetch `origin/nightly` to detect any remote-ahead commits.
3. Merge remote commits into local **before** creating the commit.
4. Stage and commit with the provided message.
5. Push to `origin/nightly`.
6. If the push is rejected (someone else pushed while you were working), automatically merge the new remote commits and retry the push.

### 🔄 Pull Request Process

1.  **Commit:** Commit your changes using the standards defined above.
2.  **Sync:** Ensure your branch is up to date with the upstream `nightly` branch to minimize conflicts.
3.  **Open PR:** Submit a Pull Request targeting the **`nightly`** branch.
    * *Note: PRs targeting `main` will be closed.*
4.  **Description:** Clearly describe the problem you are solving and the solution you implemented.
5.  **Review:** Wait for code review. Address any comments or requested changes.

---

## 🔐 Security Policy

For vulnerability reporting, disclosure process, response SLAs, and supported-version guidance, see [SECURITY.md](SECURITY.md).

Please use private disclosure channels for security issues and avoid filing public security bug reports.

---

## 📄 License

**Copyright © [Year] [Your Company/Name]. All Rights Reserved.**

This project is proprietary software. Unauthorized copying, distribution, modification, or use of this source code, via any medium, is strictly prohibited without the express written permission of the copyright holder.

This software is intended for private use only.
