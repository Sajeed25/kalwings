import "server-only";
import { db } from "@/lib/db";

// Expected control-flow errors thrown by our own guards; not worth an alert.
const EXPECTED = /^(Not signed in|Forbidden|Not found|Invalid|Bad origin|This opportunity isn't open|Complete your profile|Your company must be verified|Create a company first|This slot is booked|Create your mentor profile)/;

/** Stores an unhandled server error. Never throws. Contains no personal data: path only (no query), truncated text. */
export async function logError(err: unknown, path?: string) {
  try {
    const e = err instanceof Error ? err : new Error(String(err));
    const digest = (e as { digest?: string }).digest;
    if (EXPECTED.test(e.message) || digest?.startsWith("NEXT_")) return;
    await db.errorLog.create({ data: { message: e.message.slice(0, 500), digest: digest ?? null, path: path?.split("?")[0].slice(0, 300) ?? null, stack: e.stack?.slice(0, 4000) ?? null } });
  } catch {
    /* logging must never take the app down */
  }
}
