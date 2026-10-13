import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Maps a database error to a short, safe category. The raw message (which can contain hosts) only goes to the log.
function classify(message: string, fallback: string) {
  if (/Can't reach database server|ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(message)) return "unreachable";
  if (/Authentication failed|Access denied/i.test(message)) return "auth_failed";
  if (/does not exist|Unknown database/i.test(message)) return "unknown_database";
  if (/connection string is invalid|Error parsing connection string|invalid port|empty host/i.test(message)) return "bad_database_url";
  if (/Query engine|could not be found|libssl|GLIBC/i.test(message)) return "prisma_engine";
  if (/Too many connections|max_user_connections/i.test(message)) return "too_many_connections";
  return fallback;
}

/**
 * Liveness + DB check for uptime monitors and deploy smoke tests.
 * On failure it returns only a short CATEGORY (unreachable, auth_failed, unknown_database, bad_database_url,
 * prisma_engine, too_many_connections) and writes the full reason to the server log. No host names, credentials or messages are ever exposed publicly.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as { errorCode?: string; code?: string; name?: string; message?: string };
    const msg = err.message ?? String(e);
    const code = classify(msg, String(err.errorCode ?? err.code ?? err.name ?? "unknown").slice(0, 40));
    console.error(`[health] database check failed (${code}):`, msg.split("\n").filter(Boolean).slice(-3).join(" | "));
    return NextResponse.json({ ok: false, db: code }, { status: 503 });
  }
}
