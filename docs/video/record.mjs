// Records the animated walkthrough (docs/video/video.html) to MP4. Needs docs/manual/img-clean/ (CLEAN=1 node docs/manual/shots.mjs) and ffmpeg.
// Usage: CHROMIUM_PATH=/path/to/chrome node docs/video/record.mjs
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const DOCS = new URL('../', import.meta.url).pathname;
const OUT = process.env.OUT ?? DOCS + 'KALWINGS-Walkthrough.mp4';
const TMP = DOCS + 'video/_rec'; fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
const types = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => { const p = path.join(DOCS, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(DOCS) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(5055);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: TMP, size: { width: 1280, height: 720 } } });
const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('PAGEERROR', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('console error', m.text()); });
await p.goto('http://localhost:5055/video/video.html'); const t0 = Date.now();
await p.waitForFunction(() => window.__done === true, null, { timeout: 15 * 60 * 1000, polling: 500 });
await p.waitForTimeout(600); await ctx.close(); await b.close(); srv.close();
const webm = fs.readdirSync(TMP).find((f) => f.endsWith('.webm'));
execFileSync('ffmpeg', ['-y', '-i', TMP + '/' + webm, '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart', '-an', OUT], { stdio: 'ignore' });
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`Recorded ${(Date.now() - t0) / 1000 | 0}s -> ${OUT}`);
