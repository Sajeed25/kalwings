// Starts nothing: run against an app whose DATABASE_URL is deliberately wrong (e.g. port 3399) in PRODUCTION mode.
//   DATABASE_URL=mysql://u:p@127.0.0.1:3399/x npm start      then      E2E_BASE_URL=http://localhost:3000 node e2e/degraded.mjs
// Verifies the public site degrades gracefully instead of crashing when the database is down.
import { chromium } from 'playwright-core';
const B = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let bad = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) bad++; };
const p = await (await b.newContext()).newPage();
const pageErrors = []; p.on('pageerror', (e) => pageErrors.push(e.message));
for (const path of ['/', '/contact', '/help', '/privacy', '/join', '/login', '/challenges']) {
  const r = await p.goto(B + path); ok(r.status() === 200, `${path} loads without the database (200)`);
}
let r = await p.goto(B + '/opportunities'); ok(r.status() === 200 && (await p.content()).includes('temporarily unavailable'), '/opportunities shows a friendly notice, not a crash');
r = await p.goto(B + '/mentors'); ok(r.status() === 200 && (await p.content()).includes('temporarily unavailable'), '/mentors shows a friendly notice, not a crash');
const h = await (await fetch(B + '/api/health')).json(); ok(h.ok === false && typeof h.db === 'string', `/api/health reports the category (${h.db})`);
const sm = await fetch(B + '/sitemap.xml'); ok(sm.status === 200 && (await sm.text()).includes('<loc>'), 'sitemap still lists static pages');
await p.goto(B + '/login'); await p.fill('input[name=identifier]', 'someone@example.com'); await p.click('button:has-text("Send one-time code")'); await p.waitForSelector('p[role=alert]');
ok((await p.locator('p[role=alert]').innerText()).includes('trouble connecting'), 'sign-in shows a friendly message instead of crashing');
await p.goto(B + '/contact'); await p.fill('input[name=name]', 'Asha'); await p.fill('input[name=email]', 'a@example.com'); await p.fill('textarea[name=message]', 'Testing while the database is down.'); await p.click('button:has-text("Send message")'); await p.waitForTimeout(1500);
const txt = await p.locator('form').innerText(); ok(/couldn't send|Thanks/.test(txt), 'contact form answers cleanly (email fallback or clear error)');
await p.goto(B + '/dashboard'); ok(/login/.test(p.url()) || (await p.content()).includes('snag'), '/dashboard redirects to login or shows the friendly error page');
ok(pageErrors.length === 0, 'no uncaught browser errors ' + (pageErrors[0] ?? ''));
await b.close(); console.log(bad ? 'FAILURES' : 'ALL PASSED'); process.exit(bad ? 1 : 0);
