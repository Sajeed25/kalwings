// Accessibility and responsive audit. Run against a DEV server with the seed loaded (sign-in codes show on screen):
//   npm run dev -- -p 3077   then   E2E_BASE_URL=http://localhost:3077 CHROMIUM_PATH=... node e2e/a11y.mjs
// For every page and role: axe-core (WCAG 2.0/2.1/2.2 A and AA rules) at desktop and phone width, plus a check that
// the phone layout has no horizontal scroll. Exits non-zero on any violation not listed in IGNORE (each ignore needs a reason).
import { chromium } from 'playwright-core'; import fs from 'node:fs';
const B = process.env.E2E_BASE_URL ?? 'http://localhost:3077';
const axeSrc = fs.readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const IGNORE = {}; // e.g. { 'rule-id': 'reason' }
const SAMPLE = { student: 'student@sample.kalwings.test', employer: 'sample-co-a@sample.kalwings.test', admin: 'admin@sample.kalwings.test', college: 'college@sample.kalwings.test', mentor: 'sample-mentor-1@sample.kalwings.test' };
const PAGES = {
  anon: ['/jobs-in', '/login', '/join', '/opportunities', '/opportunities?nl=remote+internship+paid', '/challenges', '/community', '/mentors', '/contact', '/help', '/privacy', '/terms', '/trust', '/talent/sample-student'],
  student: ['/dashboard', '/dashboard/resume', '/dashboard/profile', '/dashboard/portfolio', '/dashboard/passport', '/dashboard/copilot', '/dashboard/applications', '/dashboard/interviews', '/dashboard/submissions', '/dashboard/assessments', '/dashboard/drives', '/dashboard/mentoring', '/dashboard/saved', '/dashboard/notifications', '/dashboard/account', '/community', '/community/teammates'],
  employer: ['/dashboard', '/dashboard/company', '/dashboard/roles', '/dashboard/challenges', '/dashboard/assessments', '/dashboard/talent', '/dashboard/pipeline', '/dashboard/interviews', '/dashboard/analytics', '/dashboard/jd-check', '/dashboard/drives'],
  admin: ['/dashboard', '/dashboard/moderation', '/dashboard/credentials', '/dashboard/plans', '/dashboard/insights', '/dashboard/reports', '/dashboard/users', '/dashboard/audit', '/dashboard/inbox', '/dashboard/errors'],
  college: ['/dashboard', '/dashboard/college', '/dashboard/drives'],
  mentor: ['/dashboard', '/dashboard/mentoring'],
};
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let bad = 0; const seen = new Map();
for (const [role, paths] of Object.entries(PAGES)) {
  for (const [vp, size] of [['desktop', { width: 1280, height: 900 }], ['phone', { width: 375, height: 800 }]]) {
    const ctx = await b.newContext({ viewport: size }); const p = await ctx.newPage();
    if (role !== 'anon') {
      await p.goto(B + '/login'); await p.fill('input[name=identifier]', SAMPLE[role]); await p.click('button:has-text("Send one-time code")'); await p.waitForSelector('input[name=code]');
      await p.fill('input[name=code]', (await p.locator('text=Your code is').locator('b').innerText()).trim()); await p.click('button:has-text("Log in")'); await p.waitForURL(/dashboard/, { timeout: 20000 });
    }
    for (const path of paths) {
      try {
        const res = await p.goto(B + path, { waitUntil: 'networkidle' }); if (res && res.status() >= 400) { console.log(`SKIP ${role} ${vp} ${path} (HTTP ${res.status()})`); continue; }
        await p.addScriptTag({ content: axeSrc });
        const out = await p.evaluate(async () => { const r = await window.axe.run({ exclude: [['nextjs-portal']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n')[1]), count: v.nodes.length })); });
        const overflow = vp === 'phone' ? await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) : 0;
        const real = out.filter((v) => !IGNORE[v.id]);
        if (real.length || overflow > 1) { bad++; console.log(`FAIL ${role} ${vp} ${path}${overflow > 1 ? ` [horizontal overflow ${overflow}px]` : ''}`); for (const v of real) { const k = v.id + '|' + v.nodes[0]; seen.set(k, (seen.get(k) ?? 0) + 1); console.log(`   ${v.impact} ${v.id}: ${v.help} (${v.count})\n     ${v.nodes.join('\n     ')}`); } }
        else console.log(`PASS ${role} ${vp} ${path}`);
      } catch (e) { bad++; console.log(`FAIL ${role} ${vp} ${path} :: ${String(e.message).split('\n')[0]}`); }
    }
    await ctx.close();
  }
}
console.log(bad ? `\n${bad} page(s) with problems` : '\nALL PASSED'); await b.close(); process.exit(bad ? 1 : 0);
