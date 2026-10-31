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
| Student | Profile | Details, projects, public profile, resume and selfie video (one tab bar) |
| Student | Grow | Career copilot, mentor sessions, community |
| Employer | Company | Verification, team, plan limits, career page and embed, message templates, stage names |
| Employer | Hiring | Roles, challenges, assessments, description check (one tab bar) |
| Employer | Candidates | Talent search, pipeline (with interviews tab), analytics |
| Employer | Campus | Drives with partner colleges |
| Mentor | Mentoring | Profile, availability, session requests, community |
| College | Placements | Departments, shared student progress, drives, reports |
| Platform admin | Reviews | Listing moderation, profile verification, abuse reports |
| Platform admin | Directory | Companies (add, verify, plan, logo, HR, post listings), colleges, mentors (full details), users (add, change role, suspend), bulk upload of students, companies and mentors from Excel or CSV |
| Platform admin | Platform | Employer plans (rename, price, limits, add), site settings (banner, support email, who can sign up), insights, contact inbox |
| Platform admin | Operations | Audit log, server errors |

Any signed-in user can ask for a different role under Settings > Change my role. Nothing changes until a platform admin approves it from Users. Role changes keep the account and all its data; no user is ever deleted by an admin action.

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

## Hiring flow (resume, selfie video, sharing, local jobs)

- **Resume:** PDF, DOC, DOCX or RTF up to 2 MB, checked by content (macros, scripts and embedded objects are refused), private, attached to an application by choice, deletable everywhere. The employer downloads it from the pipeline card.
- **Selfie introduction:** up to 60 seconds recorded in the browser; only at a 100% profile score; shared per application by an un-ticked choice; the employer watches it on the pipeline card; deleting it removes it from every company.
- **Sharing:** every listing and challenge has a short link (`/j/<code>`) and a share panel (WhatsApp, Telegram, LinkedIn, X, email, phone share sheet, copy) whose message carries pay, place, eligibility and deadline. Links are tagged by channel and carry a referral for signed-in students; employers see the source on each applicant and in analytics.
- **Friend flow:** a shared link opens the listing without an account; "Log in to apply" and "Create a free account" return to the same listing after the email code (and after the 3-step profile for new students).
- **Local jobs:** `/jobs-in` and `/jobs-in/<city>` list the cities with open roles right now; city chips on the opportunities page.
- See `docs/JOURNEYS.md` for the full aspirant and employer journeys and how this compares with Apna, Job Hai and Naukri.

## Engage and install (events, alerts, calendar)

Chosen from the comparison in `docs/PRODUCT-RESEARCH.md`.
- **Events** (`/events`): webinars, workshops, hackathons, meetups and campus events posted by verified employers, verified colleges, verified mentors and admins; live at once; time, place and price always shown; RSVP for any signed-in person; the joining link is shown only after RSVP; calendar links (`.ics` and Google); short share link `/e/<code>`; report button; organisers can cancel (RSVPed people are told); admins can hide. Poster page: Dashboard > Events.
- **Job alerts** (`/dashboard/alerts`): save a search (keyword, city, type, mode), or save the one you are looking at on the Opportunities page. When a matching listing is approved or posted by an admin, the student gets an in-app notification and, if notification emails are on, an email (one-click unsubscribe, capped per hour).
- **Calendar** (`/calendar`): deadlines and events for the next 60 days. Listing pages offer the deadline as a calendar reminder and a map link for on-site and hybrid roles; listing pages and the career copilot link free learning sources for the skills they mention.
- **Sharing impact** (`/dashboard/referrals`): how many friends applied through your links (counts only).
- **Free helpers**: one-click free video room (Jitsi) when scheduling an interview; public GitHub activity line on the Talent Card (labelled public and unverified); "Add to LinkedIn" for evidence-backed skills.
- **Install as an app**: Install button in Settings and the footer (Android and desktop), iPhone steps, manifest id, shortcuts and a maskable icon.

## Later list, built (push, practice tests, PIN lookup, languages)

- **Push notifications** (Settings > Notifications on this device): opt-in per device. Every in-app notification (new matches, replies, interview updates, plan changes) is also pushed to devices the person turned on; tapping opens the right page. Free, no account with a push vendor. The server makes its own signing keys the first time they are needed and keeps them in site settings (or reads `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` if you set them). Up to 5 devices per person, 20 pushes an hour, dead devices are removed automatically.
- **Practice tests** (`/dashboard/practice`, students): four short multiple-choice tests (Python, SQL, JavaScript, aptitude), graded on the server with the reason for every answer. Scores are private, retakes are free, and there are no certificates, no streaks that punish, no leaderboards, and employers never see them.
- **PIN code search** (`/jobs-in`): type a PIN, see the district and whether anything is open there. The lookup uses India Post's free public service from our server only (4 second timeout, cached a day, 30 lookups an hour per visitor); if it is down the page says so and the city list still works.
- **Languages, beta**: Hindi and Telugu for the menu, footer and the language picker (footer and Settings). Everything else stays English and the picker says so. The choice is a plain cookie, so pages stay cacheable. Translations should be checked by a native speaker before you promote this.

No feature was removed because it overlapped; overlapping screens were merged into tabs so each job has one place.

## Look and feel

- **Two typefaces only.** Plus Jakarta Sans for everything, and Instrument Serif italic for one emphasised word in a heading ("Hire on *proof*", "Builders helping *builders*"). The Kalwings wordmark uses its own bold capitals as part of the logo artwork. The code editor in assessments keeps the browser's monospace font because code needs it.
- **Colour.** Warm near-black and warm white, one hot orange for actions, and soft lilac, sun and mint "sticker" colours (always with dark text) for highlights, stat tiles and icon tiles. Light mode uses warm paper with white cards. Dark is the default; light is in Settings > Appearance.
- **Shape.** Pill buttons, 20px cards, rounded inputs with an orange focus ring, segmented-pill tabs, icon sidebar with an orange active pill.
- **Logo.** The K mark and the ALWINGS lockup keep the purple-to-green artwork. They are redrawn in code from the supplied image (the original file was not available); drop the original into `public/brand/` and swap `src/components/ui/brand.tsx` to use it exactly.
- **Company logos.** Employers upload a logo under Company. It shows on listing cards, the listing page, challenge pages, the career page and in candidates' applications. Until then a coloured monogram tile is shown.

## Still to do

- Use the exact product wording from kalwings.com. The names in `src/lib/modules.ts` are plain placeholders for it, and a few older page headings still use earlier names ("Talent Passport", "Talent Card").
- Use the original logo file instead of the code redraw.
