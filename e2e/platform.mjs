import { chromium } from 'playwright-core';
import fs from 'fs';
// Optional: set MAIL_CAPTURE (and start the app with EMAIL_API_URL=<mock>, EMAIL_FROM) to also test notification emails.
const MAIL = process.env.MAIL_CAPTURE;
const lastMail = () => (MAIL && fs.existsSync(MAIL) ? JSON.parse(fs.readFileSync(MAIL, 'utf8')) : null);
// Run against `npm run dev` (OTP codes are only shown in dev). Needs the sample seed (admin@sample.kalwings.test).
const B = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const tag = Date.now().toString().slice(-6);
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

async function user() { const c = await b.newContext({ viewport: { width: 1300, height: 900 } }); const p = await c.newPage(); p.on('pageerror', e => { console.log('PAGEERROR', e.message); fails++; }); return p; }
async function auth(p, mode, id, { name, role } = {}) {
  await p.goto(`${B}/${mode}`);
  if (role) await p.selectOption('select[name=role]', role);
  await p.fill('input[name=identifier]', id);
  await p.click('button:has-text("Send one-time code")');
  await p.waitForSelector('input[name=code]');
  const code = (await p.locator('text=Your code is').locator('b').innerText()).trim();
  if (name) await p.fill('input[name=name]', name);
  await p.fill('input[name=code]', code);
  await p.click(mode === 'join' ? 'button:has-text("Create my account")' : 'button:has-text("Log in")');
  await p.waitForURL(/dashboard/);
}

const student = await user(), mentor = await user(), employer = await user(), admin = await user(), anon = await user();

// --- anon guards
await anon.goto(`${B}/dashboard`); ok(/\/login/.test(anon.url()), 'anon /dashboard -> /login');

// --- student joins + onboarding
await auth(student, 'join', `stu${tag}@example.com`, { name: `Test Student ${tag}`, role: 'STUDENT' });
ok(/onboarding/.test(student.url()), 'student lands on onboarding');
await student.fill('input[name=headline]', 'ECE final-year, embedded');
await student.fill('input[name=graduationYear]', '2026'); await student.fill('input[name=city]', 'Hyderabad');
await student.click('button:has-text("Next")');
await student.fill('input[name=skills]', 'Python, Embedded C, Circuit design');
await student.fill('textarea[name=bio]', 'I like building small robots and sensors that actually work.');
await student.click('button:has-text("Save & continue")');
await student.waitForSelector('input[name=title]');
await student.fill('input[name=title]', 'Line follower'); await student.fill('textarea[name=summary]', 'Built a PID line-following robot with custom PCB.');
await student.click('button:has-text("Add project & finish")');
await student.waitForURL(/\/dashboard$/);
ok(await student.locator('text=Profile completeness').count() > 0, 'student dashboard shows completeness');
const score = await student.locator('[role=progressbar]').getAttribute('aria-valuenow'); ok(+score >= 60, `completeness score computed (${score}%)`);

// --- forbidden role pages
await student.goto(`${B}/dashboard/moderation`); ok(!/moderation/.test(student.url()), 'student cannot open admin moderation');
await student.goto(`${B}/dashboard/pipeline`); ok(!/pipeline/.test(student.url()), 'student cannot open employer pipeline');

// --- mentor profile -> pending
await auth(mentor, 'join', `men${tag}@example.com`, { name: `Test Mentor ${tag}`, role: 'MENTOR' });
await mentor.goto(`${B}/dashboard/mentoring`);
await mentor.fill('input[name=roleTitle]', 'Staff Engineer'); await mentor.fill('input[name=company]', 'Acme'); await mentor.fill('input[name=country]', 'Germany'); await mentor.fill('input[name=domain]', 'Software');
await mentor.fill('input[name=tags]', 'Python, Embedded');
await mentor.click('button:has-text("Save")'); await mentor.waitForSelector('text=Saved');
await student.goto(`${B}/mentors`); ok(await student.locator(`text=Test Mentor ${tag}`).count() === 0, 'unverified mentor not listed publicly');

// --- employer company -> pending
await auth(employer, 'join', `emp${tag}@example.com`, { name: 'Test Employer', role: 'EMPLOYER' });
await employer.goto(`${B}/dashboard/company`);
await employer.fill('input[name=name]', `Acme Labs ${tag}`); await employer.fill('input[name=website]', 'https://acme.example.com');
await employer.click('button:has-text("Submit for verification")'); await employer.waitForSelector("text=We'll notify you");
await employer.goto(`${B}/dashboard/roles`); ok(await employer.locator('text=must be verified').count() > 0, 'unverified company cannot post');

// --- admin verifies both
await auth(admin, 'login', 'admin@sample.kalwings.test');
await admin.goto(`${B}/dashboard`);
const co = admin.locator('li', { hasText: `Acme Labs ${tag}` }); await co.locator('button:has-text("Verify")').click();
await admin.waitForTimeout(800); await admin.reload();
const mn = admin.locator('li', { hasText: `Test Mentor ${tag}` }); await mn.locator('button:has-text("Verify")').click();
await admin.waitForTimeout(800);
await admin.goto(`${B}/dashboard/plans?q=${encodeURIComponent('Acme Labs ' + tag)}`); await admin.locator('li', { hasText: `Acme Labs ${tag}` }).locator('button:text-is("Growth")').click(); await admin.waitForTimeout(1200);

// --- employer posts: validation, then valid
await employer.goto(`${B}/dashboard/roles`);
const fill = async (pay, monthly) => {
  await employer.fill('input[name=title]', `Embedded Intern ${tag}`); await employer.fill('textarea[name=description]', 'Work on firmware for our sensor line with a small friendly team.');
  await employer.fill('input[name=payText]', pay); await employer.fill('input[name=monthlyINR]', monthly); await employer.fill('input[name=location]', 'Hyderabad');
  await employer.fill('input[name=deadline]', '2027-03-01'); await employer.fill('input[name=eligibility]', '2026 graduates'); await employer.fill('input[name=gradYears]', '2026'); await employer.fill('input[name=skills]', 'Embedded C');
  await employer.click('button:has-text("Submit for review")');
};
await fill('Competitive', '0'); await employer.waitForSelector('form [role=alert]');
const alertText = await employer.locator('form [role=alert]').innerText(); console.log('  alert:', alertText); ok(alertText.includes('state the amount'), 'paid role without amount rejected (trust rule)');
await fill('₹18,000 / month', '18000'); await employer.waitForSelector('text=Submitted for review');
await student.goto(`${B}/opportunities`); ok(await student.locator(`text=Embedded Intern ${tag}`).count() === 0, 'pending listing not public');
await admin.goto(`${B}/dashboard/moderation`);
await admin.locator('li', { hasText: `Embedded Intern ${tag}` }).locator('button:has-text("Approve")').click(); await admin.waitForTimeout(800);
await student.goto(`${B}/opportunities?q=${encodeURIComponent('Embedded Intern ' + tag)}`); ok(await student.locator(`text=Embedded Intern ${tag}`).count() > 0, 'search by keyword finds the listing');
await student.goto(`${B}/opportunities?q=zzz-no-such-${tag}`); ok(await student.locator('text=Nothing matches').count() > 0, 'search with no match shows empty state');
await student.goto(`${B}/opportunities?type=FREELANCE&q=${encodeURIComponent('Embedded Intern ' + tag)}`); ok(await student.locator(`text=Embedded Intern ${tag}`).count() === 0, 'type filter excludes other types');
await student.goto(`${B}/opportunities?sort=deadline&page=999&pay=%27;DROP`); ok((await student.locator('h1').count()) > 0 && await student.locator('text=Something went wrong').count() === 0, 'hostile/out-of-range params do not crash');
await student.goto(`${B}/opportunities`); ok(await student.locator(`text=Embedded Intern ${tag}`).count() > 0, 'approved listing is public');
await student.goto(`${B}/mentors`); ok(await student.locator(`text=Test Mentor ${tag}`).count() > 0, 'verified mentor listed');

// --- apply
await student.goto(`${B}/opportunities`); await student.locator('article', { hasText: `Embedded Intern ${tag}` }).locator('a:has-text("View details")').click();
await student.click('button:has-text("Apply with my Talent Card")'); await student.waitForSelector('text=You\'ve applied');
ok(true, 'student applied');

// --- pipeline
await employer.goto(`${B}/dashboard/pipeline`);
ok(await employer.locator(`text=Test Student ${tag}`).count() > 0, 'employer sees applicant');
ok(await employer.locator('text=Contact private').count() > 0, 'student contact private by default');
await employer.click('button:has-text("Move to Under review")'); await employer.waitForTimeout(800);
await employer.reload();
await employer.click('button:has-text("Move to Shortlisted")'); await employer.waitForTimeout(800);
await employer.reload();
ok(await employer.locator(`section[aria-label=Shortlisted] >> text=Test Student ${tag}`).count() > 0, 'moved to Shortlisted');
if (MAIL) fs.rmSync(MAIL, { force: true });
await employer.locator('summary:has-text("Notes")').click();
await employer.fill('input[name=body]', 'Hi! Could we schedule a call?'); await employer.click('button:text-is("Send")'); await employer.waitForSelector('text=Sent');
await student.goto(`${B}/dashboard/applications`);
ok(await student.locator('text=Could we schedule a call').count() > 0, 'student sees employer message');
if (MAIL) {
  const m = lastMail();
  ok(!!m && m.body.to[0] === `stu${tag}@example.com` && /New message/.test(m.body.subject), 'employer message emails the student');
  const link = m?.body.text.match(/https?:\/\/\S+\/unsubscribe\?u=[^&\s]+&t=[a-f0-9]+/)?.[0];
  ok(!!link, 'email carries a one-click unsubscribe link');
  const bad = await student.goto(link.replace(/t=[a-f0-9]+/, 't=' + 'a'.repeat(32)));
  ok((await student.content()).includes("isn't valid") || (await student.content()).includes('isn&#x27;t valid'), 'forged unsubscribe token is rejected');
  await student.goto(link); await student.click('button:has-text("Turn off notification emails")'); await student.waitForTimeout(1000);
  fs.rmSync(MAIL, { force: true });
  await employer.fill('input[name=body]', 'Following up on my message.'); await employer.click('button:text-is("Send")'); await employer.waitForTimeout(1200);
  ok(lastMail() === null, 'no email after unsubscribing (in-app notification still created)');
  await student.goto(`${B}/dashboard/applications`);
}
await student.fill('input[name=body]', 'Yes, tomorrow works.'); await student.click('button:has-text("Send")'); await student.waitForSelector('text=Sent');

// --- mentor session + endorsement
await student.goto(`${B}/mentors`); await student.locator('article', { hasText: `Test Mentor ${tag}` }).locator('a').first().click();
await student.fill('input[name=topic]', 'Portfolio review'); await student.click('button:has-text("Send request")'); await student.waitForSelector('text=Request sent');
await mentor.goto(`${B}/dashboard/mentoring`);
await mentor.locator('li', { hasText: 'Portfolio review' }).locator('button:has-text("Accept")').click(); await mentor.waitForTimeout(800); await mentor.reload();
await mentor.locator('li', { hasText: 'Portfolio review' }).locator('button:has-text("Mark completed")').click(); await mentor.waitForTimeout(800); await mentor.reload();
await mentor.selectOption('select[name=studentId]', { index: 0 });
await mentor.fill('input[name=skill]', 'Embedded C'); await mentor.fill('textarea[name=text]', 'Clean firmware structure and careful debugging.'); await mentor.fill('input[name=evidence]', 'https://github.com/example/line-follower');
await mentor.click('button:has-text("Endorse")'); await mentor.waitForSelector('text=Endorsement published');

// --- talent card
await student.goto(`${B}/dashboard`); await student.click('a:has-text("View my Talent Card")'); await student.waitForURL(/\/talent\//); await student.waitForSelector('text=Evidence-backed skills');
const card = await student.content();
ok(card.includes('Embedded C') && card.includes('Clean firmware'), 'Talent Card shows verified skill + endorsement');
ok(!card.includes(`stu${tag}@example.com`), 'Talent Card does not leak email');
ok(await student.locator('svg[viewBox]').count() > 0 && card.includes('QR code'), 'Talent Card has QR');

// --- slot booking: no double-booking, release on decline, calendar file
await mentor.goto(`${B}/dashboard/mentoring`);
const when = (h) => { const d = new Date(Date.now() + h * 3600e3); d.setMinutes(0, 0, 0); const z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:00`; };
await mentor.fill('input[name=startsAt]', when(48)); await mentor.click('button:has-text("Add slot")'); await mentor.waitForSelector('text=Slot added');
const student2 = await user(); await auth(student2, 'join', `stu2${tag}@example.com`, { name: `Second Student ${tag}`, role: 'STUDENT' });
await student.goto(`${B}/mentors`); await student.locator('article', { hasText: `Test Mentor ${tag}` }).locator('a').first().click();
// first student already has an ACCEPTED/COMPLETED session -> allowed a new request only if none open
await student.fill('input[name=topic]', 'Mock interview'); await student.locator('input[name=slotId]:not([value=""])').first().check(); await student.click('button:has-text("Send request")'); await student.waitForSelector('text=Request sent');
await student2.goto(`${B}/mentors`); await student2.locator('article', { hasText: `Test Mentor ${tag}` }).locator('a').first().click();
ok(await student2.locator('input[name=slotId]:not([value=""])').count() === 0, 'booked slot no longer offered to others');
await mentor.goto(`${B}/dashboard/mentoring`); ok(await mentor.locator('li', { hasText: /booked/i }).count() > 0, 'mentor sees slot as booked');
await mentor.locator('li', { hasText: 'Mock interview' }).locator('button:has-text("Decline")').click(); await mentor.waitForTimeout(800);
await student2.reload(); ok(await student2.locator('input[name=slotId]:not([value=""])').count() > 0, 'declined request frees the slot');
await student2.fill('input[name=topic]', 'Career advice'); await student2.locator('input[name=slotId]:not([value=""])').first().check(); await student2.click('button:has-text("Send request")'); await student2.waitForSelector('text=Request sent');
await mentor.goto(`${B}/dashboard/mentoring`); await mentor.locator('li', { hasText: 'Career advice' }).locator('button:has-text("Accept")').click(); await mentor.waitForTimeout(800);
const ics = await student2.request.get(`${B}/api/sessions/${(await mentor.locator('a:has-text("Add to calendar")').first().getAttribute('href')).split('/')[3]}/ics`);
ok(ics.status() === 200 && (await ics.text()).includes('BEGIN:VEVENT'), 'accepted session downloads an .ics invite');
const anonIcs = await anon.request.get(`${B}/api/sessions/anything/ics`); ok(anonIcs.status() === 401, 'ics requires sign-in');
await student2.goto(`${B}/dashboard/mentoring`); await student2.on('dialog', (d) => d.accept()); await student2.locator('li', { hasText: 'Career advice' }).locator('button:has-text("Cancel")').click(); await student2.waitForTimeout(800);
await mentor.goto(`${B}/dashboard/mentoring`); ok(await mentor.locator('li', { hasText: /booked/i }).count() === 0, 'cancelling frees the slot');

// --- college: register -> admin verifies -> student opts in -> dashboard
const college = await user(); await auth(college, 'join', `col${tag}@example.com`, { name: 'College Admin', role: 'COLLEGE_ADMIN' });
await college.goto(`${B}/dashboard/college`); await college.fill('input[name=name]', `Test Institute ${tag}`); await college.fill('input[name=city]', 'Hyderabad');
await college.click('button:has-text("Submit for verification")'); await college.waitForSelector("text=We'll notify you");
await student.goto(`${B}/dashboard/profile`); ok(await student.locator(`option:has-text("Test Institute ${tag}")`).count() === 0, 'unverified college not selectable');
await admin.goto(`${B}/dashboard`); await admin.locator('li', { hasText: `Test Institute ${tag}` }).locator('button:has-text("Verify")').click(); await admin.waitForTimeout(800);
await student.reload(); await student.selectOption('select[name=collegeId]', { label: `Test Institute ${tag} — Hyderabad` }); await student.click('button:has-text("Save college")'); await student.waitForSelector('text=Saved');
await college.goto(`${B}/dashboard/college`); ok(await college.locator('text=Students joined').count() > 0, 'college dashboard shows stats once verified');
ok(await college.locator(`text=Test Student ${tag}`).count() === 0, 'student who has not consented is not listed');
await student.check('input[name=share]'); await student.click('button:has-text("Save college")'); await student.waitForTimeout(1200);
await college.reload(); ok(await college.locator(`text=Test Student ${tag}`).count() > 0, 'consenting student appears in roster');
ok(!(await college.content()).includes(`stu${tag}@example.com`), 'roster never shows student email');
await student.uncheck('input[name=share]'); await student.click('button:has-text("Save college")'); await student.waitForTimeout(1200);
await college.reload(); ok(await college.locator(`text=Test Student ${tag}`).count() === 0, 'withdrawing consent removes the student');
await college.goto(`${B}/dashboard/moderation`); ok(!/moderation/.test(college.url()), 'college admin cannot open admin pages');

// --- uploads: photos + screenshots stored in the DB, validated server-side
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const imgSrc = async (page, sel) => page.locator(sel).first().getAttribute('src');
await student.goto(`${B}/dashboard/profile`);
await student.setInputFiles('input[type=file][aria-label="Upload photo"]', { name: 'me.png', mimeType: 'image/png', buffer: PNG });
await student.waitForSelector('img[src^="/api/files/"]');
const av1 = await imgSrc(student, 'img[src^="/api/files/"]');
const f1 = await student.request.get(B + av1); ok(f1.status() === 200 && f1.headers()['content-type'] === 'image/jpeg' && /immutable/.test(f1.headers()['cache-control']), 'photo upload works and is served as a cached JPEG');
await student.reload(); await student.setInputFiles('input[type=file]', { name: 'me2.png', mimeType: 'image/png', buffer: PNG }); await student.waitForTimeout(1500); await student.reload();
const av2 = await imgSrc(student, 'img[src^="/api/files/"]');
ok(av2 && av2 !== av1 && (await student.request.get(B + av1)).status() === 404, 'replacing a photo deletes the old file');
const bad = await student.request.post(`${B}/api/upload`, { multipart: { kind: 'AVATAR', file: { name: 'evil.png', mimeType: 'image/png', buffer: Buffer.from('<script>alert(1)</script>') } } });
ok(bad.status() === 400, 'a non-image renamed .png is rejected (magic-byte check)');
const svg = await student.request.post(`${B}/api/upload`, { multipart: { kind: 'AVATAR', file: { name: 'x.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') } } });
ok(svg.status() === 400, 'SVG uploads are rejected');
const big = await student.request.post(`${B}/api/upload`, { multipart: { kind: 'AVATAR', file: { name: 'big.png', mimeType: 'image/png', buffer: Buffer.concat([PNG, Buffer.alloc(1_100_000)]) } } });
ok(big.status() === 413, 'oversize image is rejected (413)');
ok((await anon.request.post(`${B}/api/upload`, { multipart: { kind: 'AVATAR', file: { name: 'a.png', mimeType: 'image/png', buffer: PNG } } })).status() === 401, 'anonymous upload refused');
ok((await employer.request.post(`${B}/api/upload`, { multipart: { kind: 'AVATAR', file: { name: 'a.png', mimeType: 'image/png', buffer: PNG } } })).status() === 403, 'employer cannot upload a profile photo');
ok((await student.request.post(`${B}/api/upload`, { headers: { Origin: 'https://evil.example' }, multipart: { kind: 'AVATAR', file: { name: 'a.png', mimeType: 'image/png', buffer: PNG } } })).status() === 403, 'cross-site upload (CSRF) refused');
ok((await student.request.post(`${B}/api/upload`, { multipart: { kind: 'PROJECT', projectId: 'cl000000000000000000000000', file: { name: 'a.png', mimeType: 'image/png', buffer: PNG } } })).status() === 404, "cannot attach an image to someone else's / unknown project");
ok((await student.request.get(`${B}/api/files/doesnotexist`)).status() === 404, 'unknown file id is 404');
// project screenshot + Talent Card
await student.goto(`${B}/dashboard/portfolio`);
await student.setInputFiles('input[type=file][aria-label="Add screenshot"]', { name: 'shot.png', mimeType: 'image/png', buffer: PNG }); await student.waitForSelector('img[src^="/api/files/"]');
const shotUrl = await imgSrc(student, 'img[src^="/api/files/"]');
await student.goto(`${B}/dashboard`); await student.click('a:has-text("View my Talent Card")'); await student.waitForURL(/\/talent\//);
ok(await student.locator('img[alt^="Photo of Test Student"]').count() === 1 && await student.locator('img[alt^="Screenshot of"]').count() === 1, 'Talent Card shows photo and project screenshot');
// deleting the project removes its screenshot
await student.goto(`${B}/dashboard/portfolio`); student.once('dialog', (d) => d.accept()); await student.locator('button:has-text("Delete")').first().click(); await student.waitForTimeout(1200);
ok((await student.request.get(B + shotUrl)).status() === 404, 'deleting a project deletes its screenshot');
// mentor photo shows in the public directory
await mentor.goto(`${B}/dashboard/mentoring`); await mentor.setInputFiles('input[type=file][aria-label="Upload photo"]', { name: 'm.png', mimeType: 'image/png', buffer: PNG }); await mentor.waitForSelector('img[src^="/api/files/"]');
await student.goto(`${B}/mentors`); ok(await student.locator(`img[alt="Photo of Test Mentor ${tag}"]`).count() === 1, 'mentor photo appears in the directory');

// --- employer closes / reopens a listing
await student.goto(`${B}/opportunities`);
const oppHref = await student.locator('article', { hasText: `Embedded Intern ${tag}` }).locator('a:has-text("View details")').getAttribute('href');
await employer.goto(`${B}/dashboard/roles`); employer.once('dialog', (d) => d.accept());
await employer.locator('li', { hasText: `Embedded Intern ${tag}` }).locator('button:has-text("Close")').click(); await employer.waitForTimeout(1200);
await student.goto(`${B}/opportunities`); ok(await student.locator(`text=Embedded Intern ${tag}`).count() === 0, 'closed listing disappears from search');
await student.goto(B + oppHref); ok(await student.locator('text=Applications closed').count() > 0 && await student.locator('button:has-text("Apply with my Talent Card")').count() === 0, 'closed listing shows "Applications closed" and no Apply button');
await employer.goto(`${B}/dashboard/roles`);
await employer.locator('li', { hasText: `Embedded Intern ${tag}` }).locator('button:has-text("Reopen")').click(); await employer.waitForTimeout(1200);
await student.goto(`${B}/opportunities`); ok(await student.locator(`text=Embedded Intern ${tag}`).count() > 0, 'reopened listing is searchable again');

// --- hiring workspace: interviews, offers, hired, team, labels, analytics, aliases
const hcard = () => employer.locator('article', { hasText: `Test Student ${tag}` }).first();
await employer.goto(`${B}/dashboard/pipeline`);
await hcard().locator('summary:text-is("Interview")').click();
await hcard().locator('input[name=scheduledAt]').fill('2020-01-01T10:00'); await hcard().locator('input[name=detail]').fill('https://meet.example.com/x'); await hcard().locator('button:has-text("Schedule")').click();
await hcard().locator('p[role=alert]').waitFor(); ok((await hcard().locator('p[role=alert]').innerText()).includes('future'), 'interview in the past is refused');
await hcard().locator('input[name=scheduledAt]').fill('2030-01-15T10:00'); await hcard().locator('button:has-text("Schedule")').click(); await employer.waitForTimeout(1800);
await employer.reload(); ok(await employer.locator(`section[aria-label=Interview] >> text=Test Student ${tag}`).count() > 0, 'scheduling an interview moves the candidate to Interview');
await student.goto(`${B}/dashboard/interviews`); ok(await student.locator('text=https://meet.example.com/x').count() > 0, 'student sees the interview details');
const icsHref = await student.locator('a:has-text("Add to calendar")').first().getAttribute('href');
const icsRes = await student.request.get(B + icsHref); const icsTxt = await icsRes.text(); ok(icsRes.status() === 200 && icsTxt.includes('BEGIN:VCALENDAR') && icsTxt.includes('DTSTART:20300115T043000Z'), 'interview .ics is correct (10:00 IST = 04:30 UTC)');
ok((await anon.request.get(B + icsHref)).status() === 401, 'anonymous cannot download interview .ics');
ok((await mentor.request.get(B + icsHref)).status() === 404, 'unrelated user cannot download interview .ics');
await employer.goto(`${B}/dashboard/pipeline`); await hcard().locator('summary:text-is("Extend offer")').click();
await hcard().locator('textarea[name=summary]').fill('Embedded engineer, 6 LPA, Hyderabad, start Jan 2030'); await hcard().locator('button:has-text("Send offer")').click(); await employer.waitForTimeout(1800);
await student.goto(`${B}/dashboard/applications`); ok(await student.locator('text=Embedded engineer, 6 LPA').count() > 0 && await student.locator('button:has-text("Accept")').count() > 0, 'student sees the offer with Accept / Decline');
ok(await employer.locator('button:has-text("Mark hired")').count() === 0, 'cannot mark hired before the offer is accepted');
student.once('dialog', (d) => d.accept()); await student.locator('button:has-text("Accept")').first().click(); await student.waitForTimeout(1500);
await employer.goto(`${B}/dashboard/pipeline`); ok(await employer.locator('button:has-text("Mark hired")').count() > 0, 'accepted offer enables Mark hired');
employer.once('dialog', (d) => d.accept()); await employer.locator('button:has-text("Mark hired")').first().click(); await employer.waitForTimeout(1500);
await employer.reload(); ok(await employer.locator(`section[aria-label=Hired] >> text=Test Student ${tag}`).count() > 0, 'candidate reaches Hired');
await employer.goto(`${B}/dashboard/analytics`); ok(await employer.locator('text=Offers accepted').count() > 0 && await employer.locator('text=By listing').count() > 0, 'analytics shows real funnel numbers');
// team
await employer.goto(`${B}/dashboard/company`); await employer.fill('input[name=email]', `team${tag}@example.com`); await employer.click('button:has-text("Send invitation")'); await employer.waitForSelector('text=Invitation saved');
const rec2 = await user(); await auth(rec2, 'join', `team${tag}@example.com`, { name: `Team Member ${tag}`, role: 'EMPLOYER' });
await rec2.goto(`${B}/dashboard/company`); await rec2.click(`button:has-text("Join")`); await rec2.waitForSelector('text=Recruiting team');
await rec2.goto(`${B}/dashboard/pipeline`); ok(await rec2.locator('section[aria-label=Hired]').count() > 0, 'invited recruiter joins the company and sees its pipeline');
const rec3 = await user(); await auth(rec3, 'join', `nobody${tag}@example.com`, { name: 'Outside Recruiter', role: 'EMPLOYER' });
await rec3.goto(`${B}/dashboard/pipeline`); ok(await rec3.locator(`text=Test Student ${tag}`).count() === 0, 'recruiter from another company cannot see this pipeline');
await employer.goto(`${B}/dashboard/company`); employer.once('dialog', (d) => d.accept()); await employer.locator('li', { hasText: `Team Member ${tag}` }).locator('button:has-text("Remove")').click(); await employer.waitForTimeout(1500);
await rec2.goto(`${B}/dashboard/pipeline`); ok(await rec2.locator(`text=Test Student ${tag}`).count() === 0, 'removed recruiter loses access');
// custom stage names
await employer.goto(`${B}/dashboard/company`); await employer.fill('input[name=UNDER_REVIEW]', 'Screening'); await employer.click('button:has-text("Save names")'); await employer.waitForSelector('text=Saved');
await employer.goto(`${B}/dashboard/pipeline`); ok(await employer.locator('section[aria-label=Screening]').count() > 0, 'custom stage names show in the pipeline');
await employer.goto(`${B}/dashboard/company`); await employer.fill('input[name=UNDER_REVIEW]', ''); await employer.click('button:has-text("Save names")'); await employer.waitForSelector('text=Saved');
// route aliases
await anon.goto(`${B}/recruiter/analytics`); ok(/\/login/.test(anon.url()), '/recruiter/analytics forwards to the protected dashboard (login first)');
await anon.goto(`${B}/jobs`); ok(anon.url().includes('/opportunities?type=JOB'), '/jobs forwards to filtered opportunities');

// --- challenge-to-hire: create, moderate, discover, submit, review, shortlist, evidence
const chTitle = `Sensor Dashboard ${tag}`; const chDeadline = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
await employer.goto(`${B}/dashboard/roles`); ok(await employer.locator('option[value=CHALLENGE]').count() === 0, 'challenges are created under Challenges, not the plain role form');
await employer.goto(`${B}/dashboard/challenges`);
const fillCh = async (rubric) => {
  await employer.fill('input[name=title]', chTitle); await employer.fill('textarea[name=description]', 'Build a small dashboard that visualises noisy sensor data and explains the trade-offs you made.');
  await employer.fill('textarea[name=brief]', 'You get a CSV of temperature readings with gaps and spikes. Clean it, chart it, and explain your approach in a short write-up.');
  await employer.fill('textarea[name=rubric]', rubric); await employer.fill('input[name=skillTag]', 'Data Viz');
  await employer.check('input[name=unpaid]'); await employer.fill('input[name=payText]', 'Unpaid, certificate only'); await employer.fill('input[name=location]', 'Pan-India'); await employer.fill('input[name=eligibility]', 'Final-year and recent graduates'); await employer.fill('input[name=deadline]', chDeadline);
  await employer.click('button:has-text("Submit for moderation")');
};
await fillCh('only one line'); await employer.waitForSelector('p[role=alert]'); ok((await employer.locator('p[role=alert]').first().innerText()).toLowerCase().includes('rubric') || (await employer.locator('p[role=alert]').first().innerText()).includes('criteri'), 'rubric with fewer than 2 criteria is refused');
await fillCh('Correctness | 40 | Cleans the data properly\nClarity | 30 | Chart is readable\nWrite-up | 30 | Explains trade-offs'); await employer.waitForSelector('text=Submitted. It goes live');
await student.goto(`${B}/challenges`); ok(await student.locator(`text=${chTitle}`).count() === 0, 'unmoderated challenge is not public');
await admin.goto(`${B}/dashboard/moderation`); await admin.locator('li', { hasText: chTitle }).locator('button:has-text("Approve")').click(); await admin.waitForTimeout(1500);
let chListed = false; for (let i = 0; i < 8 && !chListed; i++) { await student.goto(`${B}/challenges`); chListed = (await student.locator(`text=${chTitle}`).count()) > 0; if (!chListed) await student.waitForTimeout(1500); }
ok(chListed, 'approved challenge is listed on /challenges');
await student.locator(`a:has-text("${chTitle}")`).first().click(); await student.waitForURL(/\/challenges\/[a-z0-9]+$/);
const chUrl = student.url(); const chOppId = chUrl.split('/').pop();
ok(await student.locator('text=How it is judged').count() > 0 && await student.locator('td:has-text("Correctness")').count() > 0, 'challenge page shows the brief and rubric');
await student.goto(`${B}/opportunities/${chOppId}`); ok(student.url().endsWith(`/challenges/${chOppId}`), 'opportunity URL for a challenge redirects to the challenge page');
await student.fill('input[name=title]', 'My dashboard'); await student.fill('textarea[name=summary]', 'I interpolated the gaps, removed spikes with a rolling median, and charted the result with annotations.'); await student.fill('input[name=workUrl]', 'https://github.com/example/dashboard');
await student.click('button:has-text("Submit")'); await student.waitForSelector('text=Submission saved');
await student.fill('input[name=title]', 'My dashboard v2'); await student.click('button:has-text("Update submission")'); await student.waitForSelector('text=Submission saved');
await employer.goto(`${B}/dashboard/challenges`); await employer.locator(`a:has-text("${chTitle}")`).click(); await employer.waitForSelector('text=My dashboard v2');
ok(await employer.locator('text=1 submission').count() > 0, 'resubmitting updates the same submission (one per candidate)');
const rec3b = await rec3.goto(`${B}/dashboard/challenges/anything`); ok(rec3b.status() === 404 || /dashboard/.test(rec3.url()), 'unrelated recruiter cannot open a challenge review page');
await employer.locator('summary:has-text("Review and score")').click();
await employer.fill('input[name=p0]', '999'); await employer.fill('input[name=p1]', '20'); await employer.fill('input[name=p2]', '25'); await employer.fill('textarea[name=feedback]', 'Good cleaning approach; the chart needs clearer axes.');
await employer.selectOption('select[name=outcome]', 'SHORTLISTED'); await employer.check('input[name=awardSkill]'); await employer.evaluate(() => document.querySelectorAll('input[name=p0]').forEach((i) => i.removeAttribute('max'))); await employer.click('button:has-text("Save review")'); await employer.waitForSelector('p[role=alert]');
ok((await employer.locator('p[role=alert]').first().innerText()).includes('0 to 40'), 'rubric points above the maximum are refused');
await employer.fill('input[name=p0]', '35'); await employer.click('button:has-text("Save review")'); await employer.waitForSelector('text=Saved');
await student.goto(`${B}/dashboard/submissions`); const subTxt = await student.locator('main, body').first().innerText(); ok(subTxt.includes('80/100') && subTxt.includes('chart needs clearer axes'), 'candidate sees rubric score and feedback');
await student.goto(`${B}/dashboard/applications`); ok(await student.locator(`text=${chTitle}`).count() > 0, 'shortlisting adds the candidate to the hiring pipeline');
await student.goto(`${B}/dashboard/passport`); const key2 = (await student.locator('a[href^="/talent/"]').first().getAttribute('href')); await anon.goto(B + key2);
ok(await anon.locator('li:has-text("Data Viz")').count() > 0 && (await anon.locator('summary:has-text("Why these are shown")').count()) > 0, 'awarded skill appears on the Passport as evidence-backed with a reason');
await student.goto(chUrl); ok(await student.locator('text=Your submission was reviewed').count() > 0 && await student.locator('button:has-text("Update submission")').count() === 0, 'reviewed submissions cannot be edited');

// --- assessments: written (always) and coding (needs E2E_SANDBOX=1 with SANDBOX_URL -> e2e/mock-sandbox.mjs)
const wTitle = `Churn Case ${tag}`;
await employer.goto(`${B}/dashboard/assessments`);
await employer.fill('input[name=title]', wTitle); await employer.fill('textarea[name=instructions]', 'Answer each question in a few sentences. We are looking for clear reasoning, not buzzwords.');
await employer.fill('textarea[name=items]', 'How would you reduce churn for a student app? | 20\nWhat would you measure first? | 10'); await employer.click('button:has-text("Publish assessment")'); await employer.waitForSelector('text=Published');
await student.goto(`${B}/dashboard/assessments`); ok(await student.locator(`text=${wTitle}`).count() > 0, 'student sees the open written assessment');
await student.locator(`a:has-text("${wTitle}")`).click(); await student.waitForSelector('text=Your answers'); const asmId = student.url().split('/').pop();
await student.fill('textarea[name=a0]', 'Find where students drop off, talk to them, and fix the onboarding step that loses most people.'); await student.fill('textarea[name=a1]', 'Day-7 retention and the share of profiles completed.'); await student.click('button:has-text("Submit answers")'); await student.waitForSelector('text=Submitted');
await student.reload(); ok(await student.locator('text=You have submitted this assessment').count() > 0, 'written assessment can be submitted only once');
ok((await rec3.goto(`${B}/dashboard/assessments/${asmId}`)).status() === 404, 'unrelated recruiter cannot open another company\'s assessment');
await employer.goto(`${B}/dashboard/assessments/${asmId}`); await employer.locator('summary:has-text("Read and score")').click();
await employer.fill('input[name=p0]', '15'); await employer.fill('input[name=p1]', '8'); await employer.fill('textarea[name=feedback]', 'Solid reasoning; next time quantify the drop-off.'); await employer.click('button:has-text("Save review")'); await employer.waitForSelector('text=Saved');
await student.goto(`${B}/dashboard/assessments/${asmId}`); ok((await student.locator('body').innerText()).includes('23/30') && (await student.locator('body').innerText()).includes('quantify the drop-off'), 'candidate sees score and feedback for a written assessment');
if (process.env.E2E_SANDBOX) {
  const cTitle = `Sum Two ${tag}`;
  await employer.goto(`${B}/dashboard/assessments`); await employer.selectOption('select[name=kind]', 'CODING');
  await employer.fill('input[name=title]', cTitle); await employer.fill('textarea[name=instructions]', 'Read two integers from standard input and print their sum on one line.');
  await employer.fill('textarea[name=items]', '3 4\n=>\n7\n###\n[hidden]\n10 5\n=>\n15'); await employer.check('input[value=javascript]'); await employer.click('button:has-text("Publish assessment")'); await employer.waitForSelector('text=Published');
  await student.goto(`${B}/dashboard/assessments`); await student.locator(`a:has-text("${cTitle}")`).click(); await student.waitForSelector('textarea#code');
  ok(await student.locator('text=Hidden tests never show').count() > 0 && (await student.locator('body').innerText()).includes('3 4') && !(await student.locator('body').innerText()).includes('10 5'), 'sample tests visible, hidden test inputs never shown');
  await student.fill('textarea#code', 'console.log("wrong")'); await student.click('button:has-text("Run samples")'); await student.waitForSelector('text=0/1 tests passed');
  ok(await student.locator('text=Wrong answer').count() > 0 && await student.locator('text=expected').count() > 0, 'failing sample shows expected vs got');
  await student.fill('textarea#code', 'while(true){}'); await student.click('button:has-text("Run samples")'); await student.waitForSelector('text=Time limit exceeded');
  ok(true, 'infinite loop is stopped by the time limit');
  await student.fill('textarea#code', 'const [a,b]=require("fs").readFileSync(0,"utf8").trim().split(/\\s+/).map(Number);console.log(a+b)');
  await student.click('button:has-text("Submit (runs all tests)")'); await student.waitForSelector('text=2/2 tests passed'); await student.waitForSelector('text=Attempt saved');
  ok(!(await student.locator('body').innerText()).includes('10 5'), 'hidden test results never reveal input after submit');
  await student.reload(); ok((await student.locator('body').innerText()).includes('2/2'), 'attempt appears in submission history');
  await employer.goto(`${B}/dashboard/assessments`); await employer.locator(`a:has-text("${cTitle}")`).click(); await employer.waitForSelector('text=View code');
  ok(await employer.locator('text=2/2').count() > 0, 'employer sees the candidate result and code');
} else {
  await employer.goto(`${B}/dashboard/assessments`); ok(await employer.locator('option[value=CODING]').count() === 0, 'coding assessments cannot be created when no sandbox is configured');
  await student.goto(`${B}/dashboard/assessments`); ok(await student.locator('text=switched off until a secure code runner').count() > 0, 'students are told coding is off without a sandbox');
}

// --- community: groups, posts, comments, teammates, reports, blocking, moderation
const gName = `Robotics Club ${tag}`;
await student.goto(`${B}/community`); await student.fill('input[name=name]', gName); await student.fill('textarea[name=description]', 'Sensors, motors and the bugs we hit while building them.'); await student.click('button:has-text("Create group")'); await student.waitForSelector('text=Group created');
await anon.goto(`${B}/community`); ok(await anon.locator(`text=${gName}`).count() > 0, 'group directory is public');
const gHref = await anon.locator(`a:has-text("${gName}")`).first().getAttribute('href');
await anon.goto(B + gHref); ok(/\/login/.test(anon.url()), 'group posts need sign-in');
const gp = (pg) => pg.locator('section[aria-label="New post"]');
await student.goto(B + gHref); await gp(student).locator('select[name=kind]').selectOption('QUESTION'); await gp(student).locator('input[name=title]').fill(`Debugging I2C ${tag}`); await gp(student).locator('textarea[name=body]').fill('My sensor only answers after a power cycle. What should I check first?'); await gp(student).locator('input[name=tags]').fill('I2C, Embedded');
await gp(student).locator('button:text-is("Post")').click(); await student.waitForSelector(`text=Debugging I2C ${tag}`, { timeout: 15000 });
await gp(student).locator('select[name=kind]').selectOption('PROJECT_CALL'); await gp(student).locator('input[name=title]').fill(`Need a CAD partner ${tag}`); await gp(student).locator('textarea[name=body]').fill('Building a gripper arm and I need someone who can model the housing.'); await gp(student).locator('input[name=tags]').fill('CAD');
await gp(student).locator('button:text-is("Post")').click(); await student.waitForSelector(`text=Need a CAD partner ${tag}`, { timeout: 15000 });
await student2.goto(B + gHref); await student2.click('button:has-text("Join group")'); await student2.waitForSelector('section[aria-label="New post"]', { timeout: 15000 });
const art = (pg, t) => pg.locator('article', { hasText: t });
await art(student2, `Debugging I2C ${tag}`).locator('summary:has-text("comment")').click(); await art(student2, `Debugging I2C ${tag}`).locator('textarea[name=body]').fill('Check the pull-up resistors and the address.'); await art(student2, `Debugging I2C ${tag}`).locator('button:text-is("Comment")').click(); await student2.waitForSelector('text=Posted');
await student2.reload(); ok(await student2.locator('text=1 comment').count() > 0, 'members can comment');
await employer.goto(B + gHref); ok(await employer.locator(`text=Debugging I2C ${tag}`).count() > 0 && await employer.locator('section[aria-label="New post"]').count() === 0, 'recruiters can read but not post');
await student2.goto(`${B}/community/teammates?skill=cad`); ok(await student2.locator(`text=Need a CAD partner ${tag}`).count() > 0, 'teammate search finds project calls by skill');
await student2.goto(`${B}/community/teammates?skill=zzzz`); ok(await student2.locator(`text=Need a CAD partner ${tag}`).count() === 0, 'teammate search filters by skill');
// report + admin moderation
await student2.goto(B + gHref); await art(student2, `Need a CAD partner ${tag}`).locator('summary:text-is("Report")').click(); await art(student2, `Need a CAD partner ${tag}`).locator('textarea[name=reason]').fill('This looks like an advert, not a project.'); await art(student2, `Need a CAD partner ${tag}`).locator('button:has-text("Send report")').click(); await student2.waitForSelector('text=Thanks, our team');
await admin.goto(`${B}/dashboard/reports`); await admin.locator('li', { hasText: 'This looks like an advert' }).first().locator('button:has-text("Hide content")').click(); await admin.waitForTimeout(3000);
await student2.goto(B + gHref, { waitUntil: "networkidle" }); ok(await student2.locator(`text=Need a CAD partner ${tag}`).count() === 0, 'hidden post disappears for other members');
await student.goto(B + gHref); ok(await student.locator(`text=Need a CAD partner ${tag}`).count() > 0 && await student.locator('text=Hidden').count() > 0, 'group moderator still sees hidden content, marked as hidden');
// moderator hides a comment
await art(student, `Debugging I2C ${tag}`).locator('summary:has-text("comment")').click(); await art(student, `Debugging I2C ${tag}`).locator('li:has-text("pull-up") button:has-text("Hide")').click(); await student.waitForTimeout(1500);
await student2.goto(B + gHref); ok(await student2.locator('text=Check the pull-up').count() === 0, 'moderator can hide a comment');
// blocking
await art(student2, `Debugging I2C ${tag}`).locator('button:has-text("Block author")').click(); await student2.waitForTimeout(1500);
await student2.goto(B + gHref); ok(await student2.locator(`text=Debugging I2C ${tag}`).count() === 0, 'blocking an author hides their posts from you');
await student.goto(B + gHref); ok(await student.locator(`text=Debugging I2C ${tag}`).count() > 0, 'the blocked author still sees their own post');
// admin archive
admin.once('dialog', (d) => d.accept()); await admin.goto(B + gHref); await admin.click('button:has-text("Archive group")'); await admin.waitForTimeout(1500);
ok((await student.goto(B + gHref)).status() === 404, 'archived group is gone for members');
await anon.goto(`${B}/community`); ok(await anon.locator(`text=${gName}`).count() === 0, 'archived group leaves the directory');

// --- college portal: departments, drives, eligibility, consent, outcomes, reports
const dept = `Electronics ${tag}`;
await college.goto(`${B}/dashboard/college`); await college.fill('input[name=name]', dept); await college.click('button:has-text("Add department")'); await college.waitForSelector(`text=${dept}`);
await student.goto(`${B}/dashboard/profile`); await student.check('input[name=share]'); await student.click('button:has-text("Save college")'); await student.waitForTimeout(1500);
await student.reload(); await student.selectOption('select[name=departmentId]', { label: dept }); await student.click('button:has-text("Save department")'); await student.waitForSelector('text=Saved');
const dTitle = `Campus Drive ${tag}`;
await college.goto(`${B}/dashboard/drives`); await college.selectOption('select[name=companyId]', { label: `Acme Labs ${tag}` }); await college.fill('input[name=title]', dTitle);
await college.fill('textarea[name=description]', 'Hiring embedded interns. Aptitude round then interviews on campus.'); await college.fill('input[name=driveDate]', new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10)); await college.fill('input[name=gradYears]', '2026'); await college.check(`input[name=departmentIds]`);
await college.click('button:has-text("Propose to company")'); await college.waitForSelector('text=Proposed.');
await college.reload(); await college.locator(`a:has-text("${dTitle}")`).click(); await college.waitForSelector('text=Waiting for Acme Labs');
ok(await college.locator('button:has-text("Invite eligible students")').count() === 0, 'students cannot be invited before the company confirms');
await student.goto(`${B}/dashboard/drives`); ok(await student.locator(`text=${dTitle}`).count() === 0, 'no invitation before confirmation');
await employer.goto(`${B}/dashboard/drives`); await employer.locator('section', { hasText: dTitle }).locator('button:has-text("Confirm")').click(); await employer.waitForTimeout(1500);
await college.reload(); await college.locator('button:has-text("Invite eligible students")').click(); await college.waitForSelector(`text=Test Student ${tag}`);
await student.goto(`${B}/dashboard/drives`); ok(await student.locator(`text=${dTitle}`).count() > 0 && await student.locator('button:has-text("Accept and share")').count() > 0, 'opted-in eligible student is invited');
await student2.goto(`${B}/dashboard/drives`); ok(await student2.locator(`text=${dTitle}`).count() === 0, 'students outside the college or criteria are not invited');
await employer.goto(`${B}/dashboard/drives`); await employer.locator('section', { hasText: dTitle }).locator('a:has-text("Participants")').click(); ok(await employer.locator(`text=Test Student ${tag}`).count() === 0, 'company sees no student before they accept');
await student.locator('button:has-text("Accept and share")').click(); await student.waitForTimeout(1500);
await employer.reload(); ok(await employer.locator(`text=Test Student ${tag}`).count() > 0 && await employer.locator('a:has-text("Talent Passport")').count() > 0, 'company sees a student only after they accept');
ok(!(await employer.content()).includes(`stu${tag}@example.com`), 'drive participants never expose email');
await employer.locator('button:text-is("shortlisted")').click(); await employer.waitForTimeout(1500);
await student.goto(`${B}/dashboard/drives`); ok(await student.locator('text=shortlisted').count() > 0, 'student sees the drive outcome');
const dUrl = college.url();
await college.goto(`${B}/dashboard/drives`); await college.locator(`a:has-text("${dTitle}")`).click(); await college.waitForURL(/\/drives\/[a-z0-9]+$/); await college.waitForSelector('text=Declined'); ok(await college.locator('li >> text=shortlisted').count() > 0, 'college sees outcomes for participating students');
ok((await rec3.goto(`${B}/dashboard/drives/${dUrl.split('/').pop()}`)).status() === 404, 'unrelated recruiter cannot open a drive');
const rep = await college.request.get(`${B}/api/college/report?type=roster`); const repTxt = await rep.text();
ok(rep.status() === 200 && (rep.headers()['content-type'] || '').includes('text/csv') && repTxt.includes(`Test Student ${tag}`) && repTxt.includes(dept) && !repTxt.includes('@example.com'), 'roster CSV includes opted-in students, no emails');
const rep2 = await college.request.get(`${B}/api/college/report?type=drives`); ok((await rep2.text()).includes(dTitle), 'drives CSV lists the drive');
ok((await student.request.get(`${B}/api/college/report?type=roster`)).status() === 403 && (await anon.request.get(`${B}/api/college/report?type=roster`)).status() === 403, 'reports are blocked for students and anonymous users');
await student.goto(`${B}/dashboard/profile`, { waitUntil: 'networkidle' }); await student.uncheck('input[name=share]'); await student.click('button:has-text("Save college")'); await student.waitForSelector('p[role=status]'); await student.waitForTimeout(500);
const rep3 = await college.request.get(`${B}/api/college/report?type=roster`); ok(!(await rep3.text()).includes(`Test Student ${tag}`), 'withdrawing consent removes the student from reports');

// --- copilot: explainable recommendations, profile review, NL search, talent match notes, JD check, privacy in talent search
const post = async (title, skills, years) => {
  await employer.goto(`${B}/dashboard/roles`);
  await employer.fill('input[name=title]', title); await employer.fill('textarea[name=description]', 'You will work on firmware for our sensor line with a small team. We use an assignment and two interview rounds.');
  await employer.fill('input[name=payText]', '₹10,000 / month'); await employer.fill('input[name=monthlyINR]', '10000'); await employer.fill('input[name=location]', 'Hyderabad');
  await employer.fill('input[name=deadline]', '2027-03-01'); await employer.fill('input[name=eligibility]', 'Graduates'); await employer.fill('input[name=gradYears]', years); await employer.fill('input[name=skills]', skills);
  await employer.click('button:has-text("Submit for review")'); await employer.waitForSelector('text=Submitted for review');
  await admin.goto(`${B}/dashboard/moderation`); await admin.locator('li', { hasText: title }).locator('button:has-text("Approve")').click(); await admin.waitForTimeout(1200);
};
const fwTitle = `Firmware Intern ${tag}`, futTitle = `Future Intern ${tag}`;
await post(fwTitle, 'Embedded C, RTOS', '2026'); await post(futTitle, 'Embedded C', '2031');
await employer.goto(`${B}/dashboard/talent`); const fwIdPub = await employer.locator(`select[name=opp] option:has-text("${fwTitle}")`).getAttribute('value');
await student.goto(`${B}/dashboard/copilot?listing=${fwIdPub}`);
const cp = await student.locator('main, body').first().innerText();
ok(cp.includes(fwTitle) && cp.includes('Evidence-backed: Embedded C') && cp.includes('Not found on the profile: RTOS'), 'recommendation explains matched (evidence-backed) and missing skills');
await student.goto(`${B}/dashboard/copilot`); ok(!(await student.locator('main, body').first().innerText()).includes(futTitle), 'listings for a different graduation year are not recommended');
await student.goto(`${B}/dashboard/copilot?listing=${fwIdPub}`);
ok(await student.locator('summary:has-text("How to close the gap")').count() > 0 && await student.locator('summary:has-text("Practice questions")').count() > 0, 'gap tips and practice questions are offered');
ok(await student.locator('text=Profile review').count() > 0, 'profile review is shown');
await anon.goto(`${B}/opportunities?nl=${encodeURIComponent('remote internship paid')}`); ok(/type=INTERNSHIP/.test(anon.url()) && /mode=REMOTE/.test(anon.url()) && /pay=paid/.test(anon.url()) && await anon.locator('text=We read that as').count() > 0, 'natural-language search maps onto filters and says how it was read');
await anon.goto(`${B}/opportunities?nl=${encodeURIComponent('<script>alert(1)</script> ;;; DROP')}`); ok(await anon.locator('h1').count() > 0, 'hostile natural-language input does not break the page');
await employer.goto(`${B}/dashboard/talent?q=ECE`); const seen = await employer.locator(`text=Test Student ${tag}`).count() > 0;
const fwId = await employer.locator(`select[name=opp] option:has-text("${fwTitle}")`).getAttribute('value');
await employer.goto(`${B}/dashboard/talent?q=ECE&opp=${fwId}&sort=match`); ok(seen && (await employer.locator('[data-testid=match-note]').first().innerText()).includes('Evidence-backed: Embedded C'), 'talent search explains the match against a listing');
await student.goto(`${B}/dashboard/passport`); await student.selectOption('select[name=passportVisibility]', 'PRIVATE'); await student.click('button:has-text("Save privacy")'); await student.waitForSelector('text=Saved');
await employer.goto(`${B}/dashboard/talent?q=ECE`); ok(await employer.locator(`text=Test Student ${tag}`).count() === 0, 'private Passports never appear in recruiter search');
await student.goto(`${B}/dashboard/passport`); await student.selectOption('select[name=passportVisibility]', 'PUBLIC'); await student.click('button:has-text("Save privacy")'); await student.waitForSelector('text=Saved');
await employer.goto(`${B}/dashboard/jd-check`); await employer.fill('textarea#jd', 'Join our team! Pay a registration fee of 500 and we guarantee a job. Message us on WhatsApp.'); await employer.click('button:has-text("Check description")');
ok(await employer.locator('text=Not allowed').count() >= 2, 'JD check flags fees and guaranteed-job promises');
await student.goto(`${B}/dashboard/jd-check`); ok(!/jd-check/.test(student.url()), 'students cannot open the recruiter JD check');

// --- plans: limits are enforced server-side; admins assign plans; insights are admin-only
const lim = await user(); await auth(lim, 'join', `lim${tag}@example.com`, { name: 'Starter Recruiter', role: 'EMPLOYER' });
await lim.goto(`${B}/dashboard/company`); await lim.fill('input[name=name]', `Starter Co ${tag}`); await lim.fill('input[name=website]', 'https://starter.example.com'); await lim.click('button:has-text("Submit for verification")'); await lim.waitForSelector("text=We'll notify you");
await admin.goto(`${B}/dashboard`); await admin.locator('li', { hasText: `Starter Co ${tag}` }).locator('button:has-text("Verify")').click(); await admin.waitForTimeout(1200);
for (let i = 1; i <= 4; i++) {
  await lim.goto(`${B}/dashboard/roles`); await lim.fill('input[name=title]', `Starter Role ${i} ${tag}`); await lim.fill('textarea[name=description]', 'A small role used to test plan limits, with enough text to pass validation.');
  await lim.fill('input[name=payText]', '₹10,000 / month'); await lim.fill('input[name=monthlyINR]', '10000'); await lim.fill('input[name=location]', 'Pune'); await lim.fill('input[name=deadline]', '2027-03-01'); await lim.fill('input[name=eligibility]', 'Graduates');
  await lim.click('button:has-text("Submit for review")');
  if (i < 4) await lim.waitForSelector('text=Submitted for review'); else { await lim.waitForSelector('form [role=alert]'); ok((await lim.locator('form [role=alert]').innerText()).includes('Starter plan allows 3'), 'Starter plan refuses a 4th active listing'); }
}
await lim.goto(`${B}/dashboard/company`); ok(await lim.locator('text=Starter plan').count() > 0 && await lim.locator('text=3 / 3').count() > 0, 'company page shows plan usage');
await lim.fill('input[name=email]', `a${tag}@example.com`); await lim.click('button:has-text("Send invitation")'); await lim.waitForSelector('text=Invitation saved');
await lim.fill('input[name=email]', `b${tag}@example.com`); await lim.click('button:has-text("Send invitation")'); await lim.waitForSelector('p[role=alert]'); ok((await lim.locator('p[role=alert]').first().innerText()).includes('Starter plan allows 2'), 'Starter plan caps team size including pending invitations');
await admin.goto(`${B}/dashboard/plans?q=${encodeURIComponent('Starter Co ' + tag)}`); await admin.locator('li', { hasText: `Starter Co ${tag}` }).locator('button:text-is("Growth")').click(); await admin.waitForTimeout(1200);
await lim.goto(`${B}/dashboard/roles`); await lim.fill('input[name=title]', `Starter Role 4 ${tag}`); await lim.fill('textarea[name=description]', 'A small role used to test plan limits, with enough text to pass validation.');
await lim.fill('input[name=payText]', '₹10,000 / month'); await lim.fill('input[name=monthlyINR]', '10000'); await lim.fill('input[name=location]', 'Pune'); await lim.fill('input[name=deadline]', '2027-03-01'); await lim.fill('input[name=eligibility]', 'Graduates'); await lim.click('button:has-text("Submit for review")'); await lim.waitForSelector('text=Submitted for review');
ok(true, 'upgrading the plan lifts the limit immediately');
await student.goto(`${B}/dashboard/plans`); ok(!/plans/.test(student.url()), 'students cannot open the plans page'); await employer.goto(`${B}/dashboard/insights`); ok(!/insights/.test(employer.url()), 'recruiters cannot open platform insights');
await admin.goto(`${B}/dashboard/insights`); ok(await admin.locator('text=Platform insights').count() > 0 && await admin.locator('text=New accounts per week').count() > 0, 'admin insights show real weekly counts');
await employer.goto(`${B}/dashboard/analytics`); ok(await employer.locator('text=Applications per week').count() > 0, 'recruiter analytics include weekly applications');

// --- optional password login (email codes always keep working)
const pwEmail = `pw${tag}@example.com`, PW1 = 'blue river walks home', PW2 = 'green hill sings softly';
const pwu = await user(); await auth(pwu, 'join', pwEmail, { name: `Password User ${tag}`, role: 'STUDENT' });
await pwu.goto(`${B}/dashboard/account`);
const trySet = async (page, f) => { for (const [k, v] of Object.entries(f)) await page.fill(`input[name=${k}]`, v); await page.click('button:has-text("Turn on password login"), button:has-text("Change password")'); };
await pwu.evaluate(() => document.querySelectorAll('input[name=password]').forEach((i) => i.removeAttribute('minlength')));
await trySet(pwu, { password: 'short1', confirmPassword: 'short1' }); await pwu.waitForSelector('p[role=alert]'); ok((await pwu.locator('p[role=alert]').first().innerText()).includes('at least 10'), 'short password refused by the server');
await trySet(pwu, { password: 'password123', confirmPassword: 'password123' }); await pwu.waitForTimeout(1500); ok((await pwu.locator('p[role=alert]').first().innerText()).includes('too easy'), 'common password refused');
await trySet(pwu, { password: PW1, confirmPassword: 'different phrase here' }); await pwu.waitForTimeout(1500); ok((await pwu.locator('p[role=alert]').first().innerText()).includes("don't match"), 'mismatched confirmation refused');
await trySet(pwu, { password: PW1, confirmPassword: PW1 }); await pwu.waitForSelector('text=Password login is on');
const openPasswordForm = async (page) => { for (let i = 0; i < 8; i++) { if (await page.locator('input[name=password]').count()) return; await page.click('button:has-text("Use my password instead")').catch(() => {}); await page.waitForTimeout(700); } await page.waitForSelector('input[name=password]'); };
const pwl = await user(); await pwl.goto(`${B}/login`, { waitUntil: 'networkidle' }); await openPasswordForm(pwl);
const pwLogin = async (page, id, pw) => { await page.fill('input[name=identifier]', id); await page.fill('input[name=password]', pw); await page.click('button:has-text("Log in")'); };
await pwLogin(pwl, pwEmail, 'wrong password here'); await pwl.waitForSelector('p[role=alert]'); const wrongMsg = await pwl.locator('p[role=alert]').first().innerText(); ok(wrongMsg.includes('Incorrect'), 'wrong password is refused');
await pwLogin(pwl, `nobody${tag}@example.com`, 'whatever password'); await pwl.waitForTimeout(1500); ok((await pwl.locator('p[role=alert]').first().innerText()) === wrongMsg, 'unknown account gets the identical message (no account enumeration)');
await pwLogin(pwl, pwEmail, PW1); await pwl.waitForURL(/\/dashboard/, { timeout: 20000 }); ok(true, 'correct password logs in');
await pwl.goto(`${B}/dashboard/account`); await trySet(pwl, { password: PW2, confirmPassword: PW2 }); await pwl.waitForSelector('p[role=alert]'); ok((await pwl.locator('p[role=alert]').first().innerText()).includes('current password'), 'a password-login session cannot change the password without the current one');
await trySet(pwl, { current: 'not my password', password: PW2, confirmPassword: PW2 }); await pwl.waitForTimeout(1500); ok((await pwl.locator('p[role=alert]').first().innerText()).includes('incorrect'), 'wrong current password refused');
await trySet(pwl, { current: PW1, password: PW2, confirmPassword: PW2 }); await pwl.waitForSelector('text=Password changed'); ok(true, 'password can be changed with the current one');
await pwu.goto(`${B}/dashboard/account`); await trySet(pwu, { password: PW1, confirmPassword: PW1 }); await pwu.waitForSelector('text=Password changed'); ok(true, 'a fresh email-code session can reset a forgotten password');
const exp = await (await pwu.request.get(`${B}/api/account/export`)).text(); ok(!exp.includes('scrypt') && !exp.includes('passwordHash'), 'data export never includes the password hash');
const pwb = await user(); await pwb.goto(`${B}/login`, { waitUntil: 'networkidle' }); await openPasswordForm(pwb);
for (let i = 0; i < 9; i++) { try { await openPasswordForm(pwb); await pwb.fill('input[name=identifier]', pwEmail, { timeout: 8000 }); await pwb.fill('input[name=password]', `bad guess number ${i}`, { timeout: 8000 }); await pwb.click('button:has-text("Log in")'); await pwb.waitForFunction(() => !!document.querySelector('p[role=alert]') && !document.querySelector('form button[disabled]'), null, { timeout: 15000 }); } catch (e) { console.log('LOCKOUT LOOP failed at', i, '| url', pwb.url(), '| inputs', await pwb.locator('input').evaluateAll((l) => l.map((x) => x.name)), '| text', (await pwb.locator('body').innerText()).slice(0, 300).replace(/\n/g, ' / ')); throw e; } await pwb.waitForTimeout(350); }
await pwb.waitForSelector('text=Too many attempts'); await pwLogin(pwb, pwEmail, PW1); await pwb.waitForTimeout(1500); ok((await pwb.locator('p[role=alert]').first().innerText()).includes('Too many attempts'), 'repeated wrong guesses lock password login (email codes still work)');
await pwu.goto(`${B}/dashboard/account`, { waitUntil: 'networkidle' }); await pwu.locator('summary:has-text("Turn off password login")').click(); await pwu.fill('details input[name=current]', PW1); await pwu.click('button:has-text("Remove password")'); await pwu.waitForSelector('text=Password removed');
await pwu.reload(); ok(await pwu.locator('button:has-text("Turn on password login")').count() > 0, 'password login can be turned off again');

// --- Talent Passport: username, evidence labels, verification, privacy, resume
const uname = `pp${tag}`.toLowerCase();
await student.goto(`${B}/dashboard/passport`);
await student.fill('input[name=username]', 'admin'); await student.click('button:has-text("Save username")'); await student.waitForSelector('p[role=alert]');
ok((await student.locator('p[role=alert]').first().innerText()).includes('reserved'), 'reserved username refused');
await student.fill('input[name=username]', uname); await student.click('button:has-text("Save username")'); await student.waitForSelector('text=Saved');
const pRes = await anon.goto(`${B}/talent/${uname}`); ok(pRes.status() === 200, 'Passport reachable at /talent/<username>');
const legacy = await anon.goto(`${B}/t/${uname}`); ok(legacy.url().endsWith(`/talent/${uname}`), 'legacy /t/ link redirects to Passport');
const s2 = await user(); await auth(s2, 'join', `stu3${tag}@example.com`, { name: `Third Student ${tag}`, role: 'STUDENT' });
await s2.goto(`${B}/dashboard/passport`); await s2.fill('input[name=username]', uname); await s2.click('button:has-text("Save username")'); await s2.waitForSelector('p[role=alert]');
ok((await s2.locator('p[role=alert]').first().innerText()).includes('taken'), 'duplicate username refused');
await student.selectOption('select[name=kind]', 'CERTIFICATE'); await student.fill('input[name=title]', `Cloud Basics ${tag}`); await student.fill('input[name=org]', 'Example Academy'); await student.fill('input[name=url]', 'https://example.com/cert/123');
await student.click('button:has-text("Add entry")'); await student.waitForSelector(`text=Cloud Basics ${tag}`);
await anon.goto(`${B}/talent/${uname}`);
ok(await anon.locator('text=External certificate · not verified by Kalwings').count() > 0 && await anon.locator('li', { hasText: `Cloud Basics ${tag}` }).locator('text="Verified by Kalwings"').count() === 0, 'unverified certificate is labelled external, not verified');
await student.reload(); await student.locator('li', { hasText: `Cloud Basics ${tag}` }).locator('button:has-text("Request verification")').click(); await student.waitForSelector('text=Verification requested');
await admin.goto(`${B}/dashboard/credentials`); await admin.locator('li', { hasText: `Cloud Basics ${tag}` }).locator('button:has-text("Verify")').click(); await admin.waitForTimeout(1200);
await anon.goto(`${B}/talent/${uname}`); ok(await anon.locator('li', { hasText: `Cloud Basics ${tag}` }).locator('text="Verified by Kalwings"').count() > 0, 'admin verification shows the verified badge');
const nonAdmin = await student.goto(`${B}/dashboard/credentials`); ok(!/credentials/.test(student.url()) || (await student.locator('text=Passport verification').count()) === 0, 'students cannot open the verification queue');
await student.goto(`${B}/dashboard/passport`);
await student.selectOption('select[name=entriesVisibility]', 'PRIVATE'); await student.click('button:has-text("Save privacy")'); await student.waitForSelector('text=Saved');
await anon.goto(`${B}/talent/${uname}`); ok(await anon.locator(`text=Cloud Basics ${tag}`).count() === 0, 'private entries hidden from public');
await student.goto(`${B}/talent/${uname}`); ok(await student.locator(`text=Cloud Basics ${tag}`).count() > 0, 'owner still sees private entries');
await student.goto(`${B}/dashboard/passport`); await student.selectOption('select[name=passportVisibility]', 'RECRUITERS'); await student.click('button:has-text("Save privacy")'); await student.waitForSelector('text=Saved');
await anon.goto(`${B}/talent/${uname}`); ok(await anon.locator('text=This Talent Passport is limited').count() > 0 && await anon.locator(`text=Test Student`).count() === 0, 'recruiter-only Passport is gated and hides the name from the public');
await employer.goto(`${B}/talent/${uname}`); ok(await employer.locator('h1:has-text("Test Student")').count() > 0, 'verified employer can open a recruiter-only Passport');
const rr = await anon.goto(`${B}/talent/${uname}/resume`); ok(rr.status() === 404, 'resume respects recruiter-only visibility');
await student.goto(`${B}/dashboard/passport`); await student.selectOption('select[name=passportVisibility]', 'PUBLIC'); await student.click('button:has-text("Save privacy")'); await student.waitForSelector('text=Saved');
await anon.goto(`${B}/talent/${uname}/resume`); const rtxt = await anon.locator('article').innerText(); ok(rtxt.includes('Test Student') && !rtxt.includes(`stu${tag}@example.com`) && !rtxt.includes('Cloud Basics'), 'resume shows profile, hides email and private entries');
await student.goto(`${B}/dashboard/passport`); await student.selectOption('select[name=passportVisibility]', 'PRIVATE'); await student.click('button:has-text("Save privacy")'); await student.waitForSelector('text=Saved');
ok((await (await anon.goto(`${B}/talent/${uname}`)).status()) === 404, 'private Passport is 404 to everyone else');
await student.goto(`${B}/dashboard/passport`); await student.selectOption('select[name=passportVisibility]', 'PUBLIC'); await student.selectOption('select[name=entriesVisibility]', 'PUBLIC'); await student.click('button:has-text("Save privacy")'); await student.waitForSelector('text=Saved');

// --- admin suspends / restores users
await student.goto(`${B}/dashboard`); const cardHref = await student.locator('a:has-text("View my Talent Card")').getAttribute('href');
const suspend = async (who, reason) => {
  await admin.goto(`${B}/dashboard/users?q=${who}`);
  const row = admin.locator('li', { hasText: who }).first(); await row.locator('summary:has-text("Suspend")').click();
  await row.locator('input[name=reason]').fill(reason); await row.locator('button:has-text("Suspend account")').click(); await admin.waitForSelector('li:has-text("' + who + '") >> text=Suspended', { timeout: 15000 }); await admin.waitForTimeout(500);
};
await admin.goto(`${B}/dashboard/users?q=admin@sample`); ok(await admin.locator('li', { hasText: 'admin@sample.kalwings.test' }).locator('summary:has-text("Suspend")').count() === 0, 'platform admins have no suspend control');
await suspend(`stu${tag}@example.com`, 'Posting fake projects (test)');
await student.goto(`${B}/dashboard`); ok(/\/login/.test(student.url()), 'suspended user is signed out immediately (existing session invalid)');
await student.fill('input[name=identifier]', `stu${tag}@example.com`); await student.click('button:has-text("Send one-time code")'); await student.waitForSelector('input[name=code]');
await student.fill('input[name=code]', (await student.locator('text=Your code is').locator('b').innerText()).trim()); await student.click('button:has-text("Log in")'); await student.waitForSelector('p[role=alert]');
ok((await student.locator('p[role=alert]').innerText()).includes('suspended'), 'suspended user cannot log in (clear message)');
const cardResp = await anon.goto(B + cardHref); ok(cardResp.status() === 404, "suspended user's public Talent Card is hidden (404)");
await admin.goto(`${B}/dashboard/users?q=stu${tag}@example.com`); await admin.locator('li', { hasText: `stu${tag}@example.com` }).locator('button:has-text("Restore")').click(); await admin.waitForTimeout(1200);
await auth(student, 'login', `stu${tag}@example.com`); ok(/dashboard/.test(student.url()), 'restored user can log in again');
ok((await (await anon.goto(B + cardHref)).status()) === 200, 'Talent Card is back after restore');
// a suspended mentor disappears from the public directory
await suspend(`men${tag}@example.com`, 'Spam (test)');
await anon.goto(`${B}/mentors`); ok(await anon.locator(`text=Test Mentor ${tag}`).count() === 0, 'suspended mentor is hidden from the directory');
await admin.goto(`${B}/dashboard/users?q=men${tag}@example.com`); await admin.locator('li', { hasText: `men${tag}@example.com` }).locator('button:has-text("Restore")').click(); await admin.waitForTimeout(1200);
await anon.goto(`${B}/mentors`); ok(await anon.locator(`text=Test Mentor ${tag}`).count() > 0, 'restored mentor is listed again');

// --- data export
const ex = await student.request.get(`${B}/api/account/export`);
const exText = await ex.text(); const exJson = JSON.parse(exText);
ok(ex.status() === 200 && /attachment/.test(ex.headers()['content-disposition'] ?? '') && exJson.account.email === `stu${tag}@example.com`, 'data export downloads the user\'s own data as JSON');
ok(exJson.studentProfile.applications.length >= 1, 'export includes applications');
ok(!exText.includes(`emp${tag}@example.com`) && !/codeHash/.test(exText), "export has no other users' emails and no sign-in code hashes");
ok((await anon.request.get(`${B}/api/account/export`)).status() === 401, 'export requires sign-in');

// --- account deletion (a throwaway student with a profile, photo and application)
const leaver = await user(); await auth(leaver, 'join', `leaver${tag}@example.com`, { name: `Leaver ${tag}`, role: 'STUDENT' });
await leaver.goto(`${B}/dashboard/profile`); await leaver.fill('input[name=headline]', 'Temporary profile'); await leaver.fill('input[name=graduationYear]', '2026'); await leaver.click('button:has-text("Save"):not(:has-text("college"))'); await leaver.waitForSelector('text=Saved');
await leaver.setInputFiles('input[type=file][aria-label="Upload photo"]', { name: 'l.png', mimeType: 'image/png', buffer: PNG }); await leaver.waitForSelector('img[src^="/api/files/"]');
const leaverPhoto = await leaver.locator('img[src^="/api/files/"]').first().getAttribute('src');
await leaver.goto(B + oppHref); await leaver.click('button:has-text("Apply with my Talent Card")'); await leaver.waitForSelector("text=You've applied");
await leaver.goto(`${B}/dashboard`); const leaverCard = await leaver.locator('a:has-text("View my Talent Card")').getAttribute('href');
await employer.goto(`${B}/dashboard/pipeline`); ok(await employer.locator(`text=Leaver ${tag}`).count() > 0, 'throwaway student is in the employer pipeline before deleting');
await leaver.goto(`${B}/dashboard/account`);
await leaver.fill('input[name=confirm]', 'delete'); await leaver.click('button:has-text("Delete everything")'); await leaver.waitForSelector('[role=alert]:has-text("DELETE")');
ok(true, 'lower-case "delete" is not accepted as confirmation');
await leaver.fill('input[name=confirm]', 'DELETE'); await leaver.click('button:has-text("Delete everything")'); await leaver.waitForURL(`${B}/`);
await leaver.goto(`${B}/dashboard`); ok(/\/login/.test(leaver.url()), 'deleted user is signed out');
await leaver.fill('input[name=identifier]', `leaver${tag}@example.com`); await leaver.click('button:has-text("Send one-time code")'); await leaver.waitForSelector('input[name=code]');
await leaver.fill('input[name=code]', (await leaver.locator('text=Your code is').locator('b').innerText()).trim()); await leaver.click('button:has-text("Log in")'); await leaver.waitForSelector('p[role=alert]');
ok((await leaver.locator('p[role=alert]').innerText()).includes('No account'), 'the account no longer exists');
ok((await (await anon.goto(B + leaverCard)).status()) === 404, 'deleted user\'s Talent Card is gone');
ok((await anon.request.get(B + leaverPhoto)).status() === 404, 'deleted user\'s uploaded photo is gone');
await employer.goto(`${B}/dashboard/pipeline`); ok(await employer.locator(`text=Leaver ${tag}`).count() === 0, "deleted student's application disappears from the employer pipeline");
await admin.goto(`${B}/dashboard/account`); ok(await admin.locator('text=can\'t be deleted from here').count() > 0 && await admin.locator('input[name=confirm]').count() === 0, 'platform admins cannot self-delete');

// --- free job distribution: career page, embed, feeds, share kit, source + referral tracking
await employer.goto(`${B}/dashboard/company`); await employer.fill('input[name=slug]', 'admin'); await employer.click('button:has-text("Save address")'); await employer.waitForSelector('p[role=alert]');
ok((await employer.locator('p[role=alert]').first().innerText()).includes('reserved'), 'reserved career-page address is refused');
await employer.fill('input[name=slug]', `acme-${tag}`); await employer.click('button:has-text("Save address")'); await employer.waitForSelector('text=Saved');
const careerRes = await anon.goto(`${B}/careers/acme-${tag}`); ok(careerRes.status() === 200 && await anon.locator(`text=Embedded Intern ${tag}`).count() > 0, 'public career page lists the approved listing without login');
ok(await anon.locator('script[type="application/ld+json"]').first().innerText().then((t) => t.includes('"Organization"')), 'career page has Organization structured data');
ok((await (await anon.goto(`${B}/careers/nope-${tag}`)).status()) === 404, 'unknown career page is 404');
const embedRes = await anon.request.get(`${B}/embed/careers/acme-${tag}`); const embedHdr = embedRes.headers();
ok(embedRes.status() === 200 && (await embedRes.text()).includes(`Embedded Intern ${tag}`) && !embedHdr['x-frame-options'] && (process.env.E2E_PROD ? embedHdr['content-security-policy'].includes('frame-ancestors *') : true), 'embed widget lists roles and may be framed by other sites');
ok((await anon.request.get(`${B}/opportunities`)).headers()['x-frame-options'] === 'SAMEORIGIN', 'normal pages still refuse to be framed');
const feedXml = await (await anon.request.get(`${B}/feeds/jobs.xml`)).text();
ok(feedXml.includes('<source>') && feedXml.includes(`Embedded Intern ${tag}`) && feedXml.includes('?src=feed'), 'XML job feed contains the approved listing with a source tag');
const feedJson = await (await anon.request.get(`${B}/feeds/jobs.json`)).json(); ok(feedJson.jobs.some((j) => j.title === `Embedded Intern ${tag}`) && !feedJson.jobs.some((j) => /Sample/.test(j.company) && false), 'JSON job feed contains the approved listing');
ok((await (await anon.request.get(`${B}/sitemap.xml`)).text()).includes(`/careers/acme-${tag}`), 'sitemap lists the career page');
await employer.goto(`${B}/dashboard/roles`); await employer.locator('li', { hasText: `Embedded Intern ${tag}` }).locator('summary:has-text("Share")').click();
ok(await employer.locator(`li:has-text("Embedded Intern ${tag}") a:has-text("LinkedIn")`).getAttribute('href').then((h) => h.includes('linkedin.com') && decodeURIComponent(h).includes('src=linkedin')) && await employer.locator(`li:has-text("Embedded Intern ${tag}") svg`).count() > 0, 'share kit has a tagged LinkedIn link and a QR code');
await student.goto(B + oppHref); const myRef = (await student.locator('code').first().innerText()).split('ref=')[1];
ok(!!myRef, 'student sees a personal referral link');
const jobLd = JSON.parse((await anon.goto(B + oppHref).then(() => anon.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => e.textContent)))).find((t) => t.includes('JobPosting')));
ok(jobLd.directApply === true && jobLd.identifier?.value, 'listing structured data has directApply and identifier');
async function applicant(name, qs) {
  const a = await user(); await auth(a, 'join', `${name.toLowerCase().replace(/ /g, '')}${tag}@example.com`, { name: `${name} ${tag}`, role: 'STUDENT' });
  await a.goto(`${B}/dashboard/profile`); await a.fill('input[name=headline]', 'Distribution test profile'); await a.fill('input[name=graduationYear]', '2026'); await a.click('button:has-text("Save"):not(:has-text("college"))'); await a.waitForSelector('text=Saved');
  await a.goto(B + oppHref + qs); await a.click('button:has-text("Apply with my Talent Card")'); await a.waitForSelector("text=You've applied");
}
await applicant('Linkedin Lead', '?src=linkedin'); await applicant('Referred Friend', `?src=whatsapp&ref=${myRef}`); await applicant('Weird Source', '?src=%3Cscript%3E');
await employer.goto(`${B}/dashboard/pipeline`);
ok(await employer.locator(`article:has-text("Linkedin Lead ${tag}")`).locator('text=Source: LinkedIn').count() > 0, 'pipeline shows the LinkedIn source');
ok(await employer.locator(`article:has-text("Referred Friend ${tag}")`).locator(`text=Referred by Test Student ${tag}`).count() > 0, 'pipeline shows who referred the candidate');
ok(await employer.locator(`article:has-text("Weird Source ${tag}")`).locator('text=Kalwings marketplace').count() > 0, 'an unsafe source tag is dropped');
await employer.goto(`${B}/dashboard/analytics`); ok(await employer.locator('text=Where candidates came from').count() > 0 && await employer.locator('li:has-text("Referral")').count() > 0, 'analytics breaks applications down by source');

// --- ATS batch 2: stage history, interview scorecards, templates, screening questions, offer letter, speed analytics
await employer.goto(`${B}/dashboard/pipeline`);
const hc = () => employer.locator('article').filter({ hasText: new RegExp(`^\\s*Test Student ${tag}`) }).filter({ hasText: `Embedded Intern ${tag}` }).first();
await hc().locator('summary:text-is("Stage history")').click();
ok((await hc().locator('details:has(summary:text-is("Stage history")) li').allInnerTexts()).join(' ').includes('Applied') && (await hc().locator('details:has(summary:text-is("Stage history")) li').count()) >= 3, 'stage history lists the recorded moves');
await employer.goto(`${B}/dashboard/interviews`); await employer.locator('li', { hasText: `Test Student ${tag}` }).first().locator('button:has-text("Mark done")').click(); await employer.waitForTimeout(1200);
await employer.goto(`${B}/dashboard/pipeline`); await hc().locator('summary:has-text("Interview feedback")').click();
await hc().locator('select[name=rating]').selectOption('4'); await hc().locator('select[name=recommendation]').selectOption('STRONG_YES');
await hc().locator('input[name=strengths]').fill(`Clear firmware reasoning ${tag}`); await hc().locator('button:has-text("Save my feedback")').click(); await employer.waitForSelector('text=Saved');
await employer.reload(); ok(await employer.locator(`summary:has-text("Interview feedback (1 · avg 4.0/5)")`).count() > 0, 'scorecard is saved and summarised');
await student.goto(`${B}/dashboard/interviews`); ok(await student.locator(`text=Clear firmware reasoning ${tag}`).count() === 0, 'candidates never see interviewer feedback');
// templates
await employer.goto(`${B}/dashboard/company`); await employer.fill('input[name=name]', `Invite ${tag}`); await employer.fill('textarea[name=body]', 'Hi, we would love to chat about the role this week.'); await employer.click('button:has-text("Save template")'); await employer.waitForSelector(`text=Invite ${tag}`);
await employer.goto(`${B}/dashboard/pipeline`); await hc().locator('summary:text-is("Notes & messages")').click();
await hc().locator('select').filter({ has: employer.locator(`option:has-text("Invite ${tag}")`) }).selectOption({ label: `Invite ${tag}` });
ok((await hc().locator('input[name=body]').inputValue()).includes('love to chat'), 'a saved template fills the message box');
// offer letter
const offerHref = await hc().locator('a:has-text("Printable offer letter")').getAttribute('href');
await employer.goto(B + offerHref); ok(await employer.locator('text=Embedded engineer, 6 LPA').count() > 0 && await employer.locator(`text=Acme Labs ${tag}`).count() > 0, 'printable offer letter shows the terms and company');
await student.goto(B + offerHref); ok(await student.locator('text=Embedded engineer, 6 LPA').count() === 0, 'candidates cannot open the employer offer letter');
const outsider = await user(); await auth(outsider, 'join', `letter${tag}@example.com`, { name: 'Letter Outsider', role: 'EMPLOYER' });
await outsider.goto(B + offerHref); ok(await outsider.locator('text=Embedded engineer, 6 LPA').count() === 0, 'another company cannot open it');
// screening questions
await employer.goto(`${B}/dashboard/roles`);
await employer.fill('input[name=title]', `Screened Role ${tag}`); await employer.fill('textarea[name=description]', 'A role used to check that screening questions work for applicants.');
await employer.fill('input[name=payText]', '₹20,000 / month'); await employer.fill('input[name=monthlyINR]', '20000'); await employer.fill('input[name=location]', 'Hyderabad');
await employer.fill('input[name=deadline]', '2027-03-01'); await employer.fill('input[name=eligibility]', '2026 graduates');
await employer.fill('textarea[name=questions]', `Which project are you proudest of? ${tag}\nWhen can you start?`); await employer.click('button:has-text("Submit for review")'); await employer.waitForSelector('text=Submitted for review');
await admin.goto(`${B}/dashboard/moderation`); await admin.locator('li', { hasText: `Screened Role ${tag}` }).locator('button:has-text("Approve")').click(); await admin.waitForTimeout(800);
await student.goto(`${B}/opportunities?q=${encodeURIComponent('Screened Role ' + tag)}`); const screenedHref = await student.locator('article', { hasText: `Screened Role ${tag}` }).locator('a:has-text("View details")').getAttribute('href');
const sq = await user(); await auth(sq, 'join', `screen${tag}@example.com`, { name: `Screen Candidate ${tag}`, role: 'STUDENT' });
await sq.goto(`${B}/dashboard/profile`); await sq.fill('input[name=headline]', 'Screening test profile'); await sq.fill('input[name=graduationYear]', '2026'); await sq.click('button:has-text("Save"):not(:has-text("college"))'); await sq.waitForSelector('text=Saved');
await sq.goto(B + screenedHref, { waitUntil: 'networkidle' });
ok(await sq.locator(`text=Which project are you proudest of? ${tag}`).count() > 0 && await sq.locator('button:text-is("Apply with my Talent Card")').count() === 1, 'listing with screening questions shows them before applying');
await sq.locator('textarea').first().fill(`My robotics arm ${tag}`); await sq.locator('textarea').nth(1).fill('');
await sq.click('button:text-is("Apply with my Talent Card")'); await sq.waitForTimeout(500);
ok(await sq.locator('textarea:invalid').count() > 0 && await sq.locator("text=You've applied").count() === 0, 'every screening question must be answered');
await sq.locator('textarea').nth(1).fill('Immediately'); await sq.click('button:text-is("Apply with my Talent Card")'); await sq.waitForSelector("text=You've applied");
await employer.goto(`${B}/dashboard/pipeline`); const sc = employer.locator('article', { hasText: `Screen Candidate ${tag}` }).first();
await sc.locator('summary:has-text("Screening answers")').click(); ok(await sc.locator(`text=My robotics arm ${tag}`).count() > 0 && await sc.locator('text=Immediately').count() > 0, 'employer reads the screening answers in the pipeline');
// speed analytics
await employer.goto(`${B}/dashboard/analytics`); ok(await employer.locator('text=How fast you move').count() > 0 && await employer.locator('text=time to hire').count() > 0, 'analytics shows time to hire');

// --- bulk actions and tags
await employer.goto(`${B}/dashboard/pipeline`, { waitUntil: 'networkidle' });
const bulk = employer.locator('form[aria-label="Bulk actions"]');
await bulk.locator('select[name=action]').selectOption('UNDER_REVIEW'); await bulk.locator('button:text-is("Apply")').click();
await bulk.locator('[role=alert]').waitFor(); ok((await bulk.locator('[role=alert]').innerText()).includes('Select at least one'), 'bulk action with nobody selected is refused');
await employer.check(`input[aria-label^="Select Linkedin Lead ${tag}"]`); await employer.check(`input[aria-label^="Select Referred Friend ${tag}"]`);
await bulk.locator('select[name=action]').selectOption('ADD_TAG'); await bulk.locator('input[name=tag]').fill('  Strong   Portfolio '); await bulk.locator('button:text-is("Apply")').click();
await bulk.locator('text=Tagged 2 candidates').waitFor(); ok(true, 'bulk tag applies to every selected candidate');
await employer.goto(`${B}/dashboard/pipeline?tag=${encodeURIComponent('strong portfolio')}`);
ok(await employer.locator(`article:has-text("Linkedin Lead ${tag}")`).count() > 0 && await employer.locator(`article:has-text("Referred Friend ${tag}")`).count() > 0 && await employer.locator(`article:has-text("Weird Source ${tag}")`).count() === 0, 'tag filter shows only tagged candidates, and tags are normalised');
await employer.goto(`${B}/dashboard/pipeline`, { waitUntil: 'networkidle' });
await employer.check(`input[aria-label^="Select Linkedin Lead ${tag}"]`); await employer.check(`input[aria-label^="Select Referred Friend ${tag}"]`);
await bulk.locator('select[name=action]').selectOption('SHORTLISTED'); await bulk.locator('button:text-is("Apply")').click(); await bulk.locator('text=Moved 2 candidates').waitFor();
await employer.reload(); ok(await employer.locator(`section[aria-label=Shortlisted] >> text=Linkedin Lead ${tag}`).count() > 0 && await employer.locator(`section[aria-label=Shortlisted] >> text=Referred Friend ${tag}`).count() > 0, 'bulk move puts every selected candidate in the new stage');
const ll = employer.locator('article').filter({ hasText: new RegExp(`^\\s*Linkedin Lead ${tag}`) }).first();
await ll.locator('button:has-text("remove tag")').click(); await employer.waitForTimeout(1200); await employer.reload();
ok(await employer.locator(`article:has-text("Linkedin Lead ${tag}") a:text-is("strong portfolio")`).count() === 0 && await employer.locator(`article:has-text("Referred Friend ${tag}") a:text-is("strong portfolio")`).count() > 0, 'a tag can be removed from one candidate');
await employer.check(`input[aria-label^="Select Test Student ${tag}, Embedded Intern"]`);
await bulk.locator('select[name=action]').selectOption('SHORTLISTED'); await bulk.locator('button:text-is("Apply")').click(); await bulk.locator('text=Skipped 1').waitFor();
ok(await employer.locator(`section[aria-label=Hired] >> text=Test Student ${tag}`).count() > 0, 'bulk moves skip candidates in Offer or Hired');
await employer.reload(); await employer.check(`input[aria-label^="Select Weird Source ${tag}"]`);
employer.once('dialog', (d) => d.accept()); await bulk.locator('select[name=action]').selectOption('REJECTED'); await bulk.locator('button:text-is("Apply")').click(); await bulk.locator('text=Moved 1 candidate').waitFor();
await employer.reload(); ok(await employer.locator(`article:has-text("Weird Source ${tag}")`).count() === 0, 'bulk reject asks for confirmation, then removes the candidate from the board');

// --- app shell: no landing page, dark by default, theme in Settings, one workspace with every feature
const fresh = await user(); await fresh.goto(`${B}/`); ok(/\/login$/.test(fresh.url()), 'signed-out visitors go straight to sign-in (the landing page is kalwings.com)');
ok(await fresh.locator('html[data-theme=dark]').count() === 1, 'dark theme is the default');
ok(await fresh.locator('header button[aria-label*="mode"]').count() === 0, 'no light/dark toggle in the page header');
const mk = await anon.request.get(`${B}/students`, { maxRedirects: 0 }); ok([301, 302, 307, 308].includes(mk.status()) && (mk.headers()['location'] || '').startsWith('https://kalwings.com'), 'marketing pages forward to kalwings.com');
await student.goto(`${B}/`); ok(/\/dashboard$/.test(student.url()), 'signed-in users land in their workspace');
ok(await student.locator('#ws-h').count() === 1 && await student.locator('main >> text=Career copilot').count() > 0 && await student.locator('main >> text=Campus drives').count() > 0 && await student.locator('main >> text=Mentor sessions').count() > 0, 'student workspace lists every feature');
await employer.goto(`${B}/dashboard`); ok(await employer.locator('#ws-h').count() === 1 && await employer.locator('main >> text=Talent search').count() > 0 && await employer.locator('main >> text=Analytics').count() > 0, 'employer workspace lists every feature');
await student.goto(`${B}/dashboard/portfolio`); ok(await student.locator('nav[aria-label=Section] >> text=Public profile').count() > 0 && await student.locator('nav[aria-label=Section] >> text=Details').count() > 0, 'related profile screens share one tab bar');
await employer.goto(`${B}/dashboard/challenges`); ok(await employer.locator('nav[aria-label=Section] >> text=Assessments').count() > 0 && await employer.locator('nav[aria-label=Section] >> text=Description check').count() > 0, 'roles, challenges and assessments share one tab bar');
await student.goto(`${B}/dashboard/account`, { waitUntil: 'networkidle' }); await student.locator('label:has-text("Light") input').check();
ok(await student.locator('html[data-theme=light]').count() === 1, 'Settings > Appearance switches to light');
await student.reload(); ok(await student.locator('html[data-theme=light]').count() === 1, 'the theme choice is remembered');
await student.locator('label:has-text("Dark") input').check(); ok(await student.locator('html[data-theme=dark]').count() === 1, 'and back to dark');

// --- premium look: original logo, two fonts, company logos
const home = await user(); await home.goto(`${B}/login`, { waitUntil: 'networkidle' });
ok(await home.locator('header svg linearGradient').count() > 0 && (await home.locator('header').innerText()).toUpperCase().includes('ALWINGS'), 'header shows the Kalwings logo lockup (gradient K mark + ALWINGS)');
const fams = await home.evaluate(() => ({ body: getComputedStyle(document.body).fontFamily, accent: getComputedStyle(document.querySelector('.serif-accent')).fontFamily }));
ok(/Plus Jakarta/.test(fams.body) && /Instrument Serif/.test(fams.accent), 'two font styles: Plus Jakarta Sans body, Instrument Serif italic accent');
ok(!/Inter|Montserrat/.test(fams.body), 'no third body font');
const lg = await employer.request.post(`${B}/api/upload`, { multipart: { kind: 'COMPANY_LOGO', file: { name: 'logo.png', mimeType: 'image/png', buffer: PNG } } });
ok(lg.status() === 200, 'an employer can upload their company logo');
ok((await student.request.post(`${B}/api/upload`, { multipart: { kind: 'COMPANY_LOGO', file: { name: 'logo.png', mimeType: 'image/png', buffer: PNG } } })).status() === 403, 'students cannot upload a company logo');
await anon.goto(`${B}/opportunities?q=${encodeURIComponent('Embedded Intern ' + tag)}`, { waitUntil: 'networkidle' });
ok(await anon.locator(`article:has-text("Embedded Intern ${tag}") img[alt$="logo"]`).count() > 0, 'listing cards show the company logo');
await anon.goto(`${B}/careers/acme-${tag}`, { waitUntil: 'networkidle' }); ok(await anon.locator('main img[alt$="logo"]').count() > 0, 'career page shows the company logo');

// --- email-only sign-in: mobile is hidden and refused
const em = await user(); await em.goto(`${B}/login`, { waitUntil: 'networkidle' });
ok(!/mobile|phone|SMS/i.test(await em.locator('main').innerText()) && await em.locator('input[name=identifier][type=email]').count() === 1, 'sign-in asks for an email only, with no mention of mobile');
await em.goto(`${B}/join`, { waitUntil: 'networkidle' }); ok(!/mobile|phone|SMS/i.test(await em.locator('main').innerText()), 'create-account page has no mobile option');
const ph = await user(); await ph.goto(`${B}/login`, { waitUntil: 'networkidle' });
await ph.fill('input[name=identifier]', '9876543210'); await ph.evaluate(() => { const i = document.querySelector('input[name=identifier]'); i.type = 'text'; });
await ph.click('button:has-text("Send one-time code")'); await ph.waitForSelector('p[role=alert]', { timeout: 20000 });
ok((await ph.locator('p[role=alert]').innerText()).includes('valid email'), 'the server refuses a mobile number even if the form is tampered with');

// --- platform admin adds users directly (HR at other companies, college admins) after verifying them
await admin.goto(`${B}/dashboard/users`, { waitUntil: 'networkidle' });
const addUser = async (page, o) => {
  await page.fill('form[aria-label="Add a user"] input[name=name]', o.name); await page.fill('form[aria-label="Add a user"] input[name=email]', o.email);
  await page.selectOption('form[aria-label="Add a user"] select[name=role]', o.role);
  if (o.company) await page.fill('form[aria-label="Add a user"] input[name=companyName]', o.company);
  if (o.website) await page.fill('form[aria-label="Add a user"] input[name=companyWebsite]', o.website);
  if (o.college) await page.fill('form[aria-label="Add a user"] input[name=collegeName]', o.college);
  await page.click('form[aria-label="Add a user"] button:has-text("Add user")');
};
const hrEmail = `hr${tag}@example.com`;
await addUser(admin, { name: `Pat HR ${tag}`, email: hrEmail, role: 'EMPLOYER', company: `Globex ${tag}`, website: 'https://globex.example' });
await admin.waitForSelector('form[aria-label="Add a user"] >> text=Added'); ok((await admin.locator('form[aria-label="Add a user"] [role=status]').innerText()).includes('(new, verified)'), 'admin adds an HR user and a new verified company in one step');
await admin.goto(`${B}/dashboard/users?q=${encodeURIComponent(hrEmail)}`); ok(await admin.locator(`text=Pat HR ${tag}`).count() > 0, 'the new user appears in the users list');
await admin.goto(`${B}/dashboard/users`, { waitUntil: 'networkidle' }); await addUser(admin, { name: 'Dup', email: hrEmail, role: 'EMPLOYER', company: `Globex ${tag}` });
await admin.waitForSelector('form[aria-label="Add a user"] [role=alert]'); ok((await admin.locator('form[aria-label="Add a user"] [role=alert]').innerText()).includes('already exists'), 'a duplicate email is refused');
await addUser(admin, { name: `Sam HR ${tag}`, email: `hr2${tag}@example.com`, role: 'EMPLOYER', company: `GLOBEX ${tag}` });
await admin.waitForFunction((t) => document.querySelector('form[aria-label="Add a user"] [role=status]')?.textContent?.includes(`hr2${t}@example.com`), tag); ok(!(await admin.locator('form[aria-label="Add a user"] [role=status]').innerText()).includes('(new, verified)'), 'a second HR joins the existing company instead of creating a duplicate');
// own forwarded IP so this late sign-in is not counted against the per-IP code limit the earlier logins used up
const hrCtx = await b.newContext({ viewport: { width: 1300, height: 900 }, extraHTTPHeaders: { 'x-forwarded-for': '203.0.113.50' } }); const hr = await hrCtx.newPage(); hr.on('pageerror', (e) => { console.log('PAGEERROR', e.message); fails++; });
await auth(hr, 'login', hrEmail);
await hr.goto(`${B}/dashboard/company`, { waitUntil: 'networkidle' });
ok(await hr.locator(`h2:has-text("Globex ${tag}")`).count() > 0 && await hr.locator('text=Recruiting team').count() > 0 && await hr.locator(`text=Sam HR ${tag}`).count() > 0, 'the added HR signs in with an email code and lands in the verified company with their colleague');
await hr.goto(`${B}/dashboard/roles`); ok(await hr.locator('button:has-text("Submit for review")').count() === 1, 'the HR can post roles straight away (company is verified)');
await admin.goto(`${B}/dashboard/users`, { waitUntil: 'networkidle' }); await addUser(admin, { name: `Dean ${tag}`, email: `dean${tag}@example.com`, role: 'COLLEGE_ADMIN', college: `Delta Institute ${tag}` });
await admin.waitForSelector('form[aria-label="Add a user"] >> text=Added'); ok((await admin.locator('form[aria-label="Add a user"] [role=status]').innerText()).includes('(new, verified)'), 'admin adds a college admin with a verified college');
await employer.goto(`${B}/dashboard/users`); ok(!/\/dashboard\/users/.test(employer.url()) || await employer.locator('form[aria-label="Add a user"]').count() === 0, 'only platform admins can add users');

// --- admin console: plans, companies, listings, colleges, mentors, site settings
const submitted = async (page, label, kind) => { await page.waitForSelector(`form[aria-label="${label}"] [role=${kind}]`); return page.locator(`form[aria-label="${label}"] [role=${kind}]`).innerText(); };
await admin.goto(`${B}/dashboard/plans`, { waitUntil: 'networkidle' });
const proForm = admin.locator('form[aria-label="Add a plan"]');
await proForm.locator('input[name=key]').fill(`PRO${tag.toUpperCase().replace(/[^A-Z0-9]/g, '')}`); await proForm.locator('input[name=label]').fill(`Campus Pro ${tag}`); await proForm.locator('input[name=priceText]').fill('₹4,999 / month');
await proForm.locator('textarea[name=features]').fill('Priority support\nUnlimited shortlists');
await proForm.locator('input[name=listings]').fill('7'); await proForm.locator('input[name=challenges]').fill('2'); await proForm.locator('input[name=assessments]').fill('3'); await proForm.locator('input[name=team]').fill('4');
await proForm.locator('button:has-text("Add plan")').click(); ok((await submitted(admin, 'Add a plan', 'status')).includes('Plan added'), 'admin adds a new plan');
await admin.reload({ waitUntil: 'networkidle' }); ok(await admin.locator(`h2:has-text("Campus Pro ${tag}")`).count() > 0, 'the new plan is listed with its price');
const starterForm = admin.locator('form[aria-label="Edit plan Starter"]'); await starterForm.locator('input[name=listings]').fill('4'); await starterForm.locator('button:has-text("Save plan")').click();
ok((await submitted(admin, 'Edit plan Starter', 'status')).includes('Plan saved'), 'admin edits a plan limit');
// --- companies
const coName = `Initech ${tag}`;
await admin.goto(`${B}/dashboard/companies`, { waitUntil: 'networkidle' });
const addCo = admin.locator('form[aria-label="Add a company"]'); await addCo.locator('input[name=name]').fill(coName); await addCo.locator('input[name=website]').fill('https://initech.example'); await addCo.locator('button:has-text("Add company")').click();
ok((await submitted(admin, 'Add a company', 'status')).includes('Added'), 'admin adds a company directly');
await addCo.locator('input[name=name]').fill(coName); await addCo.locator('button:has-text("Add company")').click(); ok((await submitted(admin, 'Add a company', 'alert')).includes('already exists'), 'a duplicate company name is refused');
await admin.goto(`${B}/dashboard/companies?q=${encodeURIComponent(coName)}`); await admin.locator(`a:has-text("${coName}")`).click(); await admin.waitForURL(/\/dashboard\/companies\/.+/);
ok(await admin.locator('form[aria-label="Post a listing"]').count() === 1, 'a verified company offers the post-a-listing form');
const lf = admin.locator('form[aria-label="Post a listing"]'); const listTitle = `Admin Posted Intern ${tag}`;
await lf.locator('input[name=title]').fill(listTitle); await lf.locator('textarea[name=description]').fill('Work on real internal tools with a small team, ship weekly, learn code review.');
await lf.locator('input[name=payText]').fill('₹12,000 / month'); await lf.locator('input[name=monthlyINR]').fill('12000'); await lf.locator('input[name=location]').fill('Chennai'); await lf.locator('input[name=eligibility]').fill('B.E / B.Tech');
await lf.locator('input[name=deadline]').fill(new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)); await lf.locator('button:has-text("Post listing")').click();
ok((await submitted(admin, 'Post a listing', 'status')).includes('live'), 'admin posts a listing for a company and it goes live');
await anon.goto(`${B}/opportunities`, { waitUntil: 'networkidle' }); ok(await anon.locator(`text=${listTitle}`).count() > 0, 'the admin-posted listing is visible to the public');
await admin.reload({ waitUntil: 'networkidle' }); await admin.locator('li', { hasText: listTitle }).locator('button:has-text("Close")').click(); await admin.waitForTimeout(1200);
await anon.goto(`${B}/opportunities`, { waitUntil: 'networkidle' }); ok(await anon.locator(`text=${listTitle}`).count() === 0, 'a listing the admin closes disappears from the public list');
// --- colleges
const colName = `Zeta Institute ${tag}`;
await admin.goto(`${B}/dashboard/colleges`, { waitUntil: 'networkidle' }); const addCol = admin.locator('form[aria-label="Add a college"]'); await addCol.locator('input[name=name]').fill(colName); await addCol.locator('input[name=city]').fill('Coimbatore'); await addCol.locator('button:has-text("Add college")').click();
ok((await submitted(admin, 'Add a college', 'status')).includes('Added'), 'admin adds a verified college');
// --- mentors
const mEmail = `mentor${tag}@example.com`;
await admin.goto(`${B}/dashboard/mentors`, { waitUntil: 'networkidle' }); const addM = admin.locator('form[aria-label="Add a mentor"]');
for (const [k, v] of Object.entries({ name: `Maya Mentor ${tag}`, email: mEmail, roleTitle: 'Staff Engineer', company: 'Globex', country: 'India', domain: 'Backend', tags: 'APIs, Databases' })) await addM.locator(`input[name=${k}]`).fill(v);
await addM.locator('textarea[name=bio]').fill('I mentor freshers on backend engineering.'); await addM.locator('button:has-text("Add mentor")').click();
ok((await submitted(admin, 'Add a mentor', 'status')).includes('Added Maya'), 'admin adds a mentor with full profile details');
for (const [k, v] of Object.entries({ name: 'Dup Mentor', email: mEmail, roleTitle: 'X Role', company: 'X', country: 'India', domain: 'Backend' })) await addM.locator(`input[name=${k}]`).fill(v); await addM.locator('button:has-text("Add mentor")').click(); ok((await submitted(admin, 'Add a mentor', 'alert')).includes('already belongs'), 'a duplicate mentor email is refused');
const mCtx = await b.newContext({ viewport: { width: 1300, height: 900 }, extraHTTPHeaders: { 'x-forwarded-for': '203.0.113.60' } }); const mp = await mCtx.newPage(); mp.on('pageerror', (e) => { console.log('PAGEERROR', e.message); fails++; });
await auth(mp, 'login', mEmail); await mp.goto(`${B}/dashboard/mentoring`, { waitUntil: 'networkidle' });
ok(await mp.locator('input[name=roleTitle]').inputValue() === 'Staff Engineer', 'the admin-added mentor signs in and sees the details the admin entered');
await mp.fill('input[name=roleTitle]', 'Principal Engineer'); await mp.locator('form:has(input[name=roleTitle]) button').first().click(); await mp.waitForTimeout(1200); await mp.reload({ waitUntil: 'networkidle' });
ok(await mp.locator('input[name=roleTitle]').inputValue() === 'Principal Engineer', 'the mentor can update their own details afterwards');
// --- role change: a user asks, the admin decides; the account and its data are kept
await mp.goto(`${B}/dashboard/account`, { waitUntil: 'networkidle' });
await mp.locator('form[aria-label="Request a role change"] select[name=role]').selectOption('STUDENT'); await mp.locator('form[aria-label="Request a role change"] textarea[name=reason]').fill('I would like to apply for roles myself too.'); await mp.locator('form[aria-label="Request a role change"] button:has-text("Send request")').click();
await mp.waitForSelector('text=Waiting for an admin'); ok(await mp.locator('form[aria-label="Request a role change"]').count() === 0, 'a user can request a role change; the pending request replaces the form');
await admin.goto(`${B}/dashboard/users`, { waitUntil: 'networkidle' }); const rq = admin.locator('li', { hasText: `Maya Mentor ${tag}` }).filter({ hasText: 'Mentor → Student' });
ok(await rq.count() === 1, 'the admin sees the role request');
await rq.locator('button:has-text("Approve")').click(); await admin.waitForTimeout(1500);
await mp.goto(`${B}/dashboard/account`, { waitUntil: 'networkidle' }); ok(await mp.locator('text=signed in as').first().innerText().then((t) => /Student/.test(t)), 'approving moves the user to the new role');
await mp.goto(`${B}/dashboard/profile`, { waitUntil: 'networkidle' }); ok(!/login/.test(mp.url()) && await mp.locator('h1').count() > 0, 'the new role opens its pages (a student profile was created)');
await admin.goto(`${B}/dashboard/users?q=${encodeURIComponent(mEmail)}`, { waitUntil: 'networkidle' }); await admin.locator('summary:has-text("Change role")').first().click();
await admin.locator(`form[aria-label="Change role for Maya Mentor ${tag}"] select[name=role]`).selectOption('MENTOR'); await admin.locator(`form[aria-label="Change role for Maya Mentor ${tag}"] button:has-text("Change role")`).click();
ok((await submitted(admin, `Change role for Maya Mentor ${tag}`, 'status')).includes('Role changed'), 'the admin can change any user\'s role directly');
await admin.goto(`${B}/dashboard/users?q=admin@sample.kalwings.test`, { waitUntil: 'networkidle' }); await admin.locator('li', { hasText: 'admin@sample.kalwings.test' }).locator('summary:has-text("Change role")').click();
await admin.locator('form[aria-label^="Change role for"]:visible select[name=role]').selectOption('STUDENT'); await admin.locator('form[aria-label^="Change role for"]:visible button:has-text("Change role")').click();
ok((await submitted(admin, (await admin.locator('form[aria-label^="Change role for"]:visible').getAttribute('aria-label')), 'alert')).includes("own role"), 'an admin cannot change their own role');
// --- site settings
await admin.goto(`${B}/dashboard/site`, { waitUntil: 'networkidle' }); const sf = admin.locator('form[aria-label="Site settings"]');
await sf.locator('input[name=announcement]').fill(`Maintenance Sunday ${tag}`); await sf.locator('input[name=signup_COLLEGE_ADMIN]').uncheck(); await sf.locator('button:has-text("Save settings")').click();
ok((await submitted(admin, 'Site settings', 'status')).includes('saved'), 'admin saves site settings');
await anon.goto(`${B}/login`, { waitUntil: 'networkidle' }); ok(await anon.locator(`[data-testid=announcement]:has-text("Maintenance Sunday ${tag}")`).count() === 1, 'the announcement banner shows on the sign-in page');
await sf.locator('input[name=announcement]').fill(''); await sf.locator('input[name=signup_COLLEGE_ADMIN]').check(); await sf.locator('button:has-text("Save settings")').click(); await submitted(admin, 'Site settings', 'status');
await admin.goto(`${B}/dashboard/audit`); ok(await admin.locator('text=plan.updated').count() > 0 && await admin.locator('text=mentor.created').count() > 0, 'console changes are in the audit log');
await employer.goto(`${B}/dashboard/companies`); ok(!/\/dashboard\/companies/.test(employer.url()), 'only platform admins can open the companies console');

// --- admin audit
await admin.goto(`${B}/dashboard/audit`); ok(await admin.locator('text=company.verified').count() > 0, 'audit log records admin decisions');

// --- rate limit: 6th OTP for same identifier within hour is refused
const rl = await user(); const rid = `rl${tag}@example.com`; let blocked = false;
for (let i = 0; i < 7 && !blocked; i++) { await rl.goto(`${B}/login`); await rl.fill('input[name=identifier]', rid); await rl.click('button:has-text("Send one-time code")'); await rl.waitForSelector('input[name=code], p[role=alert]'); blocked = await rl.locator('p[role=alert]').count() > 0; }
ok(blocked, 'OTP request rate limit kicks in');

console.log(fails ? `\n${fails} FAILURE(S)` : '\nALL PASSED');
await b.close(); process.exit(fails ? 1 : 0);
