# G-Events Handoff (Capstone)

This one-pager is for the next maintainer, adviser, or panel reviewer.

## 1) Project Scope

- This build is complete for thesis/capstone deployment.
- Payment gateway + webhook integration is intentionally excluded.
- Certificate verification uses an application-level blockchain hash chain in PostgreSQL.

## 2) Required Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DEFAULT_ORG_ID=1
TS_TRANSLATION_MODEL=Xenova/m2m100_418M
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

Generate `CRON_SECRET`:

```bash
openssl rand -base64 32
```

## 3) Required SQL Migrations

Run these in Supabase SQL Editor:

- `database/add_order_form_entries_table.sql`
- `database/add_event_waitlist_settings_table.sql`
- `database/add_event_email_campaigns_table.sql`
- `database/add_event_certificates_tables.sql`
- `database/add_certificate_blockchain_ledger.sql`

## 4) Cron Endpoints

Set scheduler jobs for:

- `POST /api/cron/process-email-campaigns`
- `POST /api/cron/process-certificate-emails`

Required header for both:

- `x-cron-secret: <CRON_SECRET>`

## 5) Implemented Features (Current)

- Event management: create/edit/publish events
- Public registration page linked to admin-created order forms
- Registration flow with waitlist fallback
- Waitlist settings persisted in DB
- Admin check-in and order management using real APIs
- Email campaigns with queue + scheduled processing
- Certificates: template creation, issuance queue, email sending, token download
- Blockchain-style certificate verification via hash chain (`CertificateLedger`)
- Analytics and reports wired to real data, including CSV/XLSX/PDF exports

## 6) Verification API (Blockchain)

Use:

- `GET /api/certificates/[token]/verify`

Response includes:

- `verified`
- `certificateHash`
- `blockHash`
- `previousHash`
- `blockIndex`
- `blockTimestamp`

## 7) Quick Smoke Test (Before Demo/Deployment)

1. Create and publish event with at least one ticket.
2. Create order form and submit from public register page.
3. Validate one confirmed registrant and one waitlisted case.
4. Check-in attendee and confirm status appears in reports.
5. Send preview email and scheduled email; trigger email cron.
6. Create cert template, issue certs, download cert, verify cert token.
7. Open analytics/reports and export CSV/XLSX/PDF.
8. Run production build:

```bash
npm run build -- --webpack
```

## 8) Handoff Notes

- Canonical setup details live in `README.md`.
- This file is the short reviewer/maintainer briefing copy.
