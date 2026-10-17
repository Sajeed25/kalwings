// Records a live product demo of the REAL app: a student completes a challenge, an employer reviews the proof.
// Needs: dev server on :3000 with a freshly seeded DB (ADMIN_EMAILS empty), ffmpeg, python3 + docs/video/mux.py, and `python3 docs/demo/gen-audio.py` run first.
// Usage: CHROMIUM_PATH=/path/to/chrome node docs/demo/demo.mjs      (DRY=1 skips narration timing, to rehearse selectors quickly)
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const B = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const HERE = new URL('./', import.meta.url).pathname; const DOCS = new URL('../', import.meta.url).pathname;
const OUT = process.env.OUT ?? DOCS + 'KALWINGS-Live-Demo.mp4'; const DRY = process.env.DRY === '1';
const TMP = HERE + '_rec'; fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
const SCRIPT = JSON.parse(fs.readFileSync(HERE + 'script.json', 'utf8')); const TEXT = Object.fromEntries(SCRIPT.beats.map((b) => [b.key, b.text]));
const DUR = DRY ? {} : JSON.parse(fs.readFileSync(HERE + '_audio/durations.json', 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const tag = Date.now().toString().slice(-5);
const CH = { title: 'Clean and chart noisy sensor data', desc: 'Build a small dashboard that visualises noisy sensor data and explains the trade-offs you made.', brief: 'You get a CSV of temperature readings with gaps and spikes. Clean it, chart it, and explain your approach in a short write-up.', rubric: 'Correctness | 40 | Cleans the data properly\nClarity | 30 | Chart is readable\nWrite-up | 30 | Explains trade-offs' };

// ---------- setup (not recorded): sign in the three roles, post + approve the challenge ----------
let n = 20;
async function signIn(email) {
  const c = await b.newContext({ viewport: { width: 1280, height: 720 }, extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${n++}` } }); const p = await c.newPage();
  await p.goto(`${B}/login`, { waitUntil: 'networkidle' }); await p.fill('input[name=identifier]', email); await p.click('button:has-text("Send one-time code")');
  await p.waitForSelector('input[name=code]'); const code = (await p.locator('text=Your code is').locator('b').innerText()).trim();
  await p.fill('input[name=code]', code); await p.click('button:has-text("Log in")'); await p.waitForURL(/dashboard/);
  return { c, p, cookies: await c.cookies() };
}
const stu = await signIn('student@sample.kalwings.test'), emp = await signIn('sample-co-a@sample.kalwings.test'), adm = await signIn('admin@sample.kalwings.test');
await emp.p.goto(`${B}/dashboard/challenges`, { waitUntil: 'networkidle' });
await emp.p.fill('input[name=title]', CH.title); await emp.p.fill('textarea[name=description]', CH.desc); await emp.p.fill('textarea[name=brief]', CH.brief); await emp.p.fill('textarea[name=rubric]', CH.rubric); await emp.p.fill('input[name=skillTag]', 'Data Viz');
await emp.p.check('input[name=unpaid]'); await emp.p.fill('input[name=payText]', 'Unpaid, certificate of completion'); await emp.p.fill('input[name=location]', 'Pan-India'); await emp.p.fill('input[name=eligibility]', 'Final-year students and recent graduates'); await emp.p.fill('input[name=deadline]', new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10));
await emp.p.click('button:has-text("Submit for moderation")'); await emp.p.waitForSelector('text=Submitted. It goes live');
await adm.p.goto(`${B}/dashboard/moderation`, { waitUntil: 'networkidle' }); await adm.p.locator('li', { hasText: CH.title }).locator('button:has-text("Approve")').click(); await adm.p.waitForTimeout(1500);
// warm every page the take will visit, so the dev server has compiled them and nothing lags behind the voice
for (const path of ['/challenges', '/dashboard/submissions', '/dashboard/applications', '/talent/sample-student', '/dashboard/passport']) await stu.p.goto(B + path, { waitUntil: 'networkidle' });
await stu.p.goto(B + '/challenges', { waitUntil: 'networkidle' }); await stu.p.locator(`a:has-text("${CH.title}")`).first().click(); await stu.p.waitForLoadState('networkidle');
for (const path of ['/dashboard/challenges', '/dashboard/pipeline', '/dashboard/talent?q=Data+Viz', '/dashboard/roles']) await emp.p.goto(B + path, { waitUntil: 'networkidle' });
await emp.p.locator(`a:has-text("${CH.title}")`).first().click().catch(() => {}); await emp.p.waitForLoadState('networkidle');
for (const x of [stu, emp, adm]) await x.c.close();
console.log('setup done: challenge posted and approved');

// ---------- recording ----------
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: TMP, size: { width: 1280, height: 720 } } });
await ctx.addInitScript(() => {
  const css = `nextjs-portal,[data-nextjs-toast],[data-next-badge-root]{display:none !important}#__cap{pointer-events:none;position:fixed;left:50%;transform:translateX(-50%);bottom:22px;max-width:1040px;width:max-content;background:rgba(14,14,17,.93);color:#f5f2ec;border:1px solid #3a3a44;border-radius:16px;padding:12px 22px;font:600 20px/1.35 Inter,system-ui,sans-serif;z-index:2147483000;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.5);transition:opacity .35s}
  #__act{pointer-events:none;position:fixed;right:18px;top:60px;background:#ff5b2e;color:#0e0e11;border-radius:99px;padding:6px 16px;font:800 15px Inter,system-ui,sans-serif;letter-spacing:.04em;z-index:2147483000;box-shadow:0 6px 20px rgba(0,0,0,.4)}
  #__cur{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483600;pointer-events:none;transition:transform .05s linear;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}
  .__rip{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:4px solid #ffd66b;z-index:2147483500;pointer-events:none;animation:__r .7s ease-out forwards}@keyframes __r{from{opacity:1;transform:scale(.2)}to{opacity:0;transform:scale(2.4)}}
  .__ring{position:absolute;border:4px solid #ff2d55;border-radius:12px;z-index:2147482000;pointer-events:none;animation:__p 1.2s ease-out infinite}@keyframes __p{0%{box-shadow:0 0 0 0 rgba(255,45,85,.7)}100%{box-shadow:0 0 0 20px rgba(255,45,85,0)}}
  #__card{position:fixed;inset:0;z-index:2147483900;background:radial-gradient(60% 60% at 25% 20%,#2a1260,transparent),radial-gradient(50% 50% at 85% 90%,#5a2410,transparent),#0e0e11;color:#f5f2ec;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:Inter,system-ui,sans-serif;opacity:0;transition:opacity .6s}
  #__card.on{opacity:1}#__card .l{font-weight:800;font-size:90px;letter-spacing:.14em;background:linear-gradient(90deg,#8cf0be,#7c2ff6 40%,#10f27d);-webkit-background-clip:text;color:transparent}
  #__card .k{margin-top:10px;color:#ff8a65;letter-spacing:.3em;text-transform:uppercase;font-weight:700;font-size:20px}#__card .s{margin-top:14px;font-size:30px;color:#d8d6de;max-width:900px}`;
  const boot = () => {
    if (document.getElementById('__cur')) return;
    const st = document.createElement('style'); st.textContent = css; document.documentElement.appendChild(st);
    const cur = document.createElement('div'); cur.id = '__cur'; cur.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 2l16 9-7 2 4 8-3 1.5-4-8-6 5z" fill="#fff" stroke="#111" stroke-width="1.5"/></svg>'; document.documentElement.appendChild(cur);
    const m = JSON.parse(sessionStorage.getItem('__pos') || '[640,360]'); cur.style.transform = `translate(${m[0]}px,${m[1]}px)`;
    const a = sessionStorage.getItem('__act'); if (a) { const e = document.createElement('div'); e.id = '__act'; e.textContent = a; document.documentElement.appendChild(e); }
    const c = sessionStorage.getItem('__cap'); if (c) { const e = document.createElement('div'); e.id = '__cap'; e.textContent = c; document.documentElement.appendChild(e); }
    addEventListener('mousemove', (ev) => { cur.style.transform = `translate(${ev.clientX}px,${ev.clientY}px)`; sessionStorage.setItem('__pos', JSON.stringify([ev.clientX, ev.clientY])); }, true);
    addEventListener('mousedown', (ev) => { const r = document.createElement('div'); r.className = '__rip'; r.style.left = ev.clientX + 'px'; r.style.top = ev.clientY + 'px'; document.documentElement.appendChild(r); setTimeout(() => r.remove(), 800); }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.__demo = {
    cap(t) { sessionStorage.setItem('__cap', t || ''); let e = document.getElementById('__cap'); if (!t) { e?.remove(); return; } if (!e) { e = document.createElement('div'); e.id = '__cap'; document.documentElement.appendChild(e); } e.textContent = t; },
    act(t) { sessionStorage.setItem('__act', t || ''); let e = document.getElementById('__act'); if (!t) { e?.remove(); return; } if (!e) { e = document.createElement('div'); e.id = '__act'; document.documentElement.appendChild(e); } e.textContent = t; },
    card(k, s) { let e = document.getElementById('__card'); if (!k) { if (e) { e.classList.remove('on'); setTimeout(() => e.remove(), 700); } return; } e = document.createElement('div'); e.id = '__card'; e.innerHTML = `<div class="l">KALWINGS</div><div class="k">${k}</div><div class="s">${s || ''}</div>`; document.documentElement.appendChild(e); requestAnimationFrame(() => requestAnimationFrame(() => e.classList.add('on'))); },
    ring(sel, ms) { const el = document.querySelector(sel); if (!el) return; const r = el.getBoundingClientRect(); const d = document.createElement('div'); d.className = '__ring'; Object.assign(d.style, { left: r.left + scrollX - 6 + 'px', top: r.top + scrollY - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' }); document.body.appendChild(d); setTimeout(() => d.remove(), ms); },
  };
});
await ctx.addCookies(stu.cookies);
const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
// calibration flash: a few bright frames, then dark; flashEnd is the first dark frame
await p.setContent('<body style="margin:0;background:#fff"></body>'); await sleep(260);
await p.evaluate(() => { document.body.style.background = '#0e0e11'; }); const flashEnd = Date.now(); await sleep(150);

const marks = [];
const cap = (t) => p.evaluate((t) => window.__demo?.cap(t), t).catch(() => {});
const act = (t) => p.evaluate((t) => window.__demo?.act(t), t).catch(() => {});
const card = (k, s) => p.evaluate(([k, s]) => window.__demo?.card(k, s), [k, s]).catch(() => {});
const ring = (sel, ms = 2600) => p.locator(sel).first().evaluate((el, ms) => { const r = el.getBoundingClientRect(); const d = document.createElement('div'); d.className = '__ring'; Object.assign(d.style, { left: r.left + scrollX - 6 + 'px', top: r.top + scrollY - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' }); document.body.appendChild(d); setTimeout(() => d.remove(), ms); }, ms).catch(() => {});
const go = async (path) => { await p.goto(B + path, { waitUntil: 'networkidle' }); await sleep(350); };
async function glide(sel, { click = true, after = 250 } = {}) {
  const loc = typeof sel === 'string' ? p.locator(sel).first() : sel;
  await loc.scrollIntoViewIfNeeded(); await sleep(250);
  const bb = await loc.boundingBox(); const x = bb.x + Math.min(bb.width / 2, 120), y = bb.y + bb.height / 2;
  await p.mouse.move(x, y, { steps: 28 }); await sleep(180); if (click) { await p.mouse.down(); await p.mouse.up(); } await sleep(after);
}
async function type(sel, text, delay = 22) { await glide(sel); await p.keyboard.type(text, { delay }); await sleep(200); }
async function smooth(sel, block = 'center') { await p.locator(sel).first().evaluate((el, bl) => el.scrollIntoView({ behavior: 'smooth', block: bl }), block); await sleep(900); }
async function beat(key, fn, { caption = true } = {}) {
  marks.push([key, Date.now()]); if (caption) await cap(TEXT[key]);
  const speech = (DUR[key] ?? 0) * 1000;
  await Promise.all([Promise.resolve().then(fn).catch(async (e) => { console.log('beat failed', key, e.message.split('\n')[0]); await p.screenshot({ path: HERE + '_fail.png' }).catch(() => {}); throw e; }), sleep(speech)]);
  await sleep(DRY ? 0 : 1500);
}
const swap = async (cookies) => { await ctx.clearCookies(); await ctx.addCookies(cookies); };

// intro card
await p.goto(B + '/login', { waitUntil: 'domcontentloaded' }); await p.evaluate(() => {}); // any page: overlays live in the init script
await card('Live product demo', 'A student completes a challenge. An employer reviews the proof.');
await beat('intro', async () => { await sleep(300); }, { caption: false }); await sleep(DRY ? 0 : 1200);
await p.goto(B + '/dashboard', { waitUntil: 'networkidle' }); await card(); await act('1 · THE STUDENT'); await sleep(700);

// ---- Act 1: student ----
await beat('b1', async () => { await sleep(1200); await glide('nav[aria-label="Dashboard"] a:has-text("Challenges")', { click: false }); await sleep(500); await glide('nav[aria-label="Dashboard"] a:has-text("Challenges")'); await p.waitForURL(/\/challenges/); await p.waitForLoadState('networkidle'); });
await beat('b2', async () => { await sleep(600); await glide(`a:has-text("${CH.title}")`, { click: false }); });
await glide(`a:has-text("${CH.title}")`); await p.waitForURL(/\/challenges\/[a-z0-9]+$/); await p.waitForLoadState('networkidle'); await sleep(300);
const chPath = new URL(p.url()).pathname;
await beat('b3', async () => { await smooth('text=How it is judged', 'start'); await ring('table'); await sleep(2200); });
await beat('b4', async () => {
  await smooth('input[name=title]', 'center');
  await type('input[name=title]', 'Sensor dashboard with outlier handling');
  await type('textarea[name=summary]', 'I filled the gaps by interpolation, removed spikes with a rolling median, and charted the cleaned series with annotations that explain each choice.', 14);
  await type('input[name=workUrl]', 'https://github.com/example/sensor-dashboard');
});
await beat('b5', async () => { await glide('button:has-text("Submit")'); await p.waitForSelector('text=Submission saved'); await smooth('text=Submission saved', 'center'); });
await beat('b6', async () => { await sleep(500); await go('/dashboard/submissions'); await sleep(1200); });

// ---- transition ----
await card('2 · The employer', 'Sample Co. A reviews the proof'); await act('');
await beat('mid', async () => { await sleep(300); }, { caption: false }); await sleep(DRY ? 0 : 1500);
await swap(emp.cookies); await go('/dashboard'); await card(); await act('2 · THE EMPLOYER'); await sleep(600);

// ---- Act 2: employer ----
await beat('b7', async () => { await sleep(500); await glide('nav[aria-label="Dashboard"] a:has-text("Roles")', { click: false }).catch(() => {}); await go('/dashboard/challenges'); await sleep(500); await glide(`a:has-text("${CH.title}")`); await p.waitForSelector('text=Sensor dashboard with outlier handling'); await p.waitForLoadState('networkidle'); });
await beat('b8', async () => { await smooth('text=Sensor dashboard with outlier handling', 'start'); await ring('a[href^="https://github.com/example"]', 3000); await sleep(1800); });
await beat('b9', async () => {
  await glide('summary:has-text("Review and score")'); await sleep(500);
  await type('input[name=p0]', '35', 120); await type('input[name=p1]', '25', 120); await type('input[name=p2]', '20', 120);
});
await beat('b10', async () => {
  await type('textarea[name=feedback]', 'Strong cleaning approach and honest trade-offs. Next time, label the axes and units so the chart explains itself.', 14);
  await p.selectOption('select[name=outcome]', 'SHORTLISTED'); await sleep(500); await glide('input[name=awardSkill]');
});
await beat('b11', async () => { await ring('select[name=outcome]', 2400); await sleep(1500); await glide('button:has-text("Save review")'); await p.locator('p[role=status]:has-text("Saved"), p[role=alert]').first().waitFor(); const al = p.locator('p[role=alert]'); if (await al.count()) throw new Error('review refused: ' + await al.first().innerText()); });
await beat('b12', async () => { await sleep(600); await go('/dashboard/pipeline'); await sleep(900); });

await beat('b12b', async () => {
  await go('/dashboard/talent'); await type('input[name=q]', 'Data Viz', 90); await p.keyboard.press('Enter'); await p.waitForLoadState('networkidle'); await sleep(700);
  await ring('p:has-text("Verified:")', 3600); await sleep(2600);
});

// ---- back to the student ----
await swap(stu.cookies); await act('3 · THE RESULT');
await beat('b13', async () => { await go('/dashboard/submissions'); await sleep(900); await ring('text=80/100', 2600).catch(() => {}); await sleep(1500); });
await beat('b14', async () => {
  await go('/talent/sample-student');
  await smooth('li:has-text("Data Viz")', 'center'); await ring('li:has-text("Data Viz")', 3200); await sleep(2500);
  const why = p.locator('summary:has-text("Why these are shown")').first(); if (await why.count()) { await glide(why); await sleep(1500); }
});
await beat('recap', async () => { await smooth('li:has-text("Data Viz")', 'center'); await sleep(2500); });
await act(''); await cap('');
await card('Real work. Judged by people.', 'kalwings.com'); await beat('outro', async () => { await sleep(500); }, { caption: false }); await sleep(DRY ? 0 : 3800);

fs.writeFileSync(TMP + '/marks.json', JSON.stringify({ marks, flashEnd }));
await ctx.close(); await b.close();
const webm = fs.readdirSync(TMP).find((f) => f.endsWith('.webm'));
if (DRY) { console.log('DRY run finished; recording at', TMP + '/' + webm); process.exit(0); }
execFileSync('python3', [DOCS + 'video/mux.py', TMP + '/' + webm, TMP + '/marks.json', HERE + '_audio', OUT], { stdio: 'inherit' });
console.log('wrote', OUT);
