// Practice tests, PIN lookup, push registration and regional languages. Run against a DEV server:  E2E_BASE_URL=http://localhost:3077 node e2e/later-features.mjs
import { chromium } from 'playwright-core';
import fs from 'fs';
// Run against `npm run dev` (OTP codes are only shown in dev). Needs the sample seed (admin@sample.kalwings.test).
const B = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
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


const student = await user(), anon = await user();
await auth(student, 'join', `stu${tag}@example.com`, { name: `Test Student ${tag}`, role: 'STUDENT' });

// --- practice tests, PIN lookup, push registration, regional languages
await student.goto(`${B}/dashboard/practice`); ok(await student.locator('main >> text=Python basics').count() > 0 && await student.locator('main >> text=Not taken yet').count() > 0, 'practice tests are listed for students');
await student.goto(`${B}/dashboard/practice/python-basics`);
ok(!(await student.content()).includes('correct answer'), 'practice answers are not in the page before submitting');
const qs = await student.locator('fieldset').count(); ok(qs === 8, 'practice test shows all questions');
await student.locator('fieldset').nth(0).locator('input[type=radio]').nth(1).check(); // len([1,2,3]) = 3, right
await student.locator('fieldset').nth(1).locator('input[type=radio]').nth(0).check(); // wrong on purpose
await student.click('button:has-text("Submit answers")'); await student.waitForSelector('text=You scored 1 out of 8');
ok(await student.locator('text=correct answer').count() > 0 && await student.locator('text=employers never see it').count() > 0, 'practice shows score, right answers and reasons');
await student.goto(`${B}/dashboard/practice`); ok(await student.locator('main >> text=Best 1/8').count() > 0, 'practice best score is remembered privately');
ok((await anon.goto(`${B}/dashboard/practice`)) && /login/.test(anon.url()), 'practice needs sign-in');
ok((await student.goto(`${B}/dashboard/practice/no-such-test`)).status() === 404, 'unknown practice test is a 404');
const pinBad = await anon.request.get(`${B}/api/pincode/12345`); ok(pinBad.status() === 400, 'PIN lookup refuses a malformed PIN');
const pinOk = await anon.request.get(`${B}/api/pincode/500081`); ok([200, 404, 503].includes(pinOk.status()), 'PIN lookup answers or fails politely when the service is unreachable');
await anon.goto(`${B}/jobs-in`); ok(await anon.locator('input[inputmode=numeric]').count() === 1, 'city page offers PIN code search');
await anon.fill('input[inputmode=numeric]', '12'); await anon.click('button:has-text("Find")'); await anon.waitForSelector('text=Enter a 6-digit PIN code.'); ok(true, 'PIN form validates before calling the server');
const sub = { endpoint: `https://push.example.com/send/${tag}abcdefghijkl`, keys: { p256dh: 'B' + 'x'.repeat(86), auth: 'y'.repeat(22) } };
ok((await anon.request.get(`${B}/api/push/key`)).status() === 401, 'push key needs sign-in');
ok((await anon.request.post(`${B}/api/push/subscribe`, { data: sub })).status() >= 400, 'anonymous push subscription is refused');
const keyRes = await student.request.get(`${B}/api/push/key`); const pk = (await keyRes.json()).key; ok(keyRes.status() === 200 && /^[A-Za-z0-9_-]{80,100}$/.test(pk), 'signed-in people get the public push key');
const origin = { origin: B };
ok((await student.request.post(`${B}/api/push/subscribe`, { data: { ...sub, endpoint: 'http://push.example.com/x/abcdefghijkl' }, headers: origin })).status() === 400, 'push subscription must be https');
ok((await student.request.post(`${B}/api/push/subscribe`, { data: sub, headers: origin })).status() === 200, 'a valid push subscription is stored');
ok((await student.request.post(`${B}/api/push/subscribe`, { data: sub, headers: origin })).status() === 200, 'subscribing twice is harmless');
ok((await student.request.post(`${B}/api/push/subscribe`, { data: sub, headers: { origin: 'https://evil.example' } })).status() >= 400, 'push subscription from another site is refused');
ok((await student.request.post(`${B}/api/push/unsubscribe`, { data: { endpoint: sub.endpoint }, headers: origin })).status() === 200, 'a device can turn push off');
await student.goto(`${B}/dashboard/account`); ok(await student.locator('text=Notifications on this device').count() > 0, 'settings has a notifications panel');
await anon.goto(`${B}/`); await anon.selectOption('footer select', 'hi'); await anon.waitForSelector('nav[aria-label=Primary] >> text=अवसर');
ok(await anon.locator('footer >> text=गोपनीयता').count() > 0 && (await anon.getAttribute('html', 'lang')) === 'hi-IN', 'Hindi switches the menu, footer and page language');
await anon.reload(); await anon.waitForSelector('nav[aria-label=Primary] >> text=अवसर'); ok(true, 'the language choice is remembered');
await anon.selectOption('footer select', 'te'); await anon.waitForSelector('footer >> text=గోప్యత'); ok(true, 'Telugu works');
await anon.selectOption('footer select', 'en'); await anon.waitForSelector('nav[aria-label=Primary] >> text=Opportunities'); ok(true, 'English restores');


console.log(fails ? `\n${fails} FAILURE(S)` : '\nALL PASSED');
await b.close(); process.exit(fails ? 1 : 0);
