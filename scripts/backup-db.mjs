#!/usr/bin/env node
// Database backup: dumps the database named in DATABASE_URL to a gzip file and prunes old ones.
//   DATABASE_URL=mysql://user:pass@host:3306/db node scripts/backup-db.mjs [outDir=./backups] [keep=14]
// Needs `mysqldump` or `mariadb-dump` on PATH. The password is passed through MYSQL_PWD, never on the command line.
import { spawnSync, spawn } from "node:child_process";
import { createWriteStream, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { createGzip } from "node:zlib";
import { join } from "node:path";

const url = process.env.DATABASE_URL; if (!url) { console.error("DATABASE_URL is not set"); process.exit(1); }
const u = new URL(url); const db = decodeURIComponent(u.pathname.slice(1));
const outDir = process.argv[2] ?? "backups", keep = Number(process.argv[3] ?? 14);
mkdirSync(outDir, { recursive: true });
const tool = ["mariadb-dump", "mysqldump"].find((t) => spawnSync(t, ["--version"]).status === 0);
if (!tool) { console.error("Install mysqldump or mariadb-dump"); process.exit(1); }
const file = join(outDir, `${db}-${new Date().toISOString().replace(/[:.]/g, "-")}.sql.gz`);
const child = spawn(tool, ["--single-transaction", "--quick", "--routines", "--no-tablespaces", `--host=${u.hostname}`, `--port=${u.port || 3306}`, `--user=${decodeURIComponent(u.username)}`, db], { env: { ...process.env, MYSQL_PWD: decodeURIComponent(u.password) }, stdio: ["ignore", "pipe", "inherit"] });
const out = createWriteStream(file); child.stdout.pipe(createGzip()).pipe(out);
child.on("close", (code) => {
  if (code !== 0) { console.error(`${tool} failed (${code})`); try { unlinkSync(file); } catch {} process.exit(1); }
  out.on("finish", () => {
    console.log(`Wrote ${file} (${(statSync(file).size / 1024).toFixed(1)} KB)`);
    const old = readdirSync(outDir).filter((f) => f.startsWith(db + "-") && f.endsWith(".sql.gz")).sort().reverse().slice(keep);
    for (const f of old) { unlinkSync(join(outDir, f)); console.log(`Pruned ${f}`); }
  });
});
