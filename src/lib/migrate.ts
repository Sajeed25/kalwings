import "server-only";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Applies pending database migrations (prisma migrate deploy) when the server starts, so a fresh or outdated database
 * is brought up to date even if the host's start command doesn't run migrations. It only ever adds what the committed
 * migrations describe, is safe to run repeatedly, and Prisma's own lock stops two instances running it at once.
 * Opt out with AUTO_MIGRATE=false. Output is filtered so no connection details reach the log.
 */
export async function runMigrations(): Promise<void> {
  const cli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  if (!existsSync(cli) || !existsSync(path.join(process.cwd(), "prisma", "schema.prisma"))) {
    console.error("[migrate] skipped: Prisma CLI or schema not found in the deployed folder. Run `npx prisma migrate deploy` manually.");
    return;
  }
  await new Promise<void>((resolve) => {
    execFile(process.execPath, [cli, "migrate", "deploy"], { cwd: process.cwd(), env: process.env, timeout: 120_000, maxBuffer: 2_000_000 }, (err, stdout, stderr) => {
      const lines = `${stdout}\n${stderr}`.split("\n").map((l) => l.trim()).filter((l) => /migration|error|P\d{4}|no pending|applied|failed/i.test(l) && !/datasource|mysql:\/\//i.test(l));
      if (err) console.error(`[migrate] FAILED (exit ${(err as NodeJS.ErrnoException & { code?: number }).code ?? "?"}): ${lines.slice(0, 8).join(" | ") || "no details"}`);
      else console.log(`[migrate] ok: ${lines.slice(0, 6).join(" | ") || "database is up to date"}`);
      resolve();
    });
  });
}
