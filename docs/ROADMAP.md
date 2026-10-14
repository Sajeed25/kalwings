# KALWINGS 2.0 roadmap and autopilot status

Source: the "KALWINGS 2.0 Ultimate Product Prompt" (owner-provided). This file is the single source of truth for what is built, what is next, and how an unattended session should continue.

## Rules for any session (human or automated)
1. Read this file first. Work on the **first phase marked `TODO`**; mark it `IN PROGRESS` in the same branch.
2. One phase = one branch `claude/pNN-<slug>` = one PR. **Stack PRs**: base each PR on the previous phase's branch (or `main` if that one is merged). Never merge PRs; the owner merges bottom-up.
3. Before a PR: `npx tsc --noEmit`, `npm run lint`, `npm run build`, new migration (diff-based, JSON `MODIFY` noise stripped, see DEPLOYMENT.md/CI notes), add e2e checks, run `e2e/platform.mjs` + `e2e/production.mjs` against local MariaDB (`service mariadb start`; db kalwings/kalwings; clear `RateLimit` between runs).
4. Trust rules never relax: no invented stats/testimonials/verification, pay/mode/location/eligibility shown, student contact private, no auto-rejection by opaque scores, no untrusted code on the app server, AI output advisory only.
5. Keep existing URLs working. New route names from the prompt (`/recruiter/*`, `/college/*`, `/admin/*`) are added as aliases/redirects to the existing `/dashboard/*` pages, not as breaking moves.
6. At the end of a phase update the table below, add a short "Done / Tested / Not done" note to the PR, then go to the next phase.
7. Do not start a phase if its branch already has an open PR updated in the last 60 minutes (another session is on it); take the next one.

## Already built (Phase 0 to 3 of the first plan, plus rebrand)
Auth (email OTP, sessions, roles), onboarding wizard, profile completeness, portfolio projects, Talent Card + QR, applications + tracker, saved roles, mentor profiles/slots/sessions/endorsements, employer verification + posting + moderation + pipeline + notes + messaging + shortlist, college registration + consent roster, admin queues/audit log/reports/errors, notifications + emails, uploads, rate limiting, suspension, close/reopen listings, data export, account deletion, PWA, SEO, CSP, health diagnostics, CI (MySQL 8 + MariaDB), rebrand (PR #5, awaiting font + official logo).

## Gap analysis vs the prompt
| Prompt area | State |
| --- | --- |
| Marketplace: search, filters, sort, pagination, types, deadlines | basic list only |
| Talent Passport: username URL, privacy tiers, evidence classes, resume export | Talent Card exists, no tiers/export |
| Recruiter: interviews, offers, Hired, team members, analytics | pipeline only |
| Challenge-to-Hire engine | challenges are listings only; no submissions/rubrics |
| Assessment workspace | none |
| Community | none |
| College: departments, drives, invites, reports | roster only |
| AI copilot (explainable) | none |
| Plans/monetisation | none |
| Launch quality: a11y audit, security checklist, ops docs | partial |

## Phases
| # | Branch | Scope | Status |
| --- | --- | --- | --- |
| 4 | claude/p04-marketplace | Search/filter/sort/pagination (role, skills, type, location, mode, pay, paid/unpaid, employer, deadline, grad year); more opportunity types (graduate trainee, apprenticeship, campus, freelance); expired/closed handling; resume choice on apply; duplicate prevention test (DB unique) | **DONE** (PR stacked on p04-roadmap). Moved: resume choice on apply -> phase 5 (needs resume export); experience-level filter needs a schema field, deferred to phase 6. Skills/grad-year filters match in memory over <=500 candidates |
| 5 | claude/p05-passport | Unique username URLs `/talent/[username]`; per-section privacy (public / recruiters / private); evidence classes (self-declared, platform-assessed, verified credential, external certificate) shown distinctly; certifications; printable resume/PDF export | **DONE** (PR stacked on p04-marketplace). Resume = print-to-PDF view (no server PDF dependency). Default visibility stays PUBLIC to keep existing shared links working; contact details never appear |
| 6 | claude/p06-hiring | Stages Applied, Under review, Shortlisted, Interview, Offer, Hired (+custom labels); interviews (schedule, .ics, notify); offers; recruiter team members/invites; hiring analytics from real data; `/recruiter/*` route aliases | **DONE** (stacked on p05). Also added aliases for `/college/*`, `/admin/*`, `/jobs`, `/internships`, `/register` etc. Team members are equal-power (no owner role yet). Experience-level filter still deferred |
| 7 | claude/p07-challenges | Challenge model (type, eligibility, deadline, rubric, team/solo, collaborative or competitive); submissions (link/file/repo); human review with rubric scores + feedback; shortlist + interview invite; verified result onto Passport; discovery pages | **DONE** (stacked on p06). Submissions are links only (no file upload yet); teams are a self-declared note, not linked accounts; all scoring is human. Auto-evaluation arrives with phase 8 |
| 8 | claude/p08-assessments | Assessment workspace UI (editor, languages, sample/hidden tests, history) behind an **execution adapter** (Judge0-compatible, env `SANDBOX_URL`; disabled with clear message when unset; never runs code locally); written assessments scored by a human | **DONE** (stacked on p07). Coding is OFF until `SANDBOX_URL` points at an isolated Judge0-compatible service (e.g. self-hosted Judge0 on a separate VPS, network disabled). `e2e/mock-sandbox.mjs` is a test double that runs JS locally: tests only. Untested against a real Judge0 |
| 9 | claude/p09-community | Groups (college/interest), posts, comments, teammate discovery, events, report/block, moderation via reports page + group mods, contributions to Passport | **DONE** (stacked on p08), except: community contributions do not feed the Passport automatically (no defensible way to verify them yet; members can add self-declared Achievement entries). Events are posts with a date (no RSVP/calendar). No direct messaging between members (by design, to limit harassment) |
| 10 | claude/p10-college | Departments, placement drives, eligibility + invitations, company connections, placement tracking, privacy-safe CSV reports, `/college/*` aliases | **DONE** (stacked on p09). Company 'connection' = a confirmed drive (no separate connection object). Placement outcomes are recorded per drive by the company; offers made via the hiring pipeline are not auto-linked to drives |
| 11 | claude/p11-copilot | Explainable matching (rule-based, shows matched/missing skills, recruiter review, no auto-reject); resume feedback; JD alignment; optional LLM via `AI_API_KEY` for interview prep/summaries, consent-gated, advisory labels | **DONE as deterministic, explainable logic (no LLM).** Built: explainable matching, listing alignment, profile review, practice prompts, natural-language search (keyword parser), recruiter match notes, JD checker. NOT built: LLM features (mock interviews, resume rewriting, candidate summaries): need a provider decision and consent flow; `AI_API_KEY` is intentionally unused. Also fixed: private/suspended profiles leaked into recruiter talent search |
| 12 | claude/p12-plans | Employer plans/limits (feature flags, no payment provider until owner chooses one), advanced analytics | **DONE** (stacked on p11). Plans are assigned by an admin; NO online payments, invoices or tax handling (needs your provider decision). Limits enforced server-side. Prices on /employers are still placeholders |
| 13 | claude/p13-launch | WCAG 2.2 AA audit + fixes, security checklist doc, access-control test matrix, backups/recovery + ops runbook, PRD/API/DB docs, final e2e + quality report | **DONE** (stacked on p12). Added `test:a11y`, `test:access`, `test:unit`, backup script, generated DB/API docs, PRD, SECURITY, OPERATIONS, QUALITY. Manual accessibility/keyboard review, Lighthouse re-run and real-service tests are still open (see QUALITY.md) |

## Owner decisions still needed (does not block autopilot)
- Font name from os.nexpreneur.com; official logo file (PR #5).
- Live DB `auth_failed` fix (needs `[startup]` log line); rotate leaked secrets.
- Payment provider, SMS provider, sandbox host, LLM provider (phases 8, 11, 12 ship adapters that are off until configured).

## Addendum: optional password login
Email + password login added next to email codes (scrypt, rate limited, reset via a fresh email-code session). Registration still verifies the email with a code. Not built: 2FA, breached-password check.

## Addendum: free job distribution (inspired by PyjamaHR-style ATS tools)
Public company career page (`/careers/<slug>`), an embeddable widget (`/embed/careers/<slug>`, the only route that may be framed), open job feeds (`/feeds/jobs.xml`, `/feeds/jobs.json`), richer `JobPosting` structured data (Google for Jobs), sitemap entries, a per-listing share kit (copy link/post text, LinkedIn, WhatsApp, X, email, QR) and source plus referral tracking shown in the pipeline and analytics. Not built: automatic posting to LinkedIn, Indeed or other boards (each needs a partner agreement or approved feed). Next: screening questions, interview scorecards, message templates, stage history reports.

## Addendum: email via Hostinger SMTP
Transactional email now goes over SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`) using a Hostinger mailbox. The Resend integration was removed.

## Addendum: ATS batch 2
Screening questions (up to 5 per listing, answered when applying, read by people only, never scored or used to filter), interviewer scorecards (rating 1 to 5 plus recommendation, private to the hiring team, never moves a candidate by itself), reusable message templates, stage history with time in stage and time to hire, and a printable offer letter. Not built: automatic scoring or rejection of any kind, bulk actions, tags, e-signature.

## Addendum: real content from KodeZ by Robokalam
The public site no longer shows placeholders. Homepage trust strip, impact figures, alumni voices, awards, mentor community, About, Press, Help, Contact and employer pricing text now use facts published at kodez.robokalam.in (`src/data/robokalam.ts`, with the source cited on each page). Live opportunities, mentors and the challenge spotlight come from the database and show an honest empty state when there is nothing to show. `src/data/sample.ts` is now seed-only, modelled on the KodeZ tracks and never rendered on the live site. Still needed from the owner: confirmed placement and internship totals, written consent for named alumni quotes and mentors, partner college and company names with permission, real employer prices, logos and photos.

## Addendum: bulk actions and tags
On the pipeline, recruiters can tick candidates and move them to Under review, Shortlisted or Rejected (reject asks for confirmation), or add and remove private tags, up to 50 at a time. Candidates in Offer, Hired or withdrawn are skipped so those steps stay one-at-a-time. Tags are private team notes (max 10 per candidate), filterable on the pipeline, never shown to candidates and never used to score or filter automatically. Not built: saved filters, tag colours, tag-based automation.

## Addendum: app-first corporate redesign
The app no longer has a landing page: kalwings.com is the marketing site, and app.kalwings.com opens at sign-in, then the role's workspace. Marketing pages (students, employers, colleges, about, press) were removed and forward to kalwings.com. New flat navy and blue-lavender theme (no gradients), Inter, dark by default with light mode in Settings > Appearance. Overlapping screens were merged into tabs and every feature is listed once in `src/lib/modules.ts` (sidebar, tabs and the workspace grid). See `docs/FEATURES.md`. Still to do: apply the exact wording from kalwings.com, and the official logo.

## Addendum: premium look
Second design pass (the first one wrongly changed the logo; the original purple-to-green logo is back). Two typefaces, warm dark palette with an orange accent and sticker colours, pill controls, icon sidebar, kanban-style pipeline columns, colour initials tiles for people without photos, and company logo upload (`Company.logoId`, `COMPANY_LOGO` upload kind). No functionality changed. See `docs/FEATURES.md`.
