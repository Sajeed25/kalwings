# Kalwings — public website & platform

> Your potential deserves to be seen.

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma + MySQL/MariaDB · Radix Slot + CVA (shadcn-style components). Animations are CSS + one tiny IntersectionObserver (Framer Motion was removed: it cost ~25 Lighthouse points on mobile).

## Status

| Phase | Status |
| --- | --- |
| 1. Design system + full homepage (17 sections) | Built |
| 2. Public pages (Students, Employers + pricing, Colleges, Mentors, Opportunities, Challenges, Community, About, Press, Contact, Help, legal) | Built (legal/about copy is draft) |
| 3. MVP platform flows | **Built and tested end-to-end in dev** — see below for what is *not* done |

### Platform: what works

- **Auth:** email/mobile one-time codes (hashed, 10-min expiry, 5 attempts, rate-limited), signed httpOnly session cookie, roles `STUDENT / MENTOR / EMPLOYER / COLLEGE_ADMIN / PLATFORM_ADMIN`. Every server action calls `requireActionRole(...)`; every dashboard page calls `requirePageRole(...)`.
- **Student:** onboarding wizard, profile completeness score (visible checklist), portfolio (projects), public Talent Card at `/t/[slug]` with QR code (noindex, never shows email/phone), one-click apply, application tracker + withdraw, saved roles, mentor session requests, notifications, opt-in contact sharing.
- **Mentor:** profile (admin-verified before listing), office-hour slots that students book (atomic: a slot can't be double-booked; freed on decline/cancel), calendar `.ics` invite for accepted sessions, accept/decline/complete requests, endorsements (only for students with a *completed* session, and must link evidence — each becomes verified evidence on the Talent Card with an explanation on hover).
- **Employer:** company registration → admin verification gate (no posting/search before it), post roles/challenges (pay, work mode, location, eligibility mandatory; paid roles must state an amount; unpaid labelled), listings go live only after moderation, talent search (verified vs self-declared skills shown separately), shortlist, pipeline Applied → Shortlisted → Interview → Offer, private notes, per-application messaging.
- **College admin:** registers a college (admin-verified), then sees aggregate cohort stats and a roster of **only the students who opted in** (name, headline, progress — never contact details). Students pick a verified college and tick a consent box in Profile.
- **Admin:** company, mentor and college verification queues, listing moderation, fraud/abuse reports, analytics counts, audit log.
- Public `/opportunities` and `/mentors` read from the database (verified + moderated only). The homepage still uses `src/data/sample.ts` as a showcase.

### Also built

- **Notification emails** for applications, sessions and messages (needs `EMAIL_API_KEY`/`EMAIL_FROM`): capped at 10/hour/user, per-user opt-out in Notifications, and a signed one-click unsubscribe link in every email.
- **Database-backed rate limiting** (shared by all processes, survives restarts, atomic under concurrent requests; fails open if the DB errors).
- **Error logging + friendly error pages**, admin *Server errors* page.
- **Performance/accessibility:** Lighthouse (simulated mobile, production build, local): performance 91–99, accessibility 100, best practices 100 on all public pages; SEO 100 (login/join/Talent Cards are deliberately `noindex`, scoring 66). Real-world numbers on Hostinger will differ, so re-run Lighthouse after deploying.

- **Photos & screenshots:** students and mentors upload a profile photo; students add project screenshots (shown on the public Talent Card; mentor photos show in the directory and profile). Images are **stored in the database** (so they survive Hostinger redeploys), validated by magic bytes (PNG/JPEG/WebP only, never SVG), max 1 MB (the browser downscales first), role- and ownership-checked, rate-limited, CSRF-checked, and replaced/deleted images are removed. Include the database in your backups; expect roughly 100–300 KB per image.
- **Resilient when the database is down:** public pages still load, listings show a friendly notice, sign-in and the contact form give clear messages (contact falls back to email if configured), and `/api/health` reports the failure category.
- `db:unseed` removes only sample records (safe order, real users untouched).

### Platform: what is NOT done

- **Email sign-in codes work via Resend** (`EMAIL_API_KEY`, `EMAIL_FROM`; tested against a mock server, not live Resend). **Mobile/SMS sign-in is not available in production** (no SMS provider). In dev the code is shown on screen. Notifications are in-app only. First admin: set `ADMIN_EMAILS`.
- **Google sign-in is implemented but untested** (needs real `GOOGLE_CLIENT_ID/SECRET` and the callback URL `/api/auth/google/callback`).
- **Uploads are images only** (profile photos, mentor photos, project screenshots). Certificates/PDF/other file types are not supported.
- No third-party analytics or Sentry. Instead: unhandled server errors are stored (no personal data) and shown to admins at *Server errors*; add Sentry/analytics if you want alerts or traffic stats.
- Done and tested in production mode: Contact form (stored in DB, honeypot + rate limit, admin inbox, optional email), Open Graph/Twitter image, installable PWA (manifest, PNG icons, safe service worker with offline page — private pages are never cached), Content Security Policy + HSTS.
- Mentor sessions don't include video links; mentor and student agree the link in messages/email.
- Security notes: Next.js server actions enforce same-origin; the Google routes use a state cookie. Add a CSP and review before launch.

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

Tests: `npm run test:e2e:prod` smoke-tests a production build (CSP, PWA/offline, OG, contact form; see the header of `e2e/production.mjs`). `node e2e/degraded.mjs` checks the site against an unreachable database (see its header). With the dev server running and the seed loaded, `npm run test:e2e` drives student/mentor/employer/admin through the real UI (~55 checks incl. permission, trust-rule, slot-booking, college-consent and upload-security checks). Set `E2E_BASE_URL` and `CHROMIUM_PATH` if needed.

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

- Tokens: `tailwind.config.ts` (brand colours, radii, shadows) and CSS variables in `src/app/globals.css` (light/dark semantic colours).
- Components: `src/components/ui/` — `Button`, `Badge` / `SampleTag` / `PhotoPlaceholder`, `Reveal`, `CountUp`, `Marquee`, `Logo` / `WingMark` / `WingDivider`.
- Accessibility: white text on the teal→sky gradient fails WCAG AA, so primary buttons use **navy text** on the gradient. Teal as *text* on light backgrounds uses `teal-700` (`#0F766E`).
- Motion respects `prefers-reduced-motion` (CSS and Framer Motion).
- Dark mode: navbar toggle, saved in `localStorage`, defaults to the OS setting.

## Trust rules built into the UI

Pay, work mode, location and eligibility always shown · unpaid roles labelled · student contact private by default · no "guaranteed job" language · sponsored never styled as verified · no invented stats, awards, testimonials or logos.

## Next steps

1. SMS provider for mobile sign-in; verify Google sign-in against real credentials.
2. Sentry/analytics if wanted; certificates/PDF uploads would need external object storage.
3. Real legal copy, real content, `next/image` once photos exist; Lighthouse on real content.
