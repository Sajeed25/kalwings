// Fake email provider for tests: captures the last email so tests can read the sign-in code.
import http from 'http'; import fs from 'fs';
http.createServer((req, res) => { let b=''; req.on('data', d => b+=d); req.on('end', () => { fs.writeFileSync(process.env.MAIL_CAPTURE ?? '/tmp/kalwings-last-mail.json', JSON.stringify({ body: JSON.parse(b) })); res.writeHead(200, {'content-type':'application/json'}); res.end('{"id":"x"}'); }); }).listen(4010);
