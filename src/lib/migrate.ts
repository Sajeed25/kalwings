import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { MIGRATIONS } from "@/lib/migrations.generated";

/**
 * Brings the database up to date at server start, with no Prisma CLI and no prisma/ folder needed (Hostinger deploys only the
 * built app). The migration SQL is embedded at build time (scripts/embed-migrations.mjs) and recorded in Prisma's own
 * `_prisma_migrations` table with Prisma's checksum, so `prisma migrate deploy` / `migrate status` stay compatible.
 * It only ever applies the committed migrations, in order, skips ones already applied, and a MySQL advisory lock stops two
 * instances racing. Opt out with AUTO_MIGRATE=false. Nothing sensitive is logged.
 */
const HISTORY = `CREATE TABLE IF NOT EXISTS \`_prisma_migrations\` (
    \`id\` VARCHAR(36) NOT NULL,
    \`checksum\` VARCHAR(64) NOT NULL,
    \`finished_at\` DATETIME(3) NULL,
    \`migration_name\` VARCHAR(255) NOT NULL,
    \`logs\` TEXT NULL,
    \`rolled_back_at\` DATETIME(3) NULL,
    \`started_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`applied_steps_count\` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

/** Prisma migrations end every statement with ";" and a newline and never contain ";" inside literals. */
export function splitStatements(sql: string): string[] {
  return sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n").split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter(Boolean);
}

export async function runMigrations(): Promise<void> {
  const started = Date.now();
  try {
    await db.$transaction(async (tx) => {
      const [{ got }] = await tx.$queryRawUnsafe<{ got: number | bigint | null }[]>("SELECT GET_LOCK('kalwings_migrate', 60) AS got");
      if (Number(got) !== 1) throw new Error("another instance is migrating; try again");
      try {
        await tx.$executeRawUnsafe(HISTORY);
        const done = new Set((await tx.$queryRawUnsafe<{ migration_name: string }[]>("SELECT migration_name FROM `_prisma_migrations` WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL")).map((r) => r.migration_name));
        const pending = MIGRATIONS.filter((m) => !done.has(m.name));
        for (const m of pending) {
          const stmts = splitStatements(m.sql);
          for (const s of stmts) await tx.$executeRawUnsafe(s);
          await tx.$executeRawUnsafe("INSERT INTO `_prisma_migrations` (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (?, ?, NOW(3), ?, ?)", randomUUID(), createHash("sha256").update(m.sql).digest("hex"), m.name, stmts.length);
          console.log(`[migrate] applied ${m.name} (${stmts.length} statements)`);
        }
        console.log(`[migrate] ok: ${pending.length ? `${pending.length} applied` : "database is up to date"}, ${MIGRATIONS.length} migrations known, ${Date.now() - started} ms`);
      } finally {
        await tx.$queryRawUnsafe("SELECT RELEASE_LOCK('kalwings_migrate')");
      }
    }, { timeout: 180_000, maxWait: 30_000 });
  } catch (e) {
    console.error(`[migrate] FAILED: ${e instanceof Error ? e.message.split("\n").filter(Boolean).slice(-2).join(" | ") : String(e)}`);
  }
}
