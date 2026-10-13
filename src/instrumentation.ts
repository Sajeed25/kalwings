export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { assertEnv } = await import("@/lib/env");
    assertEnv();
  }
}

/** Called by Next.js for every unhandled server-side error (render, route handler, server action). */
export async function onRequestError(err: unknown, request: { path: string }) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logError } = await import("@/lib/error-log");
  await logError(err, request.path);
}
