# Code Review: API Security Hardening
**Ready for Production**: No (improved, but additional remediation remains)
**Critical Issues**: 2

## Priority 1 (Must Fix) ⛔
- **Host-header trust for certificate links**
  - **Risk**: absolute download/verify links used `request.nextUrl.origin`, which can be influenced by incoming Host/X-Forwarded-* headers in some deployments.
  - **Fix Applied**: Added trusted origin resolution in `lib/security.ts` and routed certificate processing endpoints to use `resolveTrustedAppOrigin(...)`.
  - **Files**:
    - `lib/security.ts`
    - `app/api/cron/process-certificate-emails/route.ts`
    - `app/api/events/[eventId]/certificates/process/route.ts`
    - `app/api/events/[eventId]/certificates/issue/route.ts`

- **Timing-leak prone cron secret validation**
  - **Risk**: direct string comparison for `x-cron-secret` can leak timing signal and used inconsistent checks.
  - **Fix Applied**: Introduced constant-time comparison via `crypto.timingSafeEqual` (`safeCompareSecrets`) and updated cron endpoints.
  - **Files**:
    - `lib/security.ts`
    - `app/api/cron/process-email-campaigns/route.ts`
    - `app/api/cron/process-certificate-emails/route.ts`

## Priority 2 (Should Fix Soon)
- **HTML injection risk in certificate email content**
  - **Risk**: recipient name and generated URLs were injected into HTML email body without escaping.
  - **Fix Applied**: Added HTML escaping and applied before composing email body.
  - **File**: `lib/certificates.ts`

- **Unsafe HTML rendering in campaign list snippets**
  - **Risk**: `dangerouslySetInnerHTML` used for email snippet previews.
  - **Fix Applied**: replaced with plain text rendering using `htmlToPlainText(...)`.
  - **Files**:
    - `lib/security.ts`
    - `app/(admin_side)/events/[eventId]/email-attendees/EmailAttendeesClient.tsx`

- **Unbounded translation payloads (DoS risk)**
  - **Risk**: translation endpoints accepted unbounded array sizes/text volume.
  - **Fix Applied**: added max item/count limits and request validation in both translate endpoints.
  - **Files**:
    - `app/api/translate/route.ts`
    - `app/api/translate/realtime/route.ts`

## Recommended Changes
- Standardize all API route error responses to avoid leaking raw `error.message` in client responses.
- Add rate limiting for high-cost routes (`translate`, campaign/certificate processing).
- Add explicit authz checks per event/organization (not just authentication), especially for event-scoped routes.
- Set and enforce `APP_URL` in production environments to avoid fallback behavior.
- Rotate any exposed secrets and remove real credentials from shared `.env.local` snapshots.

## Verification Notes
- All modified backend files are free of new diagnostics in targeted checks.
- Existing unrelated diagnostics remain in `app/(admin_side)/events/[eventId]/email-attendees/EmailAttendeesClient.tsx` (Tailwind class migration suggestions), not introduced by this patch.