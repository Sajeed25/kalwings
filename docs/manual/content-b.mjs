// Part B: developer reference. Written for a junior developer joining the team. Appendix tables are generated from the source tree
// at build time, so they cannot drift from the code.
import fs from 'node:fs';
const ROOT = new URL('../../', import.meta.url).pathname;
const read = (p) => fs.readFileSync(ROOT + p, 'utf8');
const exportsOf = (file) => [...read(file).matchAll(/export (?:async )?function ([A-Za-z0-9_]+)/g)].map((m) => m[1]);
const actionRows = () => fs.readdirSync(ROOT + 'src/app/actions').filter((f) => f.endsWith('.ts') && f !== '_shared.ts').sort().map((f) => [`<code>${f}</code>`, exportsOf('src/app/actions/' + f).map((n) => `<code>${n}</code>`).join(' ')]);
const models = () => [...read('prisma/schema.prisma').matchAll(/^model (\w+)/gm)].map((m) => m[1]);
const enums = () => [...read('prisma/schema.prisma').matchAll(/^enum (\w+)/gm)].map((m) => m[1]);
const apiRows = () => {
  const out = []; const walk = (d) => { for (const f of fs.readdirSync(ROOT + d, { withFileTypes: true })) { const p = d + '/' + f.name; if (f.isDirectory()) walk(p); else if (f.name === 'route.ts') { const m = [...read(p).matchAll(/export (?:async )?function (GET|POST|PUT|DELETE)/g)].map((x) => x[1]).join(', '); out.push([`<code>/${p.replace('src/app/', '').replace('/route.ts', '')}</code>`, m]); } } };
  walk('src/app/api'); return out.sort();
};
const navRows = () => {
  const src = read('src/lib/modules.ts'); const rows = [];
  for (const role of ['student', 'employer', 'mentor', 'college', 'admin']) {
    const block = src.slice(src.indexOf(`const ${role}: Section[]`)); const end = block.indexOf('];\n'); const b = block.slice(0, end);
    for (const m of b.matchAll(/label: "([^"]+)", icon: "[a-z]+", href: "([^"]+)"/g)) rows.push([role, m[1], `<code>${m[2]}</code>`]);
  }
  return rows;
};
const dbWords = (arr) => arr.map((x) => `<code>${x}</code>`).join(' · ');

export const partB = (h) => [
h.part('part-b', 'Developer reference', 'For the developers who keep Kalwings running. Written as a senior developer’s handover to a junior: how the code is organised, how to run it, how to change it safely, and the rules that keep users’ data safe. Read B1 to B5 first; use the rest as reference.'),

h.h2('B1', 'What you are working on'),
h.p('Kalwings (app.kalwings.com) is a career platform for freshers: students build a profile with real projects, employers post roles and challenges and run a hiring pipeline, colleges track consenting students and run placement drives, mentors give office hours, and platform admins verify, moderate and configure. The marketing site is separate (kalwings.com). This app starts at sign-in.'),
h.h3('Stack'),
h.table(['Layer', 'Choice', 'Notes'], [
 ['Framework', 'Next.js 15 (App Router), React 19, TypeScript', 'Server components by default; mutations are <b>server actions</b>; a few route handlers for files, uploads, exports'],
 ['Styling', 'Tailwind CSS with CSS-variable tokens', 'Dark by default, light in Settings; tokens in <code>src/app/globals.css</code>'],
 ['Data', 'Prisma 6 on MySQL 8 or MariaDB 10.11', 'Hostinger runs either; CI tests both'],
 ['Validation', 'zod', 'Every action validates its input on the server'],
 ['Auth', 'Email one-time codes (+ optional password, Google)', 'Signed JWT in an httpOnly cookie via <code>jose</code>'],
 ['Email', 'SMTP via nodemailer', 'Hostinger mailbox; no third-party email API'],
 ['Spreadsheets', '<code>read-excel-file</code>', 'Bulk upload (never the vulnerable <code>xlsx</code> npm package)'],
 ['Tests', 'tsx unit tests, Playwright e2e/a11y/access', 'Run against a dev server and a seeded database'],
 ['Hosting', 'Hostinger Node.js app, auto-deploy from GitHub <code>main</code>', 'Migrations run at server start'],
]),
h.h3('Request flow in one paragraph'),
h.p('A browser requests a page. A server component calls <code>requirePageRole(...)</code>, which reads the <code>kw_session</code> cookie, verifies the JWT, then <b>re-reads the user from the database</b> (so suspensions and role changes apply on the very next request) and redirects if the role is wrong. The page queries Prisma directly and renders. When a form is submitted, a <b>server action</b> runs: it calls <code>requireActionRole(...)</code> first, validates with zod, writes via Prisma, writes an audit entry for sensitive changes, calls <code>revalidatePath</code>, and returns a small result object that the form displays.'),
h.h3('Folder map'),
h.table(['Path', 'What lives there'], [
 ['<code>src/app/</code>', 'Routes. <code>dashboard/*</code> is the signed-in app; <code>api/*</code> route handlers; <code>actions/*</code> server actions; public pages (login, join, opportunities, mentors, careers, talent, help, contact, legal)'],
 ['<code>src/app/actions/</code>', 'All mutations, one file per area: <code>admin, console, employer, student, mentor, assessments, community, drives, auth, account, common, contact, college</code>'],
 ['<code>src/lib/</code>', 'Server logic: <code>session, db, audit, email, plans, settings, bulk, validation, matching, nlsearch, migrate, rate-limit, modules</code> and more'],
 ['<code>src/components/</code>', '<code>ui/</code> (Button, Badge, Serif, CompanyLogo, brand), <code>dash/</code> (forms, sidebar, panels, uploads), <code>pages/</code>, <code>home/</code>'],
 ['<code>prisma/</code>', '<code>schema.prisma</code>, <code>migrations/</code> (hand-reviewed SQL), <code>seed.ts</code> (sample data only)'],
 ['<code>scripts/</code>', '<code>embed-migrations.mjs</code>, <code>gen-db-docs.mjs</code>, <code>gen-api-docs.mjs</code>, <code>backup-db.mjs</code>, <code>make-admin.ts</code>, export scripts'],
 ['<code>e2e/</code>', '<code>platform.mjs</code> (journeys), <code>a11y.mjs</code>, <code>access.mjs</code>, <code>unit.ts</code>, <code>ratelimit.ts</code>, <code>production.mjs</code>, <code>degraded.mjs</code>, mock mail and sandbox'],
 ['<code>docs/</code>', 'Generated and written docs (<code>DATABASE.md</code>, <code>API.md</code>, <code>OPERATIONS.md</code>, <code>SECURITY.md</code>, <code>QUALITY.md</code>, <code>FEATURES.md</code>) and this manual'],
]),

h.h2('B2', 'Set up your machine (step by step)'),
h.p('You need Node 20 or newer (CI uses 22), Git, and a local MySQL 8 or MariaDB 10.6+.'),
h.ol([
 'Clone the repository and install: <code>git clone https://github.com/Sajeed25/kalwings.git</code>, <code>cd kalwings</code>, <code>npm install</code> (this also runs <code>prisma generate</code>).',
 'Start a database. With Docker: <code>docker run -d -p 3306:3306 -e MARIADB_ROOT_PASSWORD=root -e MARIADB_DATABASE=kalwings mariadb:10.11</code>.',
 'Copy the environment file: <code>cp .env.example .env</code>. Set <code>DATABASE_URL=mysql://root:root@localhost:3306/kalwings</code>, a 32+ character <code>AUTH_SECRET</code> (<code>openssl rand -base64 48</code>) and <code>NEXT_PUBLIC_SITE_URL=http://localhost:3000</code>. Leave SMTP empty locally: sign-in codes then appear on screen.',
 'Create the tables: <code>npx prisma migrate dev</code> (needs permission to create a shadow database) or, if you only need to apply existing migrations, <code>npx prisma migrate deploy</code>.',
 'Load demo data: <code>npm run db:seed</code>. This creates <b>sample</b> mentors, companies, listings, one sample admin, student, college admin, mentor and employer. Every record is flagged or named “Sample”.',
 'Run the app: <code>npm run dev</code> and open http://localhost:3000.',
 'Sign in as <code>admin@sample.kalwings.test</code> (or <code>student@…</code>, <code>college@…</code>, <code>sample-mentor-1@…</code>, <code>sample-co-a@…</code>). The one-time code is printed on the page in development.',
]),
h.warn('<b>Never run <code>npm run db:seed</code> against production.</b> If it ever ran there, run <code>npm run db:unseed</code>. Sample sign-in addresses end in <code>@sample.kalwings.test</code> and cannot receive mail, so they are inert, but they must not exist on a live site.'),
h.h3('Make yourself a real admin locally'),
h.p('Put your email in <code>ADMIN_EMAILS</code> and sign in, or sign in once and run <code>DATABASE_URL=… npm run make-admin -- you@example.com</code>.'),
h.h3('Everyday commands'),
h.table(['Command', 'What it does'], [
 ['<code>npm run dev</code>', 'Dev server on port 3000'],
 ['<code>npm run lint</code> / <code>npm run typecheck</code>', 'ESLint (next lint) / <code>tsc --noEmit</code>'],
 ['<code>npm run test:unit</code>', '18 pure-logic tests (no browser, no server)'],
 ['<code>npm run build</code>', 'Embeds migrations (prebuild) then builds Next'],
 ['<code>npm run db:seed</code> / <code>db:unseed</code>', 'Add or remove SAMPLE data'],
 ['<code>npm run docs:db</code> / <code>docs:api</code>', 'Regenerate <code>docs/DATABASE.md</code> and <code>docs/API.md</code>'],
 ['<code>npm run backup -- ./backups 14</code>', 'gzip dump, keep newest 14'],
 ['<code>npm run test:e2e | test:access | test:a11y</code>', 'Browser suites against a dev server (B15)'],
]),

h.h2('B3', 'Configuration reference'),
h.p('All configuration is environment variables. On Hostinger they are set in hPanel. Changing <code>NEXT_PUBLIC_SITE_URL</code> needs a redeploy because it is baked in at build time. Never commit secrets; rotate any secret that was pasted anywhere.'),
h.table(['Variable', 'Required', 'Purpose'], [
 ['<code>DATABASE_URL</code>', 'yes', 'mysql://user:pass@host:3306/db?connection_limit=5 (URL-encode special characters in the password)'],
 ['<code>AUTH_SECRET</code>', 'yes', '32+ random characters. Changing it signs everyone out'],
 ['<code>NEXT_PUBLIC_SITE_URL</code>', 'yes', 'https://app.kalwings.com, no trailing slash'],
 ['<code>SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM</code>', 'yes in production', 'Hostinger mailbox (smtp.hostinger.com, 465). Without it nobody can sign in. SMTP_USER must be the full address; EMAIL_FROM must be that mailbox or an alias'],
 ['<code>ADMIN_EMAILS</code>', 'first admin', 'Comma-separated; these emails become platform admins when they sign in'],
 ['<code>CONTACT_TO</code>', 'no', 'Inbox for contact-form emails (default EMAIL_FROM); messages are always stored in the database too'],
 ['<code>SANDBOX_URL, SANDBOX_TOKEN</code>', 'no', 'Isolated Judge0-compatible runner; unset = coding assessments off'],
 ['<code>GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET</code>', 'no', 'Google sign-in (untested against real credentials)'],
 ['<code>MOBILE_LOGIN</code>', 'no', 'Leave unset. Mobile OTP is hidden and refused until an SMS provider exists'],
 ['<code>AUTO_MIGRATE</code>', 'no', 'Default on: applies pending migrations at server start. <code>false</code> disables'],
]),
h.p('What the server logs at start-up (check the Runtime log on Hostinger): <code>[startup] database: …</code>, <code>[startup] email: …</code> (host, user, password length, never the password), and <code>[migrate] ok</code> or <code>[migrate] FAILED</code>. Missing or malformed variables are reported there with a plain explanation.'),

h.h2('B4', 'Authentication, sessions and roles'),
h.h3('How sign-in works'),
h.ol(['The user submits an email. <code>requestOtp</code> (in <code>actions/auth.ts</code>) rate-limits per identifier and per IP, checks whether sign-up is open for the chosen role when the account does not exist (<code>signupClosedMessage</code>), creates a 6-digit code (hashed in <code>OtpCode</code>, expires in 10 minutes) and emails it.', '<code>submitOtp</code> checks the code (5 attempts), creates the user if joining (student profile created for students), and calls <code>createSession</code>.', '<code>createSession</code> signs a JWT (<code>HS256</code>, 14 days) with the user id as subject and sets <code>kw_session</code> (httpOnly, sameSite=lax, secure in production). A non-sensitive <code>kw_in</code> hint cookie lets static pages show “Dashboard”; it is never used for authorisation.', 'On every request <code>getUser()</code> verifies the JWT and re-reads the user. A suspended user returns <code>null</code>, so suspension is instant.']),
h.h3('Authorisation: the two helpers you must use'),
h.code(`// pages: redirect when signed out or wrong role
const user = await requirePageRole("PLATFORM_ADMIN");

// server actions and route handlers: throw instead of redirecting
const a = await requireActionRole("PLATFORM_ADMIN");   // FIRST line of EVERY action`),
h.rule('A server action is a public HTTP endpoint. Hiding a button is not security. Every action must call <code>requireActionRole</code> before anything else, and every query for a user’s own data must be scoped to that user in the query itself (<code>where: { id, userId: user.id }</code>), not checked afterwards.'),
h.h3('Roles'),
h.p('Roles are the Prisma enum <code>Role</code>: STUDENT, MENTOR, EMPLOYER, COLLEGE_ADMIN, PLATFORM_ADMIN. Role-specific data hangs off <code>User</code> as optional one-to-one rows (<code>student</code>, <code>mentor</code>, <code>employer</code> (EmployerMember), <code>college</code> (CollegeAdmin)). A role change updates <code>User.role</code> only and keeps those rows. Only students require their profile row to exist (several student pages assume it), so <code>applyRole</code> in <code>actions/console.ts</code> creates an empty one when needed.'),
h.p('Admin bootstrap: <code>ADMIN_EMAILS</code> is read on sign-in by <code>src/lib/admin-bootstrap.ts</code>. Admin creation of other accounts is in <code>createUser</code> (<code>actions/admin.ts</code>).'),
h.h3('Rate limits'),
h.p('<code>rateLimit(key, limit, windowMs)</code> in <code>src/lib/rate-limit.ts</code> is a database-backed fixed window using one atomic upsert, so it survives restarts and is shared by all processes. It <b>fails open</b> if the database errors. Examples: sign-in codes per identifier and per IP, uploads 20/hour, bulk upload 60/hour, notification emails 10/hour per user. In tests, late sign-ins use their own <code>x-forwarded-for</code> header to avoid the per-IP code limit (20/hour).'),

h.h2('B5', 'The data model'),
h.p(`Prisma schema: <code>prisma/schema.prisma</code>. Generated reference of every model and column: <code>docs/DATABASE.md</code> (<code>npm run docs:db</code>). Models (${models().length}): ${dbWords(models())}.`),
h.p(`Enums (${enums().length}): ${dbWords(enums())}.`),
h.h3('Models added for the admin console'),
h.table(['Model', 'Purpose', 'Key fields'], [
 ['<code>PlanConfig</code>', 'Employer plans, editable by admins. One source of truth for the usage panel, the admin Plans page and server-side limit enforcement', '<code>key</code> (id, e.g. STARTER), <code>label</code>, <code>priceText</code>, <code>description</code>, <code>features</code> (Json lines), <code>listings, challenges, assessments, team</code>, <code>highlight, active, position</code>'],
 ['<code>SiteSetting</code>', 'Key/value settings', '<code>key</code> (<code>announcement</code>, <code>supportEmail</code>, <code>signup.STUDENT</code> …), <code>value</code> (“on”/“off” for sign-up)'],
 ['<code>RoleChangeRequest</code>', 'A user asking an admin to change their role', '<code>userId, fromRole, requestedRole, reason, status</code> (PENDING / APPROVED / DECLINED), <code>decidedById, decisionNote, decidedAt</code>'],
]),
h.p('<code>Company.plan</code> is a <b>string</b> equal to a <code>PlanConfig.key</code> (it used to be an enum; changing it to a string is what lets admins create plans). A company whose plan key has no row falls back to the smallest plan so nothing is ever unlimited by accident (<code>getPlan</code> in <code>src/lib/plans.ts</code>).'),
h.h3('Conventions'),
h.ul(['Ids are <code>cuid()</code> strings. Timestamps are UTC <code>DateTime</code>; the UI formats in IST (<code>Asia/Kolkata</code>).', 'JSON columns hold lists (<code>tags</code>, <code>skillsClaimed</code>, <code>features</code>). Read them through <code>asList()</code> in <code>src/lib/lists.ts</code> so a bad value never crashes a page.', 'Sample data is flagged with <code>isSample</code> (companies, mentors, students) or named “Sample …” (colleges). Real queries that count “real” records exclude them.', 'Contact details (email, phone) live on <code>User</code> and are never selected by public, Passport, roster, drive or report queries. Always use an explicit <code>select</code> when returning user-related data to a page another person can see.', 'Deleting a user cascades to their profile rows and role requests. No admin screen deletes users; only <code>deleteMyAccount</code> does, for the signed-in person.']),

h.h2('B6', 'Database migrations (the careful part)'),
h.p('Migrations are plain SQL under <code>prisma/migrations/&lt;timestamp&gt;_&lt;name&gt;/migration.sql</code>. They are <b>forward-only and additive</b>: never edit a migration that has been merged; fix forward with a new one. Hostinger deploys only the built app (no <code>prisma/</code> folder, no Prisma CLI), so the SQL is <b>embedded into the build</b> and applied by the server at start.'),
h.h3('How the pieces fit'),
h.ul(['<code>scripts/embed-migrations.mjs</code> (runs as <code>prebuild</code>) reads every migration folder and writes <code>src/lib/migrations.generated.ts</code>. <b>Commit that file.</b> CI fails if it is stale.', '<code>src/lib/migrate.ts</code> runs from <code>src/instrumentation.ts</code> at server start (unless <code>AUTO_MIGRATE=false</code>): it takes a MySQL advisory lock so two instances cannot race, creates <code>_prisma_migrations</code> if missing, and applies pending migrations in order, recording them with Prisma’s own checksum so <code>prisma migrate status</code> still agrees.', 'CI applies migrations to MySQL 8 and MariaDB 10.11, and on MySQL 8 also checks that <code>schema.prisma</code> and the migrations produce the same schema (drift check).']),
h.h3('Step by step: change the schema'),
h.ol([
 'Edit <code>prisma/schema.prisma</code>. Keep changes additive (new tables or nullable/defaulted columns).',
 'Generate the SQL from your <b>local database that is currently at the previous migration state</b>: <code>npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script</code>.',
 'Create <code>prisma/migrations/&lt;YYYYMMDDHHMMSS&gt;_short_name/migration.sql</code> and paste the output. The timestamp must sort after every existing folder.',
 '<b>MariaDB noise:</b> MariaDB reports JSON columns as longtext, so the diff may include unrelated <code>MODIFY</code> statements for JSON columns. Delete those lines. If the diff misses something (for example changing a column type with a default), write the <code>ALTER TABLE</code> by hand and read it twice.',
 'Embed and apply: <code>node scripts/embed-migrations.mjs</code>, then <code>npx prisma migrate deploy</code>, then <code>npx prisma generate</code>.',
 'Prove there is no drift: run the diff from step 2 again; it should print an empty migration (ignoring MariaDB JSON noise).',
 'Regenerate docs: <code>npm run docs:db && npm run docs:api</code>. Commit schema, migration folder, <code>migrations.generated.ts</code> and docs together.',
]),
h.code(`-- prisma/migrations/20261020100000_role_change_requests/migration.sql (abridged)
CREATE TABLE \`RoleChangeRequest\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`userId\` VARCHAR(191) NOT NULL,
    \`requestedRole\` ENUM('STUDENT','MENTOR','EMPLOYER','COLLEGE_ADMIN','PLATFORM_ADMIN') NOT NULL,
    \`status\` VARCHAR(12) NOT NULL DEFAULT 'PENDING',
    PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE \`RoleChangeRequest\` ADD CONSTRAINT \`RoleChangeRequest_userId_fkey\`
  FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;`),
h.warn('Never <code>DROP</code> or rename a column in the same release that stops using it. Deploy the code that no longer reads it first, then remove it in a later migration. Seed data must never be inserted by a migration except fixed reference rows (the three default plans are one such case).'),
h.note('Local gotchas: dropping the database under a running dev server breaks it, so restart <code>npm run dev</code> after recreating the database. If <code>migrate dev</code> complains about the shadow database, use the <code>migrate diff</code> flow above.'),

h.h2('B7', 'Server actions: the pattern to copy'),
h.p('Every mutation is a server action in <code>src/app/actions/*.ts</code> (file starts with <code>"use server"</code>). They return a small object the form shows: <code>{ ok?, error?, fieldErrors? }</code> (<code>Result</code> in <code>_shared.ts</code>). The admin console adds <code>note?</code> for a confirmation sentence (<code>NoteResult</code>).'),
h.code(`"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { audit } from "@/lib/audit";
import { fail, obj, type Result } from "./_shared";

const schema = z.object({ name: z.string().trim().min(2, "Enter the name").max(160) });

export async function saveThing(_: Result, fd: FormData): Promise<Result> {
  const a = await requireActionRole("PLATFORM_ADMIN");       // 1. who is calling?
  const r = schema.safeParse(obj(fd));                       // 2. validate everything
  if (!r.success) return fail(r.error);                      //    first message goes to the user
  const dup = await db.thing.findFirst({ where: { name: r.data.name } });
  if (dup) return { error: "That name already exists." };    // 3. friendly business-rule errors
  const t = await db.thing.create({ data: r.data });         // 4. write
  await audit(a.id, "thing.created", \`\${r.data.name} (\${t.id})\`.slice(0, 190)); // 5. audit sensitive changes
  revalidatePath("/dashboard", "layout");                    // 6. refresh pages
  return { ok: true };
}`),
h.h3('Rules'),
h.ul(['<b>Return errors, do not throw</b>, for anything a user can cause. Throwing is for “this should never happen” or for button actions that take only an id.', 'Plain-language messages. They are shown verbatim to staff and users.', 'Cap every string (<code>.max()</code>) and slice values written to <code>AuditLog.target</code> to 190 characters.', 'Admin actions never delete users. Deleting configuration rows (a plan) must refuse when something still uses it (see <code>deletePlan</code>).', 'Email is best effort and must never fail the action: wrap sending in try/catch (see <code>emailAccountReady</code>, which never throws).', 'Notify affected people with <code>notify(userId, title, body)</code>; it saves an in-app notification and emails when configured, capped at 10 emails/hour/user.']),
h.h3('Forms on the client'),
h.ul(['<code>ActionForm</code> (<code>src/components/dash/action-form.tsx</code>): the original wrapper with <code>Field</code>, <code>Area</code> helpers.', '<code>ConsoleForm</code> (<code>src/components/dash/console-form.tsx</code>): used by the admin console; takes <code>action</code>, an accessible <code>label</code> (this becomes the form’s <code>aria-label</code>, which tests use to find it), <code>submit</code> text, and optional <code>resetOnSuccess</code>. It shows the error in a <code>role="alert"</code> and the confirmation in <code>role="status"</code>.', 'Both submit manually with <code>startTransition</code> instead of <code>action={…}</code>: React 19 resets uncontrolled forms after an action, which lost users’ input when an error came back.', '<code>ActionButton</code> (id-only actions such as Verify, Close) wraps a button in a form and supports a <code>confirm</code> message.']),

h.h2('B8', 'How-to recipes'),
h.h3('Recipe 1: add a new admin page'),
h.ol([
 'Create <code>src/app/dashboard/&lt;name&gt;/page.tsx</code>. First line of the component: <code>await requirePageRole("PLATFORM_ADMIN")</code>.',
 'Use <code>PageTitle</code>, <code>Panel</code>, <code>Empty</code>, <code>Status</code> from <code>@/components/dash/ui</code>. Follow an existing page (<code>colleges/page.tsx</code> is the smallest full example).',
 'Add one entry to the right section in <code>src/lib/modules.ts</code>: <code>{ label, icon, href, desc }</code>. The sidebar, the “Everything in your workspace” grid and the tab bars all derive from it. Pick an <code>icon</code> from the existing <code>IconKey</code> list or add one in <code>src/components/dash/icons.tsx</code>.',
 'Add the route to <code>e2e/access.mjs</code> (<code>PAGES</code> map: role list allowed) and a check to <code>e2e/platform.mjs</code>.',
 'Do not restyle anything. Reuse existing classes.',
]),
h.h3('Recipe 2: add a new setting an admin can change'),
h.ol(['Choose a key. Settings are rows in <code>SiteSetting</code>; defaults live in <code>getSettings()</code> in <code>src/lib/settings.ts</code> (so a missing row still works).', 'Add the field to the <code>Settings</code> type and parse it in <code>getSettings()</code>.', 'Add the input to <code>src/app/dashboard/site/page.tsx</code> and the zod field and upsert row in <code>saveSettings</code> (<code>actions/console.ts</code>).', 'Read it with <code>await getSettings()</code> wherever it is used.']),
h.h3('Recipe 3: add or change a plan limit'),
h.ol(['Add the column to <code>PlanConfig</code> (migration, B6).', 'Extend <code>PlanRow</code> and <code>FALLBACK</code> in <code>src/lib/plans.ts</code>, the <code>Meter</code> type and <code>usage()</code>.', 'Enforce with <code>limitError(companyId, planKey, meter)</code> in the action that creates the thing (see how <code>postOpportunity</code> does it).', 'Add the input to <code>PlanFields</code> in <code>dashboard/plans/page.tsx</code> and to <code>planSchema</code> in <code>savePlan</code>.']),
h.h3('Recipe 4: add a bulk-import type'),
h.ol(['Add the kind to <code>BulkKind</code> and a <code>SPECS</code> entry (<code>columns</code>, <code>required</code>, <code>sample</code>, <code>help</code>) in <code>src/lib/bulk.ts</code>.', 'Write a processor <code>async function thing(r, ctx): Promise&lt;Out&gt;</code> modelled on <code>student</code>: validate, de-duplicate with <code>ctx.seen</code>, check the database, and only write when <code>ctx.commit</code> is true. Return <code>good</code>, <code>skip</code> or <code>err</code>.', 'Register it in <code>PROCESS</code>.', 'Add the kind to the allow-list in <code>src/app/api/admin/bulk/route.ts</code>, a <code>&lt;BulkUpload kind=…&gt;</code> panel in <code>dashboard/bulk/page.tsx</code>, and a test.']),
h.h3('Recipe 5: add an environment variable'),
h.ol(['Read it only on the server (<code>process.env.NAME</code>). Anything prefixed <code>NEXT_PUBLIC_</code> is baked into the browser bundle at build time: never put secrets there.', 'Document it in <code>.env.example</code>, <code>docs/OPERATIONS.md</code> and B3 of this manual.', 'If production cannot work without it, validate in <code>src/lib/env.ts</code> so the start-up log says so clearly.', 'If an admin should know about it, add a line to <code>dashboard/launch/page.tsx</code>.']),
h.h3('Recipe 6: add a new role-gated API route'),
h.code(`// src/app/api/admin/thing/route.ts
export async function POST(req: Request) {
  try { await assertSameOrigin(); } catch { return NextResponse.json({ error: "Bad origin" }, { status: 403 }); } // CSRF
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (user.role !== "PLATFORM_ADMIN") return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  if (!(await rateLimit(\`thing:\${user.id}\`, 60, 60 * 60 * 1000))) return NextResponse.json({ error: "Too many" }, { status: 429 });
  // …validate, do the work, audit…
}`),
h.p('Server actions already enforce same-origin; route handlers do not, so call <code>assertSameOrigin()</code> in every POST. Add the route to <code>e2e/access.mjs</code>.'),

h.h2('B9', 'The admin console, file by file'),
h.table(['File', 'Responsibility'], [
 ['<code>src/lib/plans.ts</code>', '<code>allPlans()</code>, <code>getPlan(key)</code> (falls back to the smallest plan), <code>usage(companyId)</code>, <code>limitError()</code>. Server-only'],
 ['<code>src/lib/settings.ts</code>', '<code>getSettings()</code>, <code>SIGNUP_ROLES</code>, <code>signupClosedMessage(role)</code>. Defaults when a row is missing; logs and returns defaults if the table is unreachable'],
 ['<code>src/app/actions/console.ts</code>', '<code>savePlan, deletePlan, saveSettings, saveCompany, postListingFor, adminSetListingClosed, saveCollege, saveMentor, changeUserRole, requestRoleChange, cancelRoleRequest, decideRoleRequest</code>. All admin-only except the user-side role-request actions; all audit-logged'],
 ['<code>src/app/actions/admin.ts</code>', 'Older admin actions: verify/reject company, college, mentor; moderate listing; reports; suspend/unsuspend; <code>setPlan</code>; <code>createUser</code>'],
 ['<code>src/lib/account-email.ts</code>', '<code>emailAccountReady({ name, email, extra })</code>: tells a person an admin set up their account; returns a sentence for the admin; never throws'],
 ['<code>src/lib/bulk.ts</code>', 'Spreadsheet reading, per-row validation and import (B10)'],
 ['<code>src/app/api/admin/bulk/route.ts</code>, <code>…/template/route.ts</code>', 'Upload endpoint (preview or import) and CSV template download'],
 ['<code>src/app/api/upload/route.ts</code>', 'Image upload. Platform admins may upload a company logo (<code>companyId</code>) or a mentor photo (<code>mentorId</code>) on someone’s behalf'],
 ['<code>src/app/dashboard/{companies,colleges,mentors,users,plans,site,bulk,launch}</code>', 'The admin pages'],
 ['<code>src/components/dash/{console-form,bulk-upload,announcement,image-upload}.tsx</code>', 'Shared UI for those pages'],
]),
h.h3('Behaviours worth knowing'),
h.ul(['<b>Plans.</b> <code>savePlan</code> upserts by key; features are stored as up to 12 lines of up to 120 characters. It refuses to switch off the last active plan. <code>deletePlan</code> refuses while companies use the plan or when it is the only plan. <code>setPlan</code> validates against <code>PlanConfig</code> and notifies the company’s team.', '<b>Admin-posted listings</b> (<code>postListingFor</code>) are created with <code>moderated: "VERIFIED"</code>, require a VERIFIED company and bypass plan limits (the admin is the moderator). Challenges are refused because they need a brief and rubric.', '<b>Companies</b>: names unique (case-insensitive collation), website must be http(s), career slug validated by <code>slugProblem</code> and unique. Verifying sets <code>verifiedAt</code>.', '<b>Mentors</b>: <code>saveMentor</code> creates a User (role MENTOR) with a verified MentorProfile and emails them via <code>emailAccountReady</code> with a sentence telling them to update their profile. A mentor’s own <code>saveMentorProfile</code> cannot change status.', '<b>Sign-up toggles</b> are enforced in three places: <code>requestOtp</code> (before emailing a code), <code>submitOtp</code> (at user creation) and the Google callback. Existing users are never blocked.', '<b>Roles</b>: <code>applyRole</code> refuses own-role changes, same-role changes and demoting the last active admin, runs in a transaction, audits, and notifies.']),

h.h2('B10', 'Bulk import internals'),
h.p('Flow: browser → <code>POST /api/admin/bulk</code> (multipart: <code>kind</code>, <code>file</code>, <code>mode=preview|import</code>, optional <code>sendEmails=1</code>) → <code>readTable</code> → <code>runBulk</code> → JSON report. It is a route handler, not a server action, because server actions have a small default body limit.'),
h.ol(['<b>Guards:</b> same-origin, signed in, PLATFORM_ADMIN, rate limit 60/hour. The route returns 400 for an unknown kind or a file that is not .xlsx or .csv.', '<b><code>readTable</code>:</b> rejects empty files and files over 2 MB. <code>.csv</code> is parsed by a small RFC-4180 parser (quotes, escaped quotes, CRLF, BOM). <code>.xlsx</code> is read with <code>read-excel-file/node</code> (<code>readSheet</code>, first sheet). Cell values become trimmed strings; dates become ISO dates; trailing empty rows are dropped.', '<b><code>runBulk</code>:</b> needs a header row plus data; caps at 1,000 rows; normalises headers (<code>lowercase</code>, spaces and dashes to underscores); checks required columns; loads the verified colleges or the plans once; then processes <b>row by row</b>, each in its own try/catch so one failure never aborts the batch.', '<b>Per-row processors</b> (<code>student</code>, <code>company</code>, <code>mentor</code>) validate, de-duplicate within the file (<code>ctx.seen</code>), skip existing records, and write only when <code>ctx.commit</code>. Preview and import run the same code, so the preview is a faithful dry run.', '<b>Emails</b> are sent after the loop, at most 200 (<code>BULK_MAX_EMAILS</code>), through <code>emailAccountReady</code>; the report says how many were sent.', '<b>Audit:</b> one <code>bulk.import</code> entry per committed import with counts and the file name.']),
h.note('The upload is processed in memory and never stored. Users created by bulk import get no password; they sign in with an emailed code like everyone else.'),
h.p('Report shape: <code>{ kind, committed, rows: [{ n, label, status: "ok"|"skipped"|"error", message }], counts: { ok, skipped, error }, emailsSent }</code>.'),
h.h3('Why not the usual <code>xlsx</code> package?'),
h.p('The version of <code>xlsx</code> published to npm has known vulnerabilities and is no longer maintained there. <code>read-excel-file</code> reads .xlsx only (no macros, no formulas executed), which is exactly what we need. <code>write-excel-file</code> is a dev dependency used only by tests to build sample workbooks.'),

h.h2('B11', 'Email'),
h.ul(['<code>src/lib/email.ts</code> sends over SMTP with nodemailer. <code>emailConfigured()</code> tells you if the variables exist. Without SMTP, sign-in codes cannot be delivered in production.', 'Sign-in codes: <code>actions/auth.ts</code>. Notifications: <code>notify()</code> in <code>src/lib/audit.ts</code>. Account-ready messages: <code>src/lib/account-email.ts</code>.', 'Hostinger only allows the mailbox itself (or an alias) as the sender: <code>EMAIL_FROM</code> must match <code>SMTP_USER</code>. The start-up log warns when they differ.', 'In tests, <code>e2e/mock-mail.mjs</code> is a tiny SMTP server that captures messages.', 'Unsubscribe links are signed (<code>src/lib/unsub.ts</code>); users can turn off notification emails in one click.']),

h.h2('B12', 'Uploads and files'),
h.ul(['Images only: PNG, JPEG, WebP, verified by magic bytes in <code>src/lib/image.ts</code> (<code>sniffImage</code>); SVG is refused. Maximum 1 MB (<code>MAX_IMAGE_BYTES</code>); the browser shrinks images first (<code>ImageUpload</code> draws them on a canvas and exports JPEG).', 'Stored in the <code>Upload</code> table (data in the database, so backups cover them). Served by <code>GET /api/files/[id]</code> via an unguessable id with long caching: a capability URL. Do not upload anything sensitive.', 'Ownership: <code>POST /api/upload</code> decides what an upload replaces by role. Students: own avatar and project images; mentors: own avatar; employers: own company logo; platform admins: any company logo or mentor photo. Old files are deleted only when the same owner uploaded them.']),

h.h2('B13', 'UI conventions and the design system'),
h.rule('<b>Do not restyle existing screens.</b> The product look is approved. New pages reuse existing components and classes. <b>Do not change the logo</b> (<code>src/components/ui/brand.tsx</code>, <code>public/brand/</code>).'),
h.table(['Topic', 'Convention'], [
 ['Theme', 'Dark by default; light is chosen in Settings → Appearance (stored in localStorage). Never add a theme toggle to the header'],
 ['Tokens', 'CSS variables in <code>src/app/globals.css</code>, mapped to Tailwind colours in <code>tailwind.config.ts</code>: <code>bg, surface, muted, ink, ink-soft, line, primary, on-primary, accent, spot, lilac, sun, mint, danger</code>. Use tokens, never raw hex'],
 ['Colour', 'Warm near-black / warm white, one hot orange (#FF5B2E) for actions; soft lilac, sun and mint “sticker” colours always with dark text'],
 ['Fonts', 'Exactly two: Plus Jakarta Sans for everything and Instrument Serif italic for one emphasised word in a heading (<code>Serif</code> component). Code editors use the browser’s monospace'],
 ['Shapes', 'Pill buttons, 20px cards (<code>.card</code>), rounded inputs with an orange focus ring, segmented-pill tabs, icon sidebar with an orange active pill'],
 ['Primary button text', 'Dark text on orange (white on orange fails contrast)'],
 ['Components', '<code>Button</code>, <code>Badge</code>, <code>CompanyLogo</code> (monogram tile until a logo exists), <code>Serif</code>, <code>PageTitle</code>, <code>Panel</code>, <code>Status</code>, <code>Empty</code>, <code>ActionForm</code>, <code>ConsoleForm</code>'],
 ['Navigation', 'One list: <code>src/lib/modules.ts</code>. Sidebar, section tabs and the workspace grid read it'],
 ['Accessibility', 'Every form has an accessible name (<code>aria-label</code> or label); errors use <code>role="alert"</code>, confirmations <code>role="status"</code>; scrollable regions are keyboard reachable; no horizontal scroll at 375 px'],
 ['Copy', 'Plain language, no jargon, no “guaranteed”, no invented numbers. Pay, mode, location and eligibility always shown'],
]),
h.h3('Trust rules built into the product (never weaken)'),
h.ul(['Pay, work mode, location and eligibility are always shown; unpaid roles are labelled unpaid; paid roles must state an amount.', 'Student contact details are private by default and never returned by public, Passport, roster, drive or report queries.', 'No “guaranteed job” language; match scores are advisory; nobody is auto-rejected; a person decides each application.', 'Only the admin verification action can set VERIFIED on a profile entry, company, college or mentor.', 'No invented statistics, testimonials, awards or logos. Sample data is always tagged “Sample”.', 'Consent: college visibility and shared progress are opt-in and revocable.']),

h.h2('B14', 'Security rules for contributors'),
h.p('The full checklist, with what is done and what is not, is <code>docs/SECURITY.md</code>. The rules you need every day:'),
h.ol(['<b>Authorise on the server, every time</b> (B4). Scope queries to the owner.', '<b>Validate with zod</b>; cap lengths; never trust hidden fields.', '<b>No raw SQL</b> except where already used (the rate limiter). Prisma parameterises everything else.', '<b>Never render user HTML.</b> React escapes. The only <code>dangerouslySetInnerHTML</code> uses are JSON-LD (with <code>&lt;</code> escaped) and a server-made QR SVG.', '<b>External URLs</b>: accept http(s) only; use <code>rel="noopener noreferrer nofollow"</code> for user-supplied links.', '<b>CSV exports</b> neutralise spreadsheet formulas (see the college report).', '<b>Secrets</b> only in environment variables. Never log them. Never put them in <code>NEXT_PUBLIC_*</code>.', '<b>Security headers</b> (CSP, HSTS, frame, nosniff, referrer, permissions) are set in <code>next.config.mjs</code>. The CSP forbids remote scripts and fonts, so do not add a CDN.', '<b>Code execution</b> for coding assessments goes only to an isolated Judge0-compatible service (<code>SANDBOX_URL</code>); never run user code on the app server.', '<b>Admin actions are audited</b> (<code>audit()</code>), and nothing an admin does deletes a user.']),

h.h2('B15', 'Testing'),
h.table(['Suite', 'Command', 'What it covers', 'Needs'], [
 ['Unit', '<code>npm run test:unit</code>', '18 tests of pure logic: matching, natural-language search parser, profile review, JD check, password hashing', 'Nothing'],
 ['End-to-end', '<code>npm run test:e2e</code>', 'About 280 checks of real journeys across all roles, including the admin console, bulk upload and role changes', 'Dev server + seeded empty-ish DB'],
 ['Access matrix', '<code>npm run test:access</code>', 'Every protected page and API as every role and anonymous: allowed or blocked', 'Dev server + seed'],
 ['Accessibility', '<code>npm run test:a11y</code>', 'axe-core WCAG A/AA on every page and role at desktop and 375 px, no horizontal scroll', 'Dev server + seed'],
 ['Production smoke', '<code>npm run test:e2e:prod</code>', 'CSP, PWA/offline, Open Graph, contact form on a production build', 'Production build'],
 ['Rate limiter', '<code>npx tsx e2e/ratelimit.ts fill|check</code>', 'Atomicity and survival across process restarts (runs in CI)', 'DB'],
 ['Database down', '<code>node e2e/degraded.mjs</code>', 'Public pages degrade gracefully when the DB is unreachable', 'Dev server'],
]),
h.h3('Run the end-to-end suite step by step'),
h.ol([
 'Create a <b>clean</b> database: <code>DROP DATABASE IF EXISTS kalwings_e2e; CREATE DATABASE kalwings_e2e;</code> (a dirty database causes false failures).',
 'In your shell: <code>export DATABASE_URL=mysql://…/kalwings_e2e</code>, then <code>npx prisma migrate deploy</code> and <code>npm run db:seed</code>.',
 'Start the dev server on port 3000 in the same environment: <code>npm run dev -- -p 3000</code> (restart it whenever you recreate the database).',
 'If Playwright’s own browser is not installed, point at one: <code>export CHROMIUM_PATH=/path/to/chrome</code>. Do not run <code>playwright install</code> on a managed machine.',
 'Run <code>node e2e/platform.mjs</code>. It prints <code>PASS …</code> per check and <code>ALL PASSED</code> or <code>N FAILURE(S)</code> at the end. A full run takes about 8 minutes.',
]),
h.h3('Writing a new e2e check'),
h.ol(['Find the matching block in <code>e2e/platform.mjs</code> (they are grouped by feature with <code>// ---</code> headings). Sessions per role already exist (<code>student, mentor, employer, admin, anon</code>).', 'Find forms by <b>aria-label</b> (<code>admin.locator(\'form[aria-label="Add a plan"]\')</code>) and sections by their <code>aria-label</code>. This is why every form needs an accessible name.', 'Assert with <code>ok(condition, \'what it proves\')</code>.', 'Use unique names with the run’s <code>tag</code> so reruns do not collide.', 'After a mutation that re-renders, wait for the new state (<code>waitForSelector</code>), not a fixed delay.']),
h.h3('Known flake patterns and the fixes we use'),
h.table(['Symptom', 'Cause', 'Fix'], [
 ['Password form not found', 'Hydration not finished', 'Use the <code>openPasswordForm</code> helper (retries)'],
 ['Message not seen after click', 'Server action still running', '<code>waitUntil: "networkidle"</code> or wait for <code>p[role=status]</code>'],
 ['Lockout loop flaky', 'Alert not rendered yet', 'Wait for the alert each iteration'],
 ['Late sign-in refused', 'Per-IP code limit (20/hour) used up', 'New context with its own <code>x-forwarded-for</code>'],
 ['Required field blocks resubmit', 'A form that resets on success clears required inputs', 'Refill every required field before the next submit'],
 ['Success text vanishes', 'Page revalidates and swaps the form for another state', 'Assert the new state instead (for example “Waiting for an admin”)'],
]),
h.h3('Never do these to get a test green'),
h.p('Never skip, disable, loosen or quarantine a failing test, and never push an empty commit to re-run CI. Find the cause. A failure that passes on a second run is still a defect until you can explain it.'),

h.h2('B16', 'CI/CD, deploy, health and backups'),
h.h3('CI (GitHub Actions: <code>.github/workflows/ci.yml</code>)'),
h.p('Runs on every pull request and on pushes to main, on two databases in parallel (<code>verify (mysql-8)</code> and <code>verify (mariadb-10.11)</code>). Steps: install from the lockfile; <code>prisma validate</code>; apply all migrations; (MySQL only) schema-vs-migrations drift check; rate limiter test; embedded-migrations freshness; lint; typecheck; unit tests; build; start the server and check <code>/api/health</code>. The browser suites run locally, not in CI.'),
h.h3('Deploy'),
h.ol(['Open a pull request from a feature branch. Wait for both CI jobs to be green.', 'Merge into <code>main</code> (squash). Hostinger pulls, runs <code>npm run build</code> and starts the app with <code>npm start</code>.', 'On start the server applies pending migrations and logs <code>[migrate] ok</code>.', 'Open <code>/api/health</code>: expect <code>{"ok":true}</code>. Open Dashboard → Launch readiness.', '<b>Rollback:</b> revert the PR on GitHub (auto-deploys) or redeploy the previous commit from hPanel. Migrations do not roll back: fix forward.']),
h.h3('Health and monitoring'),
h.ul(['<code>GET /api/health</code> returns <code>{"ok":true}</code> or a safe failure category: <code>unreachable, auth_failed, unknown_database, bad_database_url, prisma_engine, too_many_connections</code>. Point an uptime monitor at it (1-minute check).', 'Unhandled server errors are stored (no personal data) and listed at Dashboard → Server errors.', 'If the database is down, public pages still serve; sign-in and dashboards show a friendly error.']),
h.h3('Backups and recovery'),
h.ul(['<code>DATABASE_URL=… npm run backup -- ./backups 14</code> writes a gzip dump and keeps the newest 14. Schedule it daily and copy files off the server. Enable Hostinger’s own database backups too.', 'Restore into a <b>new, empty</b> database first: <code>gunzip -c backups/FILE.sql.gz | mysql -h HOST -u USER -p DBNAME</code>, then confirm <code>npx prisma migrate status</code>, then switch <code>DATABASE_URL</code>. Test a restore before launch and quarterly.', 'Uploaded images live in the database, so they are covered.']),
h.h3('Routine maintenance'),
h.ul(['Rotate secrets every 6 to 12 months or after any exposure: new <code>AUTH_SECRET</code> (signs everyone out), mailbox password, database password.', 'Delete old rate-limit and error rows monthly (not scheduled yet): <code>DELETE FROM RateLimit WHERE resetAt &lt; NOW()</code>; <code>DELETE FROM ErrorLog WHERE createdAt &lt; NOW() - INTERVAL 30 DAY</code>.', 'Keep audit logs at least 12 months.', 'Review Dependabot pull requests weekly; run <code>npm audit</code> before launches.']),
h.h3('Incident checklist'),
h.ol(['Check <code>/api/health</code> and the runtime log.', 'If the database is unreachable the public site still serves; fix the connection.', 'Check recent deploys; roll back if the problem started with one.', 'Check Dashboard → Server errors.', 'Suspected data exposure: suspend affected accounts, rotate secrets, preserve logs, notify affected users as the law requires.']),

h.h2('B17', 'Working with Git and pull requests'),
h.ol(['Branch from an up-to-date <code>main</code>: <code>git fetch origin main &amp;&amp; git checkout -b feature/short-name origin/main</code>.', 'Make small, reviewable changes. Keep unrelated refactors out.', 'Before you push, run what CI runs: <code>npm run lint &amp;&amp; npm run typecheck &amp;&amp; npm run test:unit &amp;&amp; npm run build</code>, and the e2e suite for anything user-facing.', 'Write a commit message that says what and why in plain words.', 'Push and open a pull request. Describe what changed, what did not (for example “no schema change”), and how you tested. Mention any migration.', 'Wait for both CI jobs. Fix failures properly (B15). Merge only when you have approval; <b>ask before merging</b> and merge with squash.', 'Stacked PRs merge bottom-up. If two PRs conflict, merge <code>main</code> into your branch (do not rewrite shared history), resolve, retest.']),
h.warn('Never commit secrets, <code>.env</code>, database dumps or real people’s data. Never push sample-seeding changes that touch real users. The unseed command only ever removes sample data.'),

h.h2('B18', 'Troubleshooting for developers'),
h.table(['Symptom', 'Likely cause', 'Fix'], [
 ['Server fails at start: “AUTH_SECRET must be set”', 'Missing or short secret', 'Set a 32+ character <code>AUTH_SECRET</code>'],
 ['<code>/api/health</code> shows <code>auth_failed</code> / <code>unknown_database</code>', 'Wrong DATABASE_URL user, password or name', 'Fix the URL; URL-encode special characters; read the <code>[startup] database</code> line'],
 ['<code>[migrate] FAILED</code>', 'A migration cannot apply (permissions, conflicting object)', 'Read the logged statement; fix forward with a new migration; never edit an applied one'],
 ['CI: embedded migrations are stale', 'Changed <code>prisma/migrations</code> without regenerating', '<code>node scripts/embed-migrations.mjs</code> and commit <code>migrations.generated.ts</code>'],
 ['CI: schema drift on MySQL', 'Edited <code>schema.prisma</code> without a migration', 'Add the migration (B6)'],
 ['Dev server errors after recreating the DB', 'Server holds old connections', 'Restart <code>npm run dev</code>'],
 ['“Port 3000 already in use”', 'Old dev server', 'Stop it (<code>fuser -k 3000/tcp</code> on Linux) then restart'],
 ['E2E: many unrelated failures', 'Dirty database', 'Recreate the e2e database and reseed'],
 ['No sign-in code appears in dev', 'SMTP variables set locally', 'Unset them; dev shows the code on screen when no provider is configured'],
 ['Client build error about server-only code', 'A client component imports a server-only module (for example via a shared file)', 'Split the file: keep types or constants in a plain module; server code behind server components'],
 ['Admin cannot see new menu item', 'Item not in <code>modules.ts</code> or wrong section/role', 'Add it to the correct role array'],
 ['Uploaded file rejected', 'Over 1 MB, not PNG/JPEG/WebP, or wrong owner', 'Resize; check role rules in B12'],
]),

h.h2('B19', 'Glossary'),
h.table(['Term', 'Meaning'], [
 ['Server action', 'A server function a form calls directly; a public HTTP endpoint, so it must authorise itself'],
 ['Revalidate', 'Tell Next.js to refresh cached pages after a change (<code>revalidatePath</code>)'],
 ['Embedded migration', 'Migration SQL compiled into the build and applied at server start'],
 ['Drift', 'The database schema differs from what the migrations produce'],
 ['Capability URL', 'An unguessable URL that works without login (uploaded images)'],
 ['Sample data', 'Fake demo records created by the seed; always tagged “Sample”'],
 ['Moderated', 'The Opportunity field that says whether a listing is approved (VERIFIED) or waiting'],
 ['Meter', 'One of the four plan limits: listings, challenges, assessments, team'],
]),

h.h2('B20', 'Appendices (generated from the source tree)'),
h.h3('Appendix 1: Navigation by role'),
h.p('Source: <code>src/lib/modules.ts</code>. Roles map to the pages each role sees in the sidebar.'),
h.table(['Role', 'Label', 'Route'], navRows()),
h.h3('Appendix 2: Server actions by file'),
h.p('Source: <code>src/app/actions/*.ts</code>. Every function here must start with <code>requireActionRole</code> or be an intentionally public action (sign-in, contact form).'),
h.table(['File', 'Exported actions'], actionRows()),
h.h3('Appendix 3: HTTP route handlers'),
h.table(['Route', 'Methods'], apiRows()),
h.h3('Appendix 4: Where to read more'),
h.table(['Document', 'What it holds'], [
 ['<code>README.md</code>', 'Status of every area, setup, where to replace placeholders'],
 ['<code>DEPLOYMENT.md</code>', 'GitHub → Hostinger step by step, including the VPS option'],
 ['<code>docs/DATABASE.md</code>', 'Generated: every model, column and index (<code>npm run docs:db</code>)'],
 ['<code>docs/API.md</code>', 'Generated: server actions and routes (<code>npm run docs:api</code>)'],
 ['<code>docs/OPERATIONS.md</code>', 'Environment, deploy, health, backups, routine tasks, incidents, retention, release gates'],
 ['<code>docs/SECURITY.md</code>', 'Checklist with Done / Partly / Not done'],
 ['<code>docs/QUALITY.md</code>', 'Test evidence and known gaps'],
 ['<code>docs/FEATURES.md</code>', 'What each role can do and how overlapping features were merged'],
 ['<code>docs/ROADMAP.md</code>, <code>docs/PRD.md</code>', 'Phases and product requirements'],
]),
h.h3('Appendix 5: Known limitations and open items'),
h.ul(['<b>Not built:</b> SMS / mobile sign-in, online payments and invoicing, LLM features, file uploads for challenge submissions, a deployed code-execution sandbox, Sentry/analytics.', '<b>Untested against real services:</b> Google sign-in, a real Judge0 sandbox. Email is tested against a mock server and, in production, by Hostinger SMTP.', '<b>Wording:</b> product names in <code>modules.ts</code> are plain placeholders until the kalwings.com wording is supplied; a few older headings still say “Talent Card” or “Talent Passport”.', '<b>Logo:</b> the mark is redrawn in code from a supplied image; replace with the original file in <code>public/brand/</code> and <code>brand.tsx</code> when available (do not otherwise change the logo).', '<b>Data retention:</b> automated deletion of old rate-limit, OTP and error rows is documented but not scheduled.', '<b>Bulk upload:</b> templates are CSV (open in Excel); .xlsx and .csv are accepted; no .xls; 1,000 rows and 2 MB per file.', '<b>Accessibility:</b> automated axe checks pass; no manual screen-reader pass has been done.']),
].join('\n');
