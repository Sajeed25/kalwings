import { chromium } from 'playwright-core'; import fs from 'fs';
// Production smoke test. Start the app with `npm run build && npm start` using EMAIL_API_URL=http://localhost:4010,
// EMAIL_FROM set, ADMIN_EMAILS=boss@example.com, and run `node e2e/mock-mail.mjs` alongside.
const B=process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const MAIL=process.env.MAIL_CAPTURE ?? '/tmp/kalwings-last-mail.json'; const b=await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let bad=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) bad++;};
const ctx=await b.newContext(); const p=await ctx.newPage(); const viol=[];
p.on('console',m=>{ if(m.type()==='error'||/content security/i.test(m.text())) viol.push(m.text().slice(0,160)); }); p.on('pageerror',e=>viol.push('PAGEERROR '+e.message));
// public pages
for (const path of ['/','/opportunities','/mentors','/contact','/login','/talent/sample-student']) { await p.goto(B+path,{waitUntil:'networkidle'}); }
ok(viol.length===0, 'no CSP/console errors on public pages '+(viol[0]||''));
// meta + assets
const html = await (await fetch(B+'/')).text();
ok(/property="og:image"/.test(html) && /twitter:image/.test(html),'og:image and twitter:image meta present');
const og = await fetch(B+'/opengraph-image'); ok(og.headers.get('content-type')==='image/png' && (await og.arrayBuffer()).byteLength>5000,'OG image is a PNG');
const ic = await fetch(B+'/pwa-icon/512'); ok(ic.headers.get('content-type')==='image/png','PWA icon 512 PNG'); ok((await fetch(B+'/pwa-icon/999')).status===404,'unknown icon size 404');
const man = await (await fetch(B+'/manifest.webmanifest')).json(); ok(man.icons.some(i=>i.sizes==='512x512'&&i.purpose==='maskable'),'manifest has 512 maskable icon');
// service worker
await p.goto(B+'/'); const reg = await p.evaluate(async()=>{ const r=await navigator.serviceWorker.ready; return !!r.active; }); ok(reg,'service worker active');
const cached = await p.evaluate(async()=>{ const out=[]; for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) out.push(new URL(r.url).pathname); return out; });
ok(cached.includes('/offline') && !cached.some(x=>x==='/'||x.startsWith('/dashboard')),'SW caches offline page only (no private HTML) '+JSON.stringify(cached.slice(0,3)));
await ctx.setOffline(true); await p.goto(B+'/opportunities').catch(()=>{}); ok((await p.content()).includes("You're offline")||(await p.content()).includes('You&#x27;re offline')||(await p.content()).includes("You’re offline")||(await p.locator('text=offline').count())>0,'offline navigation shows fallback page'); await ctx.setOffline(false); await p.waitForTimeout(800);
// contact form
await p.goto(B+'/contact'); await p.fill('input[name=name]','Asha'); await p.fill('input[name=email]','asha@example.com'); await p.fill('textarea[name=message]','Hello, we would like to partner with Kalwings.');
await p.click('button:has-text("Send message")'); await p.waitForSelector('text=Thanks');
// honeypot
await p.goto(B+'/contact'); await p.fill('input[name=name]','Bot'); await p.fill('input[name=email]','bot@example.com'); await p.fill('textarea[name=message]','Buy cheap stuff now, please click here.'); await p.evaluate(()=>{document.querySelector('input[name=website]').value='http://spam';}); await p.click('button:has-text("Send message")'); await p.waitForSelector('text=Thanks');
// signed-in admin: CSP on dashboard
const a=await (await b.newContext()).newPage(); const v2=[]; a.on('console',m=>{ if(m.type()==='error' && /Content Security Policy|Refused to/i.test(m.text())) v2.push(m.text().slice(0,200)); }); a.on('pageerror',e=>v2.push(e.message));
await a.goto(B+'/join'); await a.fill('input[name=identifier]','boss@example.com'); await a.click('button:has-text("Send one-time code")'); await a.waitForSelector('input[name=code]');
const code=JSON.parse(fs.readFileSync(MAIL,'utf8')).body.text.match(/\d{6}/)[0]; await a.fill('input[name=name]','Boss'); await a.fill('input[name=code]',code); await a.click('button:has-text("Create my account")'); await a.waitForURL(/dashboard/);
await a.goto(B+'/dashboard/inbox'); ok(await a.locator('text=Asha').count()>0,'admin inbox shows contact message'); ok(await a.locator('text=Bot').count()===0,'honeypot submission was dropped');
await a.locator('button:has-text("Mark handled")').first().click(); await a.waitForTimeout(800);
for (const path of ['/dashboard','/dashboard/moderation','/dashboard/reports','/dashboard/audit']) { await a.goto(B+path,{waitUntil:'networkidle'}); await a.waitForTimeout(600); }
ok(v2.length===0,'no CSP violations on admin dashboard '+(v2[0]||''));
await b.close(); console.log(bad?'FAILURES':'ALL PASSED'); process.exit(bad?1:0);
