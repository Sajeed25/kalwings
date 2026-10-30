// Generates the annotated screenshots for the manual. Needs a dev server on :3000 and a freshly seeded database (npm run db:seed).
// Run: node docs/manual/shots.mjs     (CHROMIUM_PATH=/path/to/chrome if Playwright's own browser is not installed)
import { chromium } from 'playwright-core';
import fs from 'fs';
const B = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const CLEAN = process.env.CLEAN === '1';   // CLEAN=1: no drawn marks; writes img-clean/ and boxes.json for the animated video
const OUT = new URL(CLEAN ? './img-clean/' : './img/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const BOXES = {};
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let ip = 10;
async function ctx(w = 1280, h = 900) { const c = await b.newContext({ viewport: { width: w, height: h }, extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${ip++}` } }); const p = await c.newPage(); p.on('pageerror', (e) => console.log('PAGEERROR', e.message)); return p; }
async function login(p, email) {
  await p.goto(`${B}/login`, { waitUntil: 'networkidle' }); await p.fill('input[name=identifier]', email); await p.click('button:has-text("Send one-time code")');
  await p.waitForSelector('input[name=code]'); const code = (await p.locator('text=Your code is').locator('b').innerText()).trim();
  await p.fill('input[name=code]', code); await p.click('button:has-text("Log in")'); await p.waitForURL(/dashboard/);
}
const go = async (p, path) => { await p.goto(`${B}${path}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(400); };

/** Draws red outlines and numbered badges over elements, then saves a PNG (cropped to maxH). */
async function shot(p, name, marks = [], { maxH = 1500, full = true, generic = false, from = null } = {}) {
  await p.addStyleTag({ content: 'html{scroll-behavior:auto !important}' }).catch(() => {});
  await p.evaluate(() => { document.querySelectorAll('[data-mark]').forEach((e) => e.remove()); window.scrollTo(0, 0); });
  if (generic && !marks.length) marks = ['nav[aria-label="Dashboard"]', 'h1', '.card'];
  const boxes = [];
  for (const [i, sel] of marks.entries()) {
    const loc = p.locator(sel).first();
    if (!(await loc.count())) { console.log('  ! missing mark', name, sel); continue; }
    // document coordinates, measured in one step so scrolling cannot shift them
    const bb = await loc.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height }; });
    boxes.push({ n: i + 1, bb });
  }
  if (!CLEAN) await p.evaluate((boxes) => {
    for (const { n, bb } of boxes) {
      const o = document.createElement('div'); o.setAttribute('data-mark', '1');
      Object.assign(o.style, { position: 'absolute', left: bb.x - 4 + 'px', top: bb.y - 4 + 'px', width: bb.width + 8 + 'px', height: bb.height + 8 + 'px', border: '3px solid #ff2d55', borderRadius: '10px', pointerEvents: 'none', zIndex: 99998 });
      const d = document.createElement('div'); d.setAttribute('data-mark', '1'); d.textContent = String(n);
      Object.assign(d.style, { position: 'absolute', left: Math.max(2, bb.x - 14) + 'px', top: Math.max(2, bb.y - 14) + 'px', width: '28px', height: '28px', borderRadius: '50%', background: '#ff2d55', color: '#fff', font: '700 15px/28px system-ui,sans-serif', textAlign: 'center', zIndex: 99999, pointerEvents: 'none', boxShadow: '0 0 0 2px #fff' });
      document.body.append(o, d);
    }
  }, boxes);
  const h = await p.evaluate(() => Math.max(document.documentElement.scrollHeight, 600));
  let y0 = 0;
  if (from) y0 = Math.max(0, Math.round(await p.locator(from).first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY)) - 24);
  const hh = Math.max(200, Math.min(h - y0, maxH));
  BOXES[name] = { w: p.viewportSize().width, h: hh, boxes: boxes.map(({ n, bb }) => ({ n, x: bb.x, y: bb.y - y0, w: bb.width, h: bb.height })) };
  await p.screenshot({ path: `${OUT}${name}.png`, clip: { x: 0, y: y0, width: p.viewportSize().width, height: Math.max(200, Math.min(h - y0, maxH)) }, fullPage: full });
  console.log('shot', name, boxes.length, 'marks');
}
const submitted = async (p, label, kind = 'status') => { await p.waitForSelector(`form[aria-label="${label}"] [role=${kind}]:not(:empty)`); };

// ---------- sign-in (public) ----------
const anon = await ctx();
await go(anon, '/login'); await shot(anon, '01-login', ['input[name=identifier]', 'button:has-text("Send one-time code")']);
await anon.fill('input[name=identifier]', 'student@sample.kalwings.test'); await anon.click('button:has-text("Send one-time code")'); await anon.waitForSelector('input[name=code]');
await shot(anon, '02-login-code', ['input[name=code]', 'button:has-text("Log in")']);
await go(anon, '/join'); await shot(anon, '03-join', ['select[name=role]', 'input[name=identifier]']);
await go(anon, '/opportunities'); await shot(anon, '04-opportunities-public', [], { maxH: 1200 });
await go(anon, '/mentors'); await shot(anon, '05-mentors-public', [], { maxH: 1200 });

// ---------- admin ----------
const admin = await ctx(); await login(admin, 'admin@sample.kalwings.test');
await go(admin, '/dashboard'); await shot(admin, '10-admin-home', ['nav a:has-text("Companies")', 'nav a:has-text("Bulk upload")', 'nav a:has-text("Launch readiness")'], { maxH: 1100 });

// plans
await go(admin, '/dashboard/plans');
const pf = admin.locator('form[aria-label="Add a plan"]');
await pf.locator('input[name=key]').fill('CAMPUS'); await pf.locator('input[name=label]').fill('Campus'); await pf.locator('input[name=priceText]').fill('₹4,999 / month'); await pf.locator('textarea[name=features]').fill('Priority support\nCampus drives\nUnlimited shortlists');
await pf.locator('input[name=listings]').fill('10'); await pf.locator('input[name=challenges]').fill('3'); await pf.locator('input[name=assessments]').fill('5'); await pf.locator('input[name=team]').fill('5'); await pf.locator('button:has-text("Add plan")').click(); await submitted(admin, 'Add a plan');
await go(admin, '/dashboard/plans');
await shot(admin, '20-plans', ['section:has(h2:has-text("Campus")) input[name=label]', 'section:has(h2:has-text("Campus")) input[name=priceText]', 'section:has(h2:has-text("Campus")) textarea[name=features]', 'section:has(h2:has-text("Campus")) input[name=listings]', 'section:has(h2:has-text("Campus")) button:has-text("Save plan")'], { maxH: 1050 });
await shot(admin, '20b-plans-add', ['section:has(h2:has-text("Add a plan"))', 'form[aria-label="Add a plan"] input[name=key]', 'form[aria-label="Add a plan"] button:has-text("Add plan")'], { maxH: 1100, from: 'section:has(h2:has-text("Add a plan"))' });
await shot(admin, '20c-plans-assign', ['h2:has-text("Assign plans to companies")', 'form[role=search]', 'li:has-text("Sample Co. A") button:text-is("Growth")'], { maxH: 900, from: 'h2:has-text("Assign plans to companies")' });

// companies
await go(admin, '/dashboard/companies');
const cf = admin.locator('form[aria-label="Add a company"]');
await cf.locator('input[name=name]').fill('Demo Company Pvt Ltd'); await cf.locator('input[name=website]').fill('https://demo.example'); await cf.locator('textarea[name=about]').fill('A demo company created for this manual.'); await cf.locator('button:has-text("Add company")').click(); await submitted(admin, 'Add a company');
await go(admin, '/dashboard/companies'); await shot(admin, '21-companies', ['form[aria-label="Add a company"]', 'form[role=search]', 'a:has-text("Demo Company Pvt Ltd")'], { maxH: 1300 });
await admin.locator('a:has-text("Demo Company Pvt Ltd")').click(); await admin.waitForURL(/companies\/.+/); await admin.waitForLoadState('networkidle');
const companyUrl = admin.url();
await shot(admin, '22-company-detail', ['section:has(h2:has-text("Company details"))', 'form[aria-label="Edit company"] select[name=status]', 'form[aria-label="Edit company"] select[name=plan]', 'section:has(h2:has-text("Team"))'], { maxH: 1000 });
const lf = admin.locator('form[aria-label="Post a listing"]');
await lf.locator('input[name=title]').fill('Junior Web Developer (Demo)'); await lf.locator('textarea[name=description]').fill('Demo listing: build and ship features on a small product team, learn code review and testing, weekly mentoring.');
await lf.locator('input[name=payText]').fill('₹15,000 / month'); await lf.locator('input[name=monthlyINR]').fill('15000'); await lf.locator('input[name=location]').fill('Hyderabad'); await lf.locator('input[name=eligibility]').fill('B.E / B.Tech, 2026 batch');
await lf.locator('input[name=deadline]').fill(new Date(Date.now() + 40 * 864e5).toISOString().slice(0, 10)); await lf.locator('button:has-text("Post listing")').click(); await submitted(admin, 'Post a listing');
await go(admin, new URL(companyUrl).pathname); await shot(admin, '23-company-listing', ['form[aria-label="Post a listing"]', 'section:has(h2:has-text("Listings"))'], { maxH: 2000 });

// colleges
await go(admin, '/dashboard/colleges'); const colf = admin.locator('form[aria-label="Add a college"]');
await colf.locator('input[name=name]').fill('Demo College of Engineering'); await colf.locator('input[name=city]').fill('Hyderabad'); await colf.locator('button:has-text("Add college")').click(); await submitted(admin, 'Add a college');
await go(admin, '/dashboard/colleges'); await shot(admin, '24-colleges', ['form[aria-label="Add a college"]', 'li:has-text("Demo College") summary:has-text("Edit")'], { maxH: 900 });

// mentors
await go(admin, '/dashboard/mentors'); const mf = admin.locator('form[aria-label="Add a mentor"]');
for (const [k, v] of Object.entries({ name: 'Demo Mentor', email: 'demo.mentor@example.com', roleTitle: 'Staff Engineer', company: 'Demo Company Pvt Ltd', country: 'India', domain: 'Backend', tags: 'APIs, Databases, System design' })) await mf.locator(`input[name=${k}]`).fill(v);
await mf.locator('textarea[name=bio]').fill('Demo mentor profile created for this manual.'); await mf.locator('button:has-text("Add mentor")').click(); await submitted(admin, 'Add a mentor');
await go(admin, '/dashboard/mentors'); await shot(admin, '25-mentors', ['form[aria-label="Add a mentor"]', 'li:has-text("Demo Mentor") summary:has-text("Edit")'], { maxH: 1600 });

// users + role requests (mentor asks first)
const mentor = await ctx(); await login(mentor, 'demo.mentor@example.com');
await go(mentor, '/dashboard/mentoring'); await shot(mentor, '60-mentor-profile', ['input[name=roleTitle]', 'section:has(h2:has-text("Office-hour slots"))'], { maxH: 900 });
await go(mentor, '/dashboard/account');
await mentor.locator('form[aria-label="Request a role change"] select[name=role]').selectOption('STUDENT'); await mentor.locator('form[aria-label="Request a role change"] textarea[name=reason]').fill('I would like to apply for roles myself as well.');
await shot(mentor, '61-request-role', ['form[aria-label="Request a role change"] select[name=role]', 'form[aria-label="Request a role change"] textarea[name=reason]', 'form[aria-label="Request a role change"] button:has-text("Send request")'], { maxH: 1500 });
await mentor.locator('form[aria-label="Request a role change"] button:has-text("Send request")').click(); await mentor.waitForSelector('text=Waiting for an admin');
await go(admin, '/dashboard/users'); await shot(admin, '26-users', ['section:has(h2:has-text("Role requests"))', 'form[aria-label="Add a user"]', 'li:has-text("Demo Mentor") summary:has-text("Change role")', 'form[role=search]'], { maxH: 1500 });

// bulk upload
await go(admin, '/dashboard/bulk');
const csv = 'name,email,college,graduation_year,city\r\nAsha Demo,asha.demo@example.com,Demo College of Engineering,2026,Hyderabad\r\nRavi Demo,ravi.demo@example.com,,2027,Chennai\r\nBroken Row,not-an-email,,,\r\n';
const sp = admin.locator('section[aria-label="Bulk upload Students"]');
await sp.locator('input[type=file]').setInputFiles({ name: 'students.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
await sp.locator('button:text-is("Preview")').click(); await sp.locator('[data-testid=bulk-summary]').waitFor();
await shot(admin, '27-bulk-preview', ['section[aria-label="Bulk upload Students"] a:has-text("Download template")', 'section[aria-label="Bulk upload Students"] input[type=file]', 'section[aria-label="Bulk upload Students"] button:text-is("Preview")', 'section[aria-label="Bulk upload Students"] button:text-is("Import")', '[data-testid=bulk-summary]'], { maxH: 1400 });
await sp.locator('button:text-is("Import")').click(); await sp.locator('[data-testid=bulk-summary]:has-text("Imported")').waitFor();
await shot(admin, '28-bulk-imported', ['[data-testid=bulk-summary]'], { maxH: 1100 });
await go(admin, '/dashboard/bulk'); await shot(admin, '29-bulk-page', ['section[aria-label="Bulk upload Students"]', 'section[aria-label="Bulk upload Companies"]', 'section[aria-label="Bulk upload Mentors"]'], { maxH: 1700 });

// site settings, launch
await go(admin, '/dashboard/site'); await admin.fill('input[name=announcement]', 'Welcome to Kalwings: this is a demo announcement.');
await shot(admin, '30-site-settings', ['input[name=announcement]', 'input[name=supportEmail]', 'fieldset', 'button:has-text("Save settings")'], { maxH: 800 });
await admin.click('button:has-text("Save settings")'); await submitted(admin, 'Site settings');
await go(admin, '/dashboard/launch'); await shot(admin, '31-launch', ['li:has-text("A real platform admin exists")', 'li:has-text("Sign-in emails can be sent")', 'li:has-text("Real companies added")'], { maxH: 1300 });
// restore banner so later shots are clean
await go(admin, '/dashboard/site'); await admin.fill('input[name=announcement]', ''); await admin.click('button:has-text("Save settings")'); await submitted(admin, 'Site settings');

// review + operations screens
for (const [file, path, marks] of [['32-moderation', '/dashboard/moderation', []], ['33-credentials', '/dashboard/credentials', []], ['34-reports', '/dashboard/reports', []], ['35-inbox', '/dashboard/inbox', []], ['36-insights', '/dashboard/insights', []], ['37-audit', '/dashboard/audit', []], ['38-errors', '/dashboard/errors', []]]) { await go(admin, path); await shot(admin, file, marks, { maxH: ({ '32-moderation': 1000, '33-credentials': 560, '34-reports': 560, '35-inbox': 560, '36-insights': 1000, '37-audit': 760, '38-errors': 560 })[file], generic: true }); }

// admin approves the role request (shot before and after)
await go(admin, '/dashboard/users');
// ---------- student ----------
const student = await ctx(); await login(student, 'student@sample.kalwings.test');
await go(student, '/dashboard'); await shot(student, '40-student-home', [], { maxH: 1000, generic: true });
await go(student, '/dashboard/profile'); await shot(student, '41-student-profile', [], { maxH: 1100, generic: true });
await go(student, '/opportunities'); await shot(student, '42-student-opportunities', ['h1', 'input[placeholder^="Describe"]', 'a:has-text("View details"), button:has-text("View details")'], { maxH: 1000 });
await go(student, '/dashboard/applications'); await shot(student, '43-student-applications', ['nav[aria-label="Dashboard"]', 'h1', 'a:has-text("Challenge submissions")'], { maxH: 560 });
await go(student, '/dashboard/copilot'); await shot(student, '44-student-copilot', [], { maxH: 1000, generic: true });
await go(student, '/dashboard/account'); await shot(student, '45-student-settings', ['section:has(h2:has-text("Change my role"))', 'section:has(h2:has-text("Password login (optional)"))', 'section:has(h2:has-text("Delete my account"))'], { maxH: 2000 });

// ---------- employer ----------
const emp = await ctx(); await login(emp, 'sample-co-a@sample.kalwings.test');
await go(emp, '/dashboard/company'); await shot(emp, '50-employer-company', [], { maxH: 1300, generic: true });
await go(emp, '/dashboard/roles'); await shot(emp, '51-employer-roles', [], { maxH: 1300, generic: true });
await go(emp, '/dashboard/pipeline'); await shot(emp, '52-employer-pipeline', [], { maxH: 800, generic: true });
await go(emp, '/dashboard/talent'); await shot(emp, '53-employer-talent', [], { maxH: 700, generic: true });

// ---------- college ----------
const col = await ctx(); await login(col, 'college@sample.kalwings.test');
await go(col, '/dashboard/college'); await shot(col, '70-college', [], { maxH: 1000, generic: true });
await go(col, '/dashboard/drives'); await shot(col, '71-college-drives', [], { maxH: 900, generic: true });

// ---------- phone ----------
const ph = await ctx(390, 844); await login(ph, 'student@sample.kalwings.test'); await go(ph, '/dashboard'); await shot(ph, '80-phone-home', [], { maxH: 1400, generic: true });

if (CLEAN) fs.writeFileSync(OUT + 'boxes.json', JSON.stringify(BOXES));
await b.close();
console.log('done');
