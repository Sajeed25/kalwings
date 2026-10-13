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
  }
}

/** Called by Next.js for every unhandled server-side error (render, route handler, server action). */
export async function onRequestError(err: unknown, request: { path: string }) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logError } = await import("@/lib/error-log");
  await logError(err, request.path);
}
