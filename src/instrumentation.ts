export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { assertEnv, describeDatabaseUrl, describeSiteUrl } = await import("@/lib/env");
    assertEnv();
    const d = describeDatabaseUrl();
    console.log(`[startup] database: ${d.line}`);
    if (d.problem) console.error(`[startup] DATABASE_URL problem: ${d.problem}`);
    const site = describeSiteUrl();
    console.log(`[startup] ${site.line}`);
    if (site.problem) console.error(`[startup] NEXT_PUBLIC_SITE_URL problem: ${site.problem}`);
    const from = process.env.EMAIL_FROM ?? "", host = process.env.SMTP_HOST ?? "", user = process.env.SMTP_USER ?? "";
    console.log(`[startup] email: from=${from || "MISSING"} smtpHost=${host || "MISSING"} smtpPort=${process.env.SMTP_PORT || "465 (default)"} smtpUser=${user || "MISSING"} smtpPassword=${process.env.SMTP_PASSWORD ? "set" : "MISSING"}`);
    if (user && !user.includes("@")) console.error("[startup] SMTP_USER should be the full mailbox address, e.g. hello@kalwings.com.");
    if (user && from && !from.toLowerCase().includes(user.toLowerCase())) console.error("[startup] EMAIL_FROM differs from SMTP_USER. Hostinger only allows the mailbox itself or its aliases as the sender.");
    if (from && !/^([^<]*<)?[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>?$/.test(from.trim())) console.error('[startup] EMAIL_FROM is not a valid address. Use e.g. hello@kalwings.com or Kalwings <hello@kalwings.com>.');
    if (!d.problem && process.env.AUTO_MIGRATE !== "false") {
      const { runMigrations } = await import("@/lib/migrate");
      await runMigrations();
    }
  }
}

/** Called by Next.js for every unhandled server-side error (render, route handler, server action). */
export async function onRequestError(err: unknown, request: { path: string }) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logError } = await import("@/lib/error-log");
  await logError(err, request.path);
}
