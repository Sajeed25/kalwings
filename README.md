# Kalwings — public website & platform

> Your potential deserves to be seen.

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma + MySQL/MariaDB · Radix Slot + CVA (shadcn-style components). Animations are CSS + one tiny IntersectionObserver (Framer Motion was removed: it cost ~25 Lighthouse points on mobile).

## Status

| Area | State |
| --- | --- |
| Public website and design system (black + neon, dark by default) | Built |
| Auth (email codes, optional password login, Google if configured), roles, onboarding, profile score | Built |
| Marketplace: server-side search, filters, sort, pagination, 7 listing types | Built |
| Talent Passport: username URL, privacy tiers, evidence labels, admin verification, resume view | Built |
| Hiring workspace: pipeline to Hired, interviews, offers, team, stage names, analytics | Built |
| Challenge-to-Hire: rubrics, submissions, human review, shortlisting, evidence-backed skills | Built |
| Assessments: written (human scored) and coding (needs an isolated sandbox you provide) | Built; coding untested against real Judge0 |
| Community: groups, posts, teammates, reports, blocking, moderation | Built |
| College portal: departments, placement drives, consent-based invites, CSV reports | Built |
| Career copilot: explainable matching, profile review, practice prompts, natural-language search, JD check | Built (deterministic, no LLM) |
| Employer plans with enforced limits, admin plans, insights | Built (no online payments) |
| Quality: unit, end-to-end, access-matrix and accessibility tests, docs, backup script | Built, see `docs/QUALITY.md` |

Roadmap and per-phase notes: `docs/ROADMAP.md`. Product requirements: `docs/PRD.md`. Data model: `docs/DATABASE.md` (generated). HTTP and server actions: `docs/API.md` (generated). Security checklist: `docs/SECURITY.md`. Operations, backups and recovery: `docs/OPERATIONS.md`. Test evidence and known gaps: `docs/QUALITY.md`.

### Not built (needs your decisions)
SMS/mobile sign-in; online payments and invoicing; LLM features (mock interviews, summaries); file uploads for challenge submissions; a deployed code-execution sandbox; Sentry/analytics; real content and legal text. Google sign-in is implemented but untested.

## Setup

```bash
cd kalwings
# needs a local MySQL/MariaDB, e.g.:  docker run -d -p 3306:3306 -e MARIADB_ROOT_PASSWORD=root -e MARIADB_DATABASE=kalwings mariadb:10.11
#   then DATABASE_URL=mysql://root:root@localhost:3306/kalwings
npm install                      # also runs `prisma generate`
cp .env.example .env             # set DATABASE_URL and AUTH_SECRET (32+ chars)
npx prisma migrate dev           # creates tables (MySQL 8 / MariaDB 10.6+)
npm run db:seed                  # SAMPLE mentors, companies, listings, admin + student
npm run dev                      # http://localhost:3000
```

Sample logins (dev only; OTP appears on screen): `admin@sample.kalwings.test`, `college@sample.kalwings.test`, `student@sample.kalwings.test`, `sample-mentor-1@sample.kalwings.test`, `sample-co-a@sample.kalwings.test`. These addresses can't receive mail, so they are inert in production, but run `npm run db:unseed` before launch anyway.

Create a real admin: put your email in `ADMIN_EMAILS` and sign in, or sign in once and run `npm run make-admin -- you@example.com`.

Tests: `npm run test:unit` (pure logic), `npm run test:access` (role × page/API matrix) and `npm run test:a11y` (axe + phone layout; both need the dev server and seed), `npm run test:e2e:prod` smoke-tests a production build (CSP, PWA/offline, OG, contact form; see the header of `e2e/production.mjs`). `node e2e/degraded.mjs` checks the site against an unreachable database (see its header). With the dev server running and the seed loaded, `npm run test:e2e` drives student/mentor/employer/admin through the real UI (~55 checks incl. permission, trust-rule, slot-booking, college-consent and upload-security checks). Set `E2E_BASE_URL` and `CHROMIUM_PATH` if needed.

Node 20+.

**Deploying (GitHub → Hostinger, automatic):** see [DEPLOYMENT.md](DEPLOYMENT.md). CI lives in `.github/workflows/ci.yml`.

## Where to replace placeholders

| What | Where |
| --- | --- |
| Impact numbers (`[X]+`) | `impact` in `src/data/sample.ts`: set `value` to a real number and it counts up. Never publish estimates. |
| Mentors, opportunities, challenge, stories, community groups | `src/data/sample.ts` |
| Ecosystem / partner / hiring-company logos | `src/components/home/trust-impact.tsx` (text wordmarks for now; use official greyscale SVGs, with permission) |
| Photos on the homepage (events, success stories, founder) | Every `<PhotoPlaceholder />` in `src/components/home/` (grep for it). Put images in `public/images/` and use `next/image` with real alt text. Mentor and student photos are uploaded by the people themselves in their dashboards. |
| Awards & press | `Recognition` in `src/components/home/rest.tsx`: real, linkable entries only |
| Founder note | `Team` in `src/components/home/rest.tsx` (draft wording for Mohammed Sajeed Khan to edit) |
| Pricing | `tiers` in `src/app/employers/page.tsx` |
| Social links | `social` in `src/components/footer.tsx` |
| Legal text | `src/app/{privacy,terms,trust}/page.tsx`. **Have a lawyer review.** |
| Site URL / metadata | `NEXT_PUBLIC_SITE_URL`, `src/lib/site.ts`, `src/app/layout.tsx` |

Sample detail pages (`/mentors/[slug]`, `/opportunities/[id]`) are `noindex` and left out of the sitemap until real data replaces them.

## Design system

- Tokens: `tailwind.config.ts` and CSS variables in `src/app/globals.css` (dark by default, light via the navbar toggle). Palette from the logo: black, neon green `#10F27D`, violet `#7C2FF6`. Flat bordered cards, no shadows/glows/gradient text.
- Components: `src/components/ui/` — `Button`, `Badge` / `SampleTag` / `PhotoPlaceholder`, `Reveal`, `CountUp`, `Marquee`, `Logo` / `LogoMark` / `Divider`.
- Accessibility: the neon-green primary button uses **black text** (white on neon fails WCAG AA).
- Motion respects `prefers-reduced-motion` (CSS and Framer Motion).
- Brand font: one swap point in `src/app/layout.tsx` (`--font-brand`). **Montserrat is a placeholder**; swap to the os.nexpreneur.com font. The logo mark (`src/components/ui/brand.tsx`, `public/brand/`) is an approximate redraw: replace with the official artwork.
- Theme: navbar toggle, saved in `localStorage`, defaults to dark.

## Trust rules built into the UI

Pay, work mode, location and eligibility always shown · unpaid roles labelled · student contact private by default · no "guaranteed job" language · sponsored never styled as verified · no invented stats, awards, testimonials or logos.

## Next steps

1. SMS provider for mobile sign-in; verify Google sign-in against real credentials.
2. Sentry/analytics if wanted; certificates/PDF uploads would need external object storage.
3. Real legal copy, real content, `next/image` once photos exist; Lighthouse on real content.
