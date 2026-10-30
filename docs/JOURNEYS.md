# Journeys: the aspirant and the employer

How a fresher and a hiring team move through Kalwings, step by step, and which screen does each job. "New" marks what the hiring-flow release added.

## The aspirant (student, fresher, career-switcher)

| # | Step | What happens | Where |
|---|------|--------------|-------|
| 1 | **Hear about a role** | A friend, a college group or a recruiter shares a short link (`/j/ab12cd34`) on WhatsApp, Telegram, LinkedIn or email. The message already says the role, company, pay, place, eligibility and deadline. | New: short links, share panel |
| 2 | **Open it, no account needed** | The listing page shows pay, work mode, location, eligibility and deadline, a "how well do I match" link, and a share button. Nothing is hidden behind a sign-up. | `/opportunities/[id]` |
| 3 | **Sign in in a minute** | "Log in to apply" or "Create a free account". Email, a 6-digit code, no password. After the code, the person returns to the **same listing**, source and referrer kept. New students pass through a 3-step profile and then come back to the listing. | New: return-to-listing sign-in |
| 4 | **Build the profile** | Headline, bio, graduation year, city, skills, GitHub, projects; verified evidence comes only from mentors' endorsements or challenges reviewed by a person. The score is advice, never a ranking. | Profile |
| 5 | **Add a resume** | One upload, reused for every application. PDF, DOC, DOCX or RTF, up to 2 MB. Files with macros, scripts or embedded objects are refused. Private. | New: Resume & video |
| 6 | **Selfie introduction (at 100%)** | Up to 60 seconds, recorded in the browser (countdown, preview, retake). It unlocks only when the profile is 100% complete, which keeps storage for people who are serious and gives employers a whole picture. | New: Resume & video |
| 7 | **Apply** | A single form: screening questions if any, then "What this company receives": Talent Card (always), resume (ticked if on file), selfie video (a separate, un-ticked choice). | New: attach and share choices |
| 8 | **Track** | Applied, Under review, Shortlisted, Interview, Offer, Hired. The tracker says exactly what was sent. Messages, interviews and offers sit on the same card. | Application tracker |
| 9 | **Take a challenge** | Real tasks with a public rubric; a person scores the work against it; the awarded skill appears on the public profile with the reason. | Challenges |
| 10 | **Share it onward** | After applying, the same share panel invites the student to pass the role on. A signed-in student's link carries a referral the employer can see. It never changes how anyone is assessed. | New |
| 11 | **Find local roles** | `/jobs-in` lists cities with open roles right now; `/jobs-in/hyderabad` opens that city's list; city chips sit on the opportunities page. | New: local jobs |

## The employer (HR, recruiter, founder)

| # | Step | What happens | Where |
|---|------|--------------|-------|
| 1 | **Get verified** | Register the company (or an admin adds it). Nothing is visible, and no one can be searched, until a person verifies it. | Company |
| 2 | **Post** | Title, description, **pay**, mode, location, eligibility, deadline, screening questions. Plan limits apply. A person moderates before it goes live. | Roles |
| 3 | **Share** | The share kit gives a short link, a ready post text, WhatsApp, LinkedIn, X, email and a QR code; the career page and an embeddable widget list every open role. Every channel is tagged. | Roles, Company |
| 4 | **Watch applications arrive** | New applicants appear in the Applied column with **where they came from** (WhatsApp, LinkedIn, referral from a named student, career page...). | Pipeline, Analytics |
| 5 | **Read the proof** | Open the Talent Passport (verified evidence apart from self-declared skills), screening answers, and, **new**, download the **resume** and watch the **selfie introduction** if the candidate chose to share it. | Pipeline |
| 6 | **Move candidates** | Under review, Shortlisted, Interview, Offer, Hired. Bulk actions, tags and private notes. Nobody is auto-rejected; a person moves every card. | Pipeline |
| 7 | **Talk and schedule** | In-app messages (contact details stay private unless the student shares them), interview scheduling with calendar files, interview feedback. | Pipeline, Interviews |
| 8 | **Offer and hire** | Extend an offer, the candidate accepts or declines, mark hired. | Pipeline |
| 9 | **Learn** | Applications by source, by stage and by listing, so the team can see which channel brings the people they hire. | Analytics |
| 10 | **Test skills first (optional)** | Publish a challenge or a timed assessment; a person scores it against the rubric; shortlist the best work. | Challenges, Assessments |

## What we looked at, and what we chose

We read the public descriptions of Apna and Job Hai (their own pages, so treat as marketing) and Naukri's upload guidance (secondhand). We kept the parts that make applying easy and left out the parts that conflict with our rules.

| Idea | Seen in | Kalwings |
|------|---------|----------|
| One-tap apply | Apna | Built: the form is pre-filled from the profile, resume ticked by default |
| Jobs near you, by city | Job Hai, Apna | Built: `/jobs-in/[city]` from real listings, city chips |
| Chat with the employer | Apna | Already built: in-app messages |
| Upload a resume (PDF, DOC, DOCX, RTF, about 2 MB) | Naukri and others | Built, with content checks |
| Audio or video introduction | Job Hai (audio intro) | Built as a selfie video at a 100% profile, shared only by choice |
| Free for job seekers | Apna, Job Hai | Yes |
| Share jobs on WhatsApp | common | Built: short link plus a ready message |
| Call the HR directly | Apna and others | **Not built.** Student and recruiter phone numbers stay private; messages are the channel |
| Regional-language app | Job Hai (10 languages) | **Not built yet.** A candidate for the roadmap |
| Auto-rank or auto-reject | some job sites | **Never.** Scores are advice, a person decides every step |

## Rules that hold in every step

- Pay, work mode, location and eligibility are always shown, in listings and in share messages.
- A resume and a selfie video are private: only the candidate, and a verified company the candidate sent them to, can open them. The candidate can delete either at any time and it disappears everywhere.
- The video needs a 100% profile; sharing it is a separate, un-ticked choice per application.
- No guaranteed jobs, no invented numbers, no automatic rejection.
