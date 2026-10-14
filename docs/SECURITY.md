# Security and privacy checklist

Status key: **Done** (implemented and covered by an automated test or inspection), **Partly**, **Not done**. Nothing here was penetration-tested by a third party.

## Authentication and sessions
- **Done**: one-time codes are hashed, expire in 10 minutes, allow 5 attempts, and are rate-limited per identifier and per IP.
- **Done**: optional **password login** next to email codes: scrypt (N=2^15, r=8) with per-password salt and constant-time compare; 10 to 128 characters, common and email-derived passwords refused; login limited to 8 tries per account per 15 minutes and 30 per IP per hour (email codes still work during a lockout); wrong email and unknown email give the identical message and similar timing; changing or removing needs the current password, except within 10 minutes of an email-code login (so a forgotten password can be reset); password-login sessions can't skip the check; the hash never appears in exports; changes are audited and notified.
- **Done**: sessions are signed JWTs in an `httpOnly`, `sameSite=lax`, `secure` (production) cookie; suspension takes effect on the next request (the user is re-read from the database every time).
- **Done**: `AUTH_SECRET` and `DATABASE_URL` are validated at startup; secrets are never sent to the browser. Logs print only the length and shape of the DB password.
- **Not done**: SMS sign-in, 2FA, a breached-password list check (only a short common-password list is used). Google sign-in exists but is untested against real credentials.

## Authorization
- **Done**: every server action and API route checks the role on the server (`requireActionRole` / `requirePageRole`); see `docs/API.md`.
- **Done**: automated **access matrix** (`npm run test:access`): 6 roles × every protected page and API, 224 checks, with a negative control proving it detects wrong expectations.
- **Done**: ownership checks on every object (applications, submissions, drives, interviews, assessments, files) are scoped in the query, not after it; unrelated users get 404/403 (tested for each feature in `e2e/platform.mjs`).
- **Done**: recruiter-only data requires a **verified** company; college data requires a **verified** college.

## Input, output and browser security
- **Done**: all input validated with zod; Prisma parameterises queries (no raw SQL).
- **Done**: React escapes output; the only `dangerouslySetInnerHTML` uses are JSON-LD (with `<` escaped) and a server-generated QR SVG.
- **Done**: CSP (`default-src 'self'`, no remote scripts), HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` in production; Next.js server actions enforce same-origin.
- **Done**: external links use `rel="noopener noreferrer"` and `nofollow` for user-supplied URLs; only `http(s)` URLs are accepted.
- **Done**: CSV exports neutralise spreadsheet formulas.

## Abuse and reliability
- **Done**: DB-backed, atomic rate limits on sign-in, messages, reports, posts, comments, group creation, uploads, assessment runs and submissions, report downloads.
- **Done**: uploads accept PNG/JPEG/WebP only (magic bytes checked, no SVG), 1 MB cap, owner-scoped.
- **Done**: unhandled server errors are logged (no personal data) and visible to admins; `/api/health` reports safe failure categories only; the public site degrades gracefully when the database is down (`e2e/degraded.mjs`).
- **Done**: admins can suspend users (immediate), hide community content, archive groups, and every sensitive action is written to the audit log.

## Code execution
- **Done**: coding assessments never run code locally. They call an isolated Judge0-compatible service (`SANDBOX_URL`) with CPU, wall-time and memory limits and networking disabled; without `SANDBOX_URL` the feature is off.
- **Not verified**: behaviour against a real Judge0 deployment. Host the sandbox on a separate machine/network, not next to the database or app secrets.

## Privacy and data
- **Done**: contact details are never returned by Passport, roster, drive or report queries (explicit `select`s); tested for emails in HTML and CSV.
- **Done**: Passport visibility per section (public / verified recruiters / only me); private and suspended profiles are excluded from recruiter search; college and drive sharing are opt-in and revocable.
- **Done**: account export (`/api/account/export`) and self-service account deletion; the AI-style features run on the server with data the viewer may already see and send nothing to external services.
- **Partly**: retention is documented in `docs/OPERATIONS.md`; automated deletion of old rate-limit/OTP/error rows is not scheduled.
- **Known property**: uploaded images are served by unguessable ID without a login (a capability URL, cached by browsers). They appear only where the owner's profile is shown, but anyone holding the URL can fetch the image. Don't upload anything sensitive.
- **Not done**: encryption of individual database fields (rely on provider disk encryption and TLS).

## Dependencies and supply chain
- **Done**: lockfile committed, CI builds from it, Dependabot enabled. Run `npm audit` before launch and review results.

## Before launch (owner)
Rotate any secret that was ever pasted in a screenshot or chat (mailbox password, `AUTH_SECRET`, DB password); turn on branch protection; confirm backups run (`docs/OPERATIONS.md`); have a lawyer review Privacy/Terms; decide on SMS, payments and LLM providers.
