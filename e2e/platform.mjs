import { chromium } from 'playwright-core';
import fs from 'fs';
// Optional: set MAIL_CAPTURE (and start the app with EMAIL_API_URL=<mock>, EMAIL_API_KEY, EMAIL_FROM) to also test notification emails.
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
await employer.click('button:has-text("Move to Shortlisted")'); await employer.waitForTimeout(800);
await employer.reload();
ok(await employer.locator(`section[aria-label=Shortlisted] >> text=Test Student ${tag}`).count() > 0, 'moved to Shortlisted');
if (MAIL) fs.rmSync(MAIL, { force: true });
await employer.locator('summary:has-text("Notes")').click();
await employer.fill('input[name=body]', 'Hi! Could we schedule a call?'); await employer.click('button:has-text("Send")'); await employer.waitForSelector('text=Sent');
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
  await employer.fill('input[name=body]', 'Following up on my message.'); await employer.click('button:has-text("Send")'); await employer.waitForTimeout(1200);
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
await student.goto(`${B}/dashboard`); await student.click('a:has-text("View my Talent Card")'); await student.waitForURL(/\/t\//); await student.waitForSelector('text=Verified skills');
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
await student.goto(`${B}/dashboard`); await student.click('a:has-text("View my Talent Card")'); await student.waitForURL(/\/t\//);
ok(await student.locator('img[alt^="Photo of Test Student"]').count() === 1 && await student.locator('img[alt^="Screenshot of"]').count() === 1, 'Talent Card shows photo and project screenshot');
// deleting the project removes its screenshot
await student.goto(`${B}/dashboard/portfolio`); student.once('dialog', (d) => d.accept()); await student.locator('button:has-text("Delete")').first().click(); await student.waitForTimeout(1200);
ok((await student.request.get(B + shotUrl)).status() === 404, 'deleting a project deletes its screenshot');
// mentor photo shows in the public directory
await mentor.goto(`${B}/dashboard/mentoring`); await mentor.setInputFiles('input[type=file][aria-label="Upload photo"]', { name: 'm.png', mimeType: 'image/png', buffer: PNG }); await mentor.waitForSelector('img[src^="/api/files/"]');
await student.goto(`${B}/mentors`); ok(await student.locator(`img[alt="Photo of Test Mentor ${tag}"]`).count() === 1, 'mentor photo appears in the directory');

// --- admin audit
await admin.goto(`${B}/dashboard/audit`); ok(await admin.locator('text=company.verified').count() > 0, 'audit log records admin decisions');

// --- rate limit: 6th OTP for same identifier within hour is refused
const rl = await user(); const rid = `rl${tag}@example.com`; let blocked = false;
for (let i = 0; i < 7 && !blocked; i++) { await rl.goto(`${B}/login`); await rl.fill('input[name=identifier]', rid); await rl.click('button:has-text("Send one-time code")'); await rl.waitForSelector('input[name=code], p[role=alert]'); blocked = await rl.locator('p[role=alert]').count() > 0; }
ok(blocked, 'OTP request rate limit kicks in');

console.log(fails ? `\n${fails} FAILURE(S)` : '\nALL PASSED');
await b.close(); process.exit(fails ? 1 : 0);
