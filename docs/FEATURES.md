# Features, overlaps and how the app is organised

This is the single map of what the app does, who it is for, and where two features looked alike and were merged. The sidebar, the section tabs and the dashboard "Everything in your workspace" grid are all generated from `src/lib/modules.ts`, so this list cannot drift from the product.

The marketing site is kalwings.com. This app starts at sign-in, then opens the workspace for the person's role.

## One pain point

Freshers cannot show what they can do, and employers cannot see it. Everything below serves that one problem: real work as proof, a fair way to look at it, and a clear path from looking to hiring.

## What each role can do

| Role | Area | What it is |
|---|---|---|
| Student | Find work | Opportunities, challenges, campus drives, saved roles |
| Student | Applications | Applications, interviews, challenge submissions, assessments (one tab bar) |
| Student | Profile | Details, projects, public profile (one tab bar) |
| Student | Grow | Career copilot, mentor sessions, community |
| Employer | Company | Verification, team, plan limits, career page and embed, message templates, stage names |
| Employer | Hiring | Roles, challenges, assessments, description check (one tab bar) |
| Employer | Candidates | Talent search, pipeline (with interviews tab), analytics |
| Employer | Campus | Drives with partner colleges |
| Mentor | Mentoring | Profile, availability, session requests, community |
| College | Placements | Departments, shared student progress, drives, reports |
| Platform admin | Reviews | Listing moderation, profile verification, employer plans, abuse reports |
| Platform admin | Platform | Insights, users, contact inbox |
| Platform admin | Operations | Audit log, server errors |

## Overlaps found, and what was done

| Looked like | Reality | Decision |
|---|---|---|
| Profile, Portfolio, "Talent Passport" (three student pages) | One person's profile in three screens | One **Profile** area with tabs: Details, Projects, Public profile |
| Applications, Interviews, Challenge submissions, Assessments (four student pages) | Four lists of "things I took part in" | One **Applications** area with four tabs |
| Roles, Challenges, Assessments, Description check (four employer pages) | Four ways to describe and publish work | One **Roles** area with four tabs. The description check is a helper for roles, not a product |
| Pipeline and Interviews (employer) | Interviews are scheduled from a candidate card and listed on a calendar-style page | Kept both; the Interviews tab sits next to the pipeline |
| Reports and Insights (admin) | "Reports" is abuse reports, not analytics | Renamed **Abuse reports** and moved under Reviews so it is not confused with Insights |
| Employer analytics, platform insights, college reports | Different audiences and different data | Kept separate; each has one home |
| Challenges and assessments | A challenge is open to everyone and scored by a person against a rubric; an assessment is assigned to a candidate (timed, optionally run in a code sandbox) | Both kept, because the hiring step differs. They are tabs of the same area |
| Saved roles (student) and shortlist (employer) | Same verb, opposite sides of the market | Kept |
| Career copilot (student) and match notes in talent search (employer) | Same matching engine, shown to different people | One engine, two views; no duplicate logic |
| Several public pages that described the product (for students, employers, colleges, about, press) | Marketing, which kalwings.com already does | Removed from the app. Old links forward to kalwings.com |
| Light/dark toggle in the header | A setting, not navigation | Dark by default; the choice is in Settings > Appearance |

No feature was removed because it overlapped; overlapping screens were merged into tabs so each job has one place.

## Look and feel

- Flat surfaces, thin borders, no gradients, no animation on scroll, no marketing sections.
- One typeface (Inter), two weights in headings, small corner radius.
- Colour comes from the blue-lavender of the Kalwings mark on a deep navy. Light mode uses the same blue on white.
- Every feature has one plain name. Page names are descriptive (Opportunities, Applications, Profile, Pipeline), with no invented product names.

## Still to do

- Use the exact product wording from kalwings.com. The names in `src/lib/modules.ts` are plain placeholders for it, and a few older page headings still use earlier names ("Talent Passport", "Talent Card").
- Replace the redrawn logo mark with the official artwork (`src/components/ui/brand.tsx`, `public/brand/`).
