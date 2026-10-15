# Narration script for KALWINGS-Walkthrough.mp4

The video now includes this narration as a voiceover (open Kokoro voice `af_heart`), timed to each on-screen step, and the same lines appear as captions. This file is the script, in order, in case you want to re-record it in your own voice.


## Intro

Welcome. In the next few minutes you will see how to run Kalwings as an admin, and how the code is organised for developers.


## Five rules that never change

- **Real people only, with consent.** Never add a student or mentor who has not agreed to be listed.
- **Pay, mode, location, eligibility.** Always shown on every listing. Unpaid roles say so.
- **Student contact stays private.** Unless the student chooses to share it.
- **No invented numbers.** No made-up stats, logos, awards or testimonials.
- **People decide.** No auto-rejection. Scores are advice. No guaranteed jobs.

## Staff guide: Part A


## 1. Sign in

1. Open the login page and type your email address.
2. Press Send one-time code. There are no passwords: a six-digit code is emailed to you.

## 1. Sign in

1. Type the six-digit code from your inbox. It works for 10 minutes.
2. Press Log in. You land in your workspace.

## 2. The admin workspace

1. Directory: companies, colleges, mentors and users live here.
2. Bulk upload: add many students, companies or mentors from a spreadsheet.
3. Launch readiness: a live checklist of what is still missing.

## 3. Companies

1. Add a company yourself: name, website, status and plan.
2. Search by name, or filter by status.
3. Open a company to manage it.

## 3. Inside a company

1. Edit details, upload a logo, set the career page address.
2. Verification: only verified companies can post and search.
3. Plan: choose which limits apply.
4. Team: add an HR person by name and email. They sign in with an emailed code.

## 3. Post a listing for a company

1. Fill title, type, description, pay, mode, location, eligibility and deadline. Pay is mandatory.
2. Listings appear here. Close or reopen any time.

## 4. Colleges

1. Add a college and verify it so students can pick it.
2. Edit a college whenever you need to.

## 5. Mentors

1. Add a mentor with every detail: role, company, country, domain, topics and bio.
2. Edit later, or upload a photo for them. The mentor can update their own profile after signing in.

## 6. Users and roles

2. Add anyone: student, mentor, HR at another company, college admin or admin.
3. Change role: the account and all its data stay exactly as they were.
1. Role requests from users wait here. Approve or decline.
4. Search by name or email. Suspending is reversible and never deletes anyone.

## 6. What the user does

1. In Settings, a user picks the role they need...
2. ...explains why...
3. ...and sends the request. Nothing changes until an admin approves.

## 7. Bulk upload

1. Three panels: students, companies and mentors.
2. Each takes an Excel or CSV file, up to 1,000 rows.
3. Mentors need role, company, country and domain as well as name and email.

## 7. Preview, then import

1. Download the template and keep its first row.
2. Choose your filled-in file.
3. Preview saves nothing. Every row shows ready, skipped or error.
5. Two ready, one error. Fix it or leave it out.
4. Import adds only the ready rows. One bad row never blocks the others.

## 8. Employer plans

1. Rename a plan.
2. Set the price text employers see.
4. Change the four limits: listings, challenges, assessments, team.
5. Save: every company on the plan sees it at once.

## 8. Assign a plan

3. Press a plan button to switch a company. Its team is notified.

## 9. Site settings

1. An announcement banner for every signed-in page.
2. The support email shown on Help and Contact.
3. Untick a role to close sign-ups for it.
4. Save. Changes show straight away.

## 10. Launch readiness

2. If sign-in emails are not ticked, nobody can receive codes. Fix that first.
3. Real companies, colleges, mentors and listings: each line links to where you fix it.

## 11. Reviews

3. Approve or reject new listings. Check pay, mode, location and eligibility are honest.

## 12. Audit log

3. Every admin decision is recorded: who, what and when. Entries cannot be edited.

## Developer overview: Part B


## How a request flows

A request flows from the browser to a server component, which checks the role and reads the database with Prisma. Every request re-reads the user, so a suspension or role change applies on the very next click.


## Every server action follows six steps

1. `requireActionRole`: Who is calling? First line of every action.
2. `zod validate`: Check and cap every input on the server.
3. `Business rules`: Return friendly errors, do not throw.
4. `Prisma write`: Scope queries to the owner.
5. `audit()`: Record sensitive changes.
6. `revalidatePath`: Refresh pages and return a result.

## Changing the database safely

1. `Edit schema.prisma`: Additive changes only.
2. `prisma migrate diff`: Generate the SQL from your local database.
3. `Add migration.sql`: New timestamped folder. Never edit an old one.
4. `embed-migrations`: Compile the SQL into the build. Commit the generated file.
5. `migrate deploy`: Apply and check for drift.
6. `docs:db and docs:api`: Regenerate docs, then commit together.

## Ship with confidence

Before every pull request run lint, typecheck, unit tests, the build, and the end-to-end suite. CI then repeats the checks on MySQL 8 and MariaDB 10.11. Merge to main: Hostinger builds, migrations apply automatically, and you confirm the health endpoint.


## Outro

Read the full manual. KALWINGS-Manual.pdf: 69 pages, every step with labelled screenshots.

