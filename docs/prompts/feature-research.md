# Prompt: what should Kalwings add next?

Reusable. Paste it to an assistant (or run it yourself) each time you plan a release. It forces a comparison against real platforms, a check against what already exists, and a decision for every idea, so nothing is added just because a competitor has it.

---

**Context.** Kalwings (app.kalwings.com) is a fresher career platform for India: verified listings with pay, mode, location and eligibility always shown; real-work challenges scored by people; a Talent Passport with evidence-backed skills; mentors; community; campus drives; employer pipeline; resume and selfie-video attachments; shareable short links; city pages; an admin console. Rules that never bend: no invented numbers, student contact stays private, no guaranteed jobs, scores are advice, nobody is auto-rejected, only verified employers publish.

**Task.**
1. **Inventory.** Read `docs/FEATURES.md` and `docs/JOURNEYS.md` and list what already exists, by role.
2. **Compare.** For each of these platforms, find what they offer students and employers from their own pages and from independent press, and mark what is marketing and what is confirmed: Unstop; Student Tribe; Beep (EventBeep); GradConnection / SEEK Grad; Apna; Job Hai; Naukri. (If a named platform cannot be found, say so and use the closest match instead of guessing.)
3. **Gap table.** One row per idea: *idea | seen in | already in Kalwings? | fits our rules? | effort (S/M/L) | value to a student | value to an employer | decision (build now / later / never) and why*.
4. **Free and open building blocks.** List free or open APIs and standards that would improve the experience without a paid key or a new vendor (calendar links, video meetings, public developer data, map links, install-as-app, push, open badges, PIN-code lookup, university lists, skills taxonomies). For each: what it gives, limits, privacy impact, whether it works under our Content-Security-Policy, and what happens when it is down. Prefer links and server-side calls with caching and a graceful fallback.
5. **Install-as-app.** State what is needed for a good installable web app (manifest, service worker rules, install prompt on Android and desktop, instructions on iOS, offline page, shortcuts, notifications) and what is missing today.
6. **Plan.** Choose a coherent set for one release. For each chosen feature give: user story, screens, data model changes (additive migrations only), permissions, trust-rule check, tests, docs.
7. **Risks.** What could embarrass us: scraping and consent, spam, storage cost, external API outages, accessibility, privacy.

**Output.** A research note (sources linked), the gap table, the release plan, and a prioritised "later" list.

---

# Prompt: build the chosen plan

> Implement the release plan from the research note in one pull request. Keep the existing look; reuse existing components. Server-side authorisation on every action; zod validation; audit sensitive changes; additive migrations only (regenerate `migrations.generated.ts`); every new page in the access matrix and the accessibility audit; new end-to-end checks for each feature; update `docs/FEATURES.md`, `docs/JOURNEYS.md`, `docs/OPERATIONS.md`, `docs/SECURITY.md`; regenerate `docs/DATABASE.md` and `docs/API.md`. No external call may run in the browser (CSP is `connect-src 'self'`): call outside services from the server, with a timeout, a cache and a fallback. Run lint, typecheck, unit, build, e2e, access and accessibility suites before pushing. Open the PR, wait for green CI on MySQL 8 and MariaDB 10.11, then merge.
