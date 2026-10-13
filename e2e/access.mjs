// Access-control matrix. Run against a DEV server with the seed loaded:  E2E_BASE_URL=http://localhost:3077 node e2e/access.mjs
// Every protected page and API is requested as every role (and anonymously). "Blocked" means redirected away, 401/403/404.
import { chromium } from 'playwright-core';
const B = process.env.E2E_BASE_URL ?? 'http://localhost:3077';
const SAMPLE = { STUDENT: 'student@sample.kalwings.test', EMPLOYER: 'sample-co-a@sample.kalwings.test', PLATFORM_ADMIN: 'admin@sample.kalwings.test', COLLEGE_ADMIN: 'college@sample.kalwings.test', MENTOR: 'sample-mentor-1@sample.kalwings.test' };
const ROLES = ['ANON', ...Object.keys(SAMPLE)];
const ALL = ['STUDENT', 'EMPLOYER', 'PLATFORM_ADMIN', 'COLLEGE_ADMIN', 'MENTOR'];
const PAGES = {
  '/dashboard': ALL, '/dashboard/notifications': ALL, '/dashboard/account': ALL,
  '/dashboard/profile': ['STUDENT'], '/dashboard/portfolio': ['STUDENT'], '/dashboard/passport': ['STUDENT'], '/dashboard/copilot': ['STUDENT'], '/dashboard/applications': ['STUDENT'], '/dashboard/submissions': ['STUDENT'], '/dashboard/saved': ['STUDENT'], '/dashboard/mentoring': ['STUDENT', 'MENTOR'],
  '/dashboard/interviews': ['STUDENT', 'EMPLOYER'], '/dashboard/assessments': ['STUDENT', 'EMPLOYER'], '/dashboard/drives': ['STUDENT', 'EMPLOYER', 'COLLEGE_ADMIN'],
  '/dashboard/company': ['EMPLOYER'], '/dashboard/roles': ['EMPLOYER'], '/dashboard/challenges': ['EMPLOYER'], '/dashboard/talent': ['EMPLOYER'], '/dashboard/pipeline': ['EMPLOYER'], '/dashboard/analytics': ['EMPLOYER'], '/dashboard/jd-check': ['EMPLOYER'],
  '/dashboard/college': ['COLLEGE_ADMIN'],
  '/dashboard/moderation': ['PLATFORM_ADMIN'], '/dashboard/credentials': ['PLATFORM_ADMIN'], '/dashboard/plans': ['PLATFORM_ADMIN'], '/dashboard/insights': ['PLATFORM_ADMIN'], '/dashboard/reports': ['PLATFORM_ADMIN'], '/dashboard/users': ['PLATFORM_ADMIN'], '/dashboard/audit': ['PLATFORM_ADMIN'], '/dashboard/inbox': ['PLATFORM_ADMIN'], '/dashboard/errors': ['PLATFORM_ADMIN'],
  '/community/teammates': ['STUDENT', 'EMPLOYER', 'PLATFORM_ADMIN', 'COLLEGE_ADMIN', 'MENTOR'],
};
const APIS = { '/api/college/report?type=roster': ['COLLEGE_ADMIN'], '/api/college/report?type=drives': ['COLLEGE_ADMIN'], '/api/account/export': ALL, '/api/interviews/nonexistent/ics': [] , '/api/sessions/nonexistent/ics': [] };
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let bad = 0, n = 0;
for (const role of ROLES) {
  const ctx = await b.newContext(); const p = await ctx.newPage();
  if (role !== 'ANON') {
    await p.goto(B + '/login'); await p.fill('input[name=identifier]', SAMPLE[role]); await p.click('button:has-text("Send one-time code")'); await p.waitForSelector('input[name=code]');
    await p.fill('input[name=code]', (await p.locator('text=Your code is').locator('b').innerText()).trim()); await p.click('button:has-text("Log in")'); await p.waitForURL(/dashboard/, { timeout: 20000 });
  }
  for (const [path, allowed] of Object.entries(PAGES)) {
    const res = await p.goto(B + path); const stayed = new URL(p.url()).pathname === path.split('?')[0] && res.status() < 400;
    const want = allowed.includes(role); n++;
    if (stayed !== want) { bad++; console.log(`FAIL ${role} ${path}: expected ${want ? 'allowed' : 'blocked'}, got ${stayed ? 'allowed' : 'blocked'} (${p.url().replace(B, '')}, ${res.status()})`); }
  }
  for (const [path, allowed] of Object.entries(APIS)) {
    const r = await ctx.request.get(B + path); const ok = r.status() === 200; const want = allowed.includes(role); n++;
    if (ok !== want) { bad++; console.log(`FAIL ${role} ${path}: expected ${want ? 'allowed' : 'blocked'}, got HTTP ${r.status()}`); }
  }
  // state-changing API must refuse anonymous callers
  if (role === 'ANON') for (const [m, path] of [['POST', '/api/upload'], ['GET', '/api/account/export']]) { const r = await ctx.request.fetch(B + path, { method: m }); n++; if (![401, 403, 405].includes(r.status())) { bad++; console.log(`FAIL ANON ${m} ${path}: HTTP ${r.status()}`); } }
  await ctx.close();
}
console.log(bad ? `\n${bad} of ${n} access checks FAILED` : `\nALL ${n} ACCESS CHECKS PASSED (${ROLES.length} roles x pages and APIs)`); await b.close(); process.exit(bad ? 1 : 0);
