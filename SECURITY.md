# Security Policy

## Purpose
This document defines how to report security vulnerabilities in G-Events and how the project handles triage, remediation, and disclosure.

This policy is written to align with common enterprise vulnerability-handling practices (coordinated disclosure, private intake, severity-based SLAs, and least-privilege remediation).

## Supported Versions
Security fixes are provided for the following release lines:

| Version | Support Status | Notes |
| --- | --- | --- |
| v0.4.x | Supported | Full security support |
| v0.3.x | Limited support | Critical fixes only, case-by-case |
| nightly | Best effort only | Development branch, not for production use |
| < v0.3.0 | Not supported | Upgrade required |

## Reporting a Vulnerability
Do not open public issues for security reports.

Use one of these private channels:

1. Preferred: GitHub Security Advisories (private vulnerability report)
   - Repository Security tab -> Report a vulnerability
2. Fallback: Directly contact repository maintainers privately through GitHub

If you cannot use a private channel, disclose only minimal details publicly and request private follow-up.

## What to Include in a Report
Please include as much of the following as possible:

- Vulnerability type (for example: authentication bypass, IDOR, SSRF, XSS, SQLi)
- Affected component(s) and path(s)
- Reproduction steps and prerequisites
- Proof of concept or payload
- Impact assessment (data exposure, privilege escalation, integrity/availability impact)
- Suggested fix or mitigation (optional)

High-quality reports improve response time and reduce back-and-forth.

## Response and Remediation Targets
The team uses severity-based response objectives.

| Severity | Initial Acknowledgment | Triage Decision | Fix Target |
| --- | --- | --- | --- |
| Critical | 1 business day | 2 business days | 7 calendar days |
| High | 1 business day | 3 business days | 14 calendar days |
| Medium | 2 business days | 5 business days | 30 calendar days |
| Low | 3 business days | 10 business days | Next planned release |

These are targets, not guarantees. Complex or dependency-driven issues may require longer.

## Disclosure Policy
This project follows coordinated disclosure:

- Reports are handled privately during investigation and patching.
- Public disclosure occurs after a fix is available or a mitigation is in place.
- Credit is provided to reporters unless anonymity is requested.

Please do not publish exploit details before maintainers confirm remediation or a mutually agreed disclosure date.

## Security Baseline for Contributors
When implementing or reviewing changes, follow these minimum controls:

- Enforce authentication in API routes (`requireUser` and route-level checks).
- Enforce organization scoping server-side using active organization context.
- Use centralized security helpers in `lib/security.ts`:
  - `safeCompareSecrets` for secret comparison
  - `resolveTrustedAppOrigin` for trusted absolute URL generation
  - `escapeHtml`/`htmlToPlainText` for output safety
- Keep cron endpoints protected with `x-cron-secret` and strong `CRON_SECRET` values.
- Do not expose sensitive internals in API error responses.
- Do not commit secrets, credentials, or production tokens.
- Use least privilege for service credentials and keep service-role operations server-only.

## Scope and Out-of-Scope
In scope:

- Authentication/authorization bypasses
- Organization data isolation failures
- Injection vulnerabilities (XSS, SQL/NoSQL, template injection)
- Sensitive data exposure
- Critical dependency or supply-chain vulnerabilities with practical impact

Out of scope (unless chained into practical impact):

- Purely cosmetic/UI defects
- Self-XSS without privilege or data impact
- Theoretical issues without reproducible impact
- Vulnerabilities in unsupported versions

## Compliance and Logging Considerations
G-Events includes a tamper-evident audit trail design for sensitive operations. Security-relevant changes should preserve audit integrity and avoid bypassing logging pathways.

## Security Updates
Security fixes may be released outside normal feature cadence. When needed, maintainers may ship patch-only releases.

## Safe Harbor
If you act in good faith, avoid privacy violations, avoid service disruption, and follow this policy, the project will treat your research as authorized under this coordinated disclosure process.
