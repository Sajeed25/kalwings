# Product research: what to add next

Done by running the prompt in `docs/prompts/feature-research.md`. Competitor facts come from the platforms' own pages and press and are marked as marketing where they are; nothing here is a verified feature audit.

## What Kalwings already has (short)
Verified listings with pay, mode, location, eligibility; challenges scored by people; assessments; Talent Passport with evidence-backed skills; mentors and sessions; community groups; campus drives and college reports; employer pipeline with interviews, offers, notes, tags, bulk actions; resume and 60-second selfie video attached by choice; short share links with WhatsApp and referral tracking; return-to-listing sign-in; city pages; career copilot; admin console with plans, site settings, bulk upload, launch readiness. Details: `docs/FEATURES.md`, `docs/JOURNEYS.md`.

## What the platforms offer
| Platform | What we found (source type) |
|---|---|
| **Unstop** | Hackathons, case competitions, quizzes and college festivals; internships, jobs and hiring challenges; MCQ mock tests, interview prep and mock interviews; learning programs; one-to-one mentorship; personalised matching and one-tap apply. Free for students and colleges, paid courses and mentorships. (press release, Inc42, review sites; some promotional) |
| **Student Tribe** | Community for students from tier-2 and tier-3 colleges: internships, an events section for finding and organising affordable student events, career development, brand community marketing, flexible earning. (press, CXO Today; promotional) |
| **Beep (EventBeep)** | Events from partner colleges and organisers, students can host events, peer learning, daily quizzes, student rewards, a verified record of events hosted, internships completed, skills used and teams led; focus on tier-2 and tier-3. (app store listing, company blog; self-reported) |
| **"Grad Partners"** | No product by that name was found. Closest matches: **GradConnection / SEEK Grad** (job search, graduate profiles employers can invite, email job alerts) and **GradLeaders** (university career centres). We used GradConnection as the reference. |
| **Apna / Job Hai / Naukri** | See `docs/JOURNEYS.md`: one-tap apply, jobs by city, chat with employers, resume upload, audio or video intro. |

## Gap table
| Idea | Seen in | Already here? | Fits our rules? | Effort | Decision |
|---|---|---|---|---|---|
| **Events and webinars** posted by verified colleges, employers, mentors, admins; RSVP; add to calendar | Unstop, Student Tribe, Beep | No (community groups only) | Yes: posters are verified; free to attend; no rewards | M | **Build now** |
| **Job alerts** from saved searches | GradConnection, Apna, Naukri | No | Yes: opt-in, email respects unsubscribe | M | **Build now** |
| **Install as an app** | all | Partly (manifest, safe service worker, offline page) | Yes | S | **Build now**: install button, iOS steps, shortcuts |
| **Calendar of deadlines and events**, add to Google or any calendar | Unstop | Interview .ics only | Yes | S | **Build now** |
| **Referral impact** (what happens when you share) | Student Tribe ambassadors | Referral tracked, not shown to the student | Yes if counts only, no payouts | S | **Build now** |
| **Free learning links** for skill gaps | Unstop courses | Gaps shown, no resources | Yes: curated free sources only | S | **Build now** |
| **Video meeting link** for interviews | Unstop, Apna | Interview takes a link by hand | Yes | S | **Build now**: one-click Jitsi room |
| **Map link** for on-site roles | Apna, Job Hai | No | Yes | S | **Build now** |
| **Public GitHub activity** on the Talent Card, labelled unverified | Beep (verified record), Unstop profiles | GitHub URL only | Yes if labelled as public, self-declared data | S | **Build now**, cached, graceful |
| **Add verified skill to LinkedIn** | Beep, Unstop certificates | No | Yes | S | **Build now** |
| Web push notifications | Apna, Unstop app | Email and in-app only | Yes | M | Later: needs push keys, then reuse alerts |
| Mock tests, daily quizzes, streaks, rewards | Unstop, Beep | Assessments and practice prompts | Rewards and ranking risk "scores are advice" | L | Later, no leaderboards |
| Leaderboards, coins | Unstop, Beep | No | **Conflicts** with no-ranking rule | n/a | Never as a ranking |
| Courses sold on platform | Unstop | No | Needs payments | L | Later |
| Regional languages | Job Hai | No | Yes | L | Later |
| Call HR | Apna | No | **Conflicts** with private contact | n/a | Never; messages instead |
| Jobs scraped or fed from other sites | many aggregators | No | **Conflicts**: unverified pay and employer | n/a | Never as normal listings |

## Free and open building blocks
| Block | What it gives | Limits and privacy | Decision |
|---|---|---|---|
| Web App Manifest + `beforeinstallprompt` | Install on Android and desktop Chrome and Edge | iOS needs "Add to Home Screen" instructions | Built |
| Jitsi Meet (`meet.jit.si/<room>`) | Free video rooms, no key, open source | Public room name: use an unguessable one | Built (link generation only) |
| Google Calendar "template" URL, `.ics` files | Add to any calendar | No key; no data sent to us | Built |
| Google Maps search URL | "View on map" | A link; no key; sends location text to Google only on click | Built |
| GitHub REST API (public, unauthenticated) | Public repo count and languages | About 60 requests an hour per IP: cache, degrade | Built (server side, cached) |
| LinkedIn "add to profile" URL | One-click add of a certification | A link the student opens | Built |
| Web Push (VAPID) | Phone notifications for installed app | Needs keys and a sending library | Later |
| India Post PIN lookup (community APIs) | PIN to city | Reliability unknown | Later, optional |
| Hipolabs universities list | Seed college names | Unverified; admin must verify anyway | Later |
| ESCO / O*NET skills taxonomies | Skill autocomplete | Large; not needed yet | Later |
| Open Badges 3.0 | Portable verifiable skills | Needs signing keys | Later |
| Remote job APIs (Remotive, Arbeitnow) | Extra listings | Unverified employers and pay | Not as normal listings |

APIs marked "Later" or "Not" were not tested; check their current terms before using them.

## The release plan ("Engage and Install")
1. Installable app: install button, iOS instructions, manifest id, shortcuts, categories.
2. Events: post, RSVP, calendar, share, report; `/events`.
3. Job alerts: save a search, get an in-app and email alert when a matching listing goes live; manage in Settings.
4. Calendar: closing soon and upcoming events; add to Google calendar or download `.ics`.
5. Referral impact: how many friends opened and applied through your links.
6. Learning links and map links on listings; Jitsi interview rooms; GitHub public signal; LinkedIn add.

## Later
Web push on installed apps; mock tests and practice streaks without rankings; regional languages; PIN lookup; college list seeding; open badges.
