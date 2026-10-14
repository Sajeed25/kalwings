// TEST DOUBLE ONLY. A tiny Judge0-shaped HTTP server for e2e tests: it runs JavaScript with the local `node`.
// It executes code on this machine, so NEVER use it outside tests. Production must point SANDBOX_URL at an isolated sandbox.
import http from 'node:http'; import { spawnSync } from 'node:child_process';
const b = (s) => Buffer.from(s ?? '', 'utf8').toString('base64'); const u = (s) => Buffer.from(s ?? '', 'base64').toString('utf8');
http.createServer((req, res) => {
  let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
    const j = JSON.parse(body || '{}'); res.setHeader('Content-Type', 'application/json');
    if (j.language_id !== 63) { res.end(JSON.stringify({ status: { id: 6 }, compile_output: b('mock sandbox only runs JavaScript'), stdout: null, stderr: null, time: '0.0' })); return; }
    const t0 = Date.now(); const r = spawnSync('node', ['-e', u(j.source_code)], { input: u(j.stdin), timeout: Math.max(500, (j.cpu_time_limit ?? 2) * 1000), encoding: 'utf8', maxBuffer: 1 << 20 });
    const ms = Date.now() - t0; const tle = r.error && r.error.code === 'ETIMEDOUT';
    res.end(JSON.stringify({ stdout: b(r.stdout), stderr: b(r.stderr), compile_output: null, time: (ms / 1000).toFixed(3), status: { id: tle ? 5 : r.status === 0 ? 3 : 11 } }));
  });
}).listen(Number(process.env.PORT ?? 4020), () => console.log('mock sandbox on', process.env.PORT ?? 4020));
