#!/usr/bin/env node
// Cross-platform (Windows / macOS / Linux) version of export-standalone-repo.sh.
// Creates a clean, standalone git repo of the Kalwings app (app at the repo root, CI/CD paths fixed).
//
//   node scripts/export-standalone-repo.mjs ../../kalwings-site
//   cd ../../kalwings-site && git remote add origin https://github.com/<you>/kalwings.git && git push -u origin main
//
// Needs: Node 20+ and Git 2.28+. No Python, tar or bash required.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const destArg = process.argv[2];
if (!destArg) { console.error("usage: node scripts/export-standalone-repo.mjs <new-directory>"); process.exit(1); }

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(SRC, "..");
const DEST = resolve(process.cwd(), destArg);
if (existsSync(DEST)) { console.error(`${DEST} already exists`); process.exit(1); }

const EXCLUDE = new Set(["node_modules", ".next", ".env", ".env.local", "next-env.d.ts"]);
mkdirSync(DEST, { recursive: true });
cpSync(SRC, DEST, {
  recursive: true,
  filter: (p) => !EXCLUDE.has(basename(p)) && !p.endsWith(".tsbuildinfo"),
});

// CI/CD files live at the repo root of the source repo and assume the app is in ./kalwings.
const wfSrc = join(REPO_ROOT, ".github", "workflows");
const wfDest = join(DEST, ".github", "workflows");
mkdirSync(wfDest, { recursive: true });
for (const f of readdirSync(wfSrc).filter((n) => n.endsWith(".yml"))) {
  let s = readFileSync(join(wfSrc, f), "utf8").replace(/\r\n/g, "\n");
  s = s.replace(/    defaults:\n      run:\n        working-directory: kalwings\n/, "");
  s = s.replaceAll("kalwings/package-lock.json", "package-lock.json").replaceAll("            cd kalwings\n", "");
  writeFileSync(join(wfDest, f), s);
}
writeFileSync(
  join(DEST, ".github", "dependabot.yml"),
  readFileSync(join(REPO_ROOT, ".github", "dependabot.yml"), "utf8").replace("directory: /kalwings", "directory: /"),
);

const git = (...args) => execFileSync("git", args, { cwd: DEST, stdio: "pipe" });
try {
  git("init", "-q", "-b", "main");
  git("add", "-A");
  git("-c", "user.name=Kalwings", "-c", "user.email=noreply@kalwings.com", "commit", "-qm", "Initial commit: Kalwings website and platform");
} catch (e) {
  console.error("git failed. Is Git installed and version 2.28 or newer? (git --version)\n" + (e.stderr?.toString() ?? e.message));
  process.exit(1);
}
console.log(`Created ${DEST} (branch: main).\nNext:\n  cd "${DEST}"\n  git remote add origin https://github.com/<your-user>/kalwings.git\n  git push -u origin main`);
