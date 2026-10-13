import "server-only";

/** Fail fast in production if required configuration is missing (called from layout via instrumentation). */
export function assertEnv() {
  const missing = ["DATABASE_URL", "AUTH_SECRET"].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  if ((process.env.AUTH_SECRET ?? "").length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
}
