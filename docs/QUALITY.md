# Quality report

Evidence from the last full run on the final code (local MariaDB 10.11, Node 22, Chromium via Playwright). "Passed" means the command exited 0 with the counts shown. Nothing below was run against the live Hostinger site.

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | passed, no warnings |
| Types | `npm run typecheck` | passed |
| Unit tests (matching, natural-language parser, profile review, JD check) | `npm run test:unit` | 8 passed |
| End-to-end user journeys (UI, real server and database) | `npm run test:e2e` | 170 checks passed, 0 failed |
| Access-control matrix | `npm run test:access` | 224 of 224 passed (6 roles × pages and APIs); a negative control proved it fails on a wrong expectation |
| Accessibility + phone layout | `npm run test:a11y` | 122 page-and-width checks passed, 0 failed (59 URLs across 6 roles, desktop 1280 px and phone 375 px: axe-core WCAG 2.x A/AA + no horizontal scroll on phones) |
| Production build + smoke (CSP, PWA/offline, OG, contact form) | `npm run build`, `npm run test:e2e:prod` | passed on this final build (ALL PASSED) |
| Database down | `node e2e/degraded.mjs` | passed in an earlier phase; not re-run for later phases |
| CI | GitHub Actions: MySQL 8 (with schema drift check) and MariaDB 10.11 | ran green on `main` through PR #4; the stacked PRs (#5 to #23 and this one) have **not** been seen by CI yet |

## What the end-to-end suite covers
Sign-up and login, onboarding and profile score; employer verification gate; listing validation (pay/mode/location/eligibility), moderation, search/filter/pagination; applying, duplicate prevention, withdrawing, messaging with email and unsubscribe; pipeline moves, interviews (IST handling, calendar files, authorization), offers (accept/decline, "Hired" only after acceptance); team invites and removal; challenges (rubric validation, moderation, submit/resubmit, human review, shortlisting into the pipeline, evidence-backed skill); written assessments and coding assessments against a mock sandbox (hidden-test secrecy, time limit); Passport usernames, privacy tiers, evidence labels, admin verification, resume view; community (posting, comments, reporting, moderation, blocking, archive); college portal (departments, drives, consent, outcomes, CSV, withdrawal of consent); career copilot, natural-language search, JD check; plan limits and admin upgrades; account suspension; uploads; rate limiting.

## Not tested, or only partly
- **Real services**: live Resend email, Google sign-in, a real Judge0 sandbox, Hostinger runtime, real traffic. Email was tested against a mock server; coding assessments against a test double that runs JavaScript locally.
- **Accessibility**: automated axe-core (WCAG 2.0/2.1/2.2 A and AA rules) catches only part of what matters. **No manual keyboard-only pass, screen-reader pass or colour-contrast review of dark and light themes beyond axe was done.** The light theme was not re-checked after the rebrand.
- **Performance**: Lighthouse was last run in an earlier phase on the old design; it was not re-run for the rebrand or phases 4 to 13.
- **Cross-browser**: Chromium only. Phone layout is checked at 375 px width for horizontal overflow, not on real devices.
- **Concurrency**: slot booking and rate limiting were tested for races in earlier phases; the newer features (offers, drives, group posts) rely on unique constraints and transactions but have no dedicated concurrency tests.
- **Security**: no third-party penetration test, no dependency audit result recorded (run `npm audit`).
- **Load**: none.

## Defects found and fixed during this build
Private and suspended profiles appeared in recruiter talent search; dashboard pages overflowed horizontally on phones (grid min-width); scrollable regions lacked keyboard access; `datetime-local` values were read in the server's timezone instead of IST (mentor slots); the admin-suspend e2e step matched static text and raced; an offline stylesheet MIME error from a stale server (test harness, not product).

## Known limitations
See the "Not built" list in `README.md` and `docs/SECURITY.md`. Prices on `/employers` are placeholders; legal pages are drafts; the font is a placeholder (Montserrat) and the logo mark is an approximate redraw until the official files are supplied.
