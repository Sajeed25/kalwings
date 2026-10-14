# KALWINGS product requirements (as built)

Tagline: **Your potential deserves to be seen.** Application: app.kalwings.com. The public marketing site (kalwings.com) is a separate property and is not modified by this codebase.

## Goal
Help freshers show real evidence of ability, find relevant opportunities, and reach employers, with outcomes (credible profiles, matched opportunities, trustworthy employers, hires) valued over feature count or engagement.

## Users and what each can do
| User | Capabilities (all enforced on the server) |
| --- | --- |
| **Student** | Onboarding and profile, Talent Passport (username URL, per-section privacy, evidence labels, resume view), portfolio, discover and apply to roles, challenges and assessments, interviews and offers, campus drives, career copilot, community, mentor sessions |
| **Recruiter** | Verified company, listings, challenges with rubrics, assessments (written; coding with a sandbox), talent search with match notes, pipeline (Applied → Under review → Shortlisted → Interview → Offer → Hired), interviews, offers, team, analytics, campus drives |
| **College coordinator** | Verified college, departments, consent-based student roster, placement drives with companies, outcomes, privacy-safe CSV reports |
| **Mentor** | Verified profile, office hours, sessions, evidence-linked endorsements, community |
| **Platform admin** | Verification queues (companies, colleges, mentors, Passport entries), listing moderation, reports and community moderation, users (suspend), plans, insights, audit log, server errors |

## Principles (never relaxed)
1. **Evidence over claims**: self-declared, external certificate and verified are always labelled differently; only an admin action can mark something verified.
2. **Trust rules**: pay, work mode, location and eligibility are mandatory and shown; unpaid is labelled; sponsored is never styled as verified; no guaranteed-job language.
3. **Privacy by default**: contact details never appear on Passports, rosters or reports; every sharing step (college roster, drive participation, Passport sections) is opt-in and reversible.
4. **No opaque automation of people decisions**: matching explains itself, is advisory, and never hides or rejects a candidate; assessment scores are one signal.
5. **Untrusted code never runs on the app server.**

## Capability status
See `docs/ROADMAP.md` for the phase table and `docs/QUALITY.md` for what is tested and what is not.

## Out of scope today (needs owner decisions)
SMS/mobile sign-in, online payments and invoicing, LLM-based features (mock interviews, summaries), file uploads for submissions, a real code-execution sandbox deployment, push/email digests beyond the transactional emails.

## Route map
Product routes from the brief are served by the role dashboards under `/dashboard/*`. Friendly aliases redirect there: `/recruiter/*`, `/college/*`, `/admin/*`, `/jobs`, `/internships`, `/profile`, `/portfolio`, `/applications`, `/messages`, `/notifications`, `/settings`, `/assessments`, `/register`, `/forgot-password`, `/verify`. Public pages: `/`, `/opportunities`, `/challenges`, `/community`, `/mentors`, `/employers`, `/talent/<username>`.
