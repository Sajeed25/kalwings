import "server-only";

/** Fail fast in production if required configuration is missing (called from layout via instrumentation). */
export function assertEnv() {
  const missing = ["DATABASE_URL", "AUTH_SECRET"].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  if ((process.env.AUTH_SECRET ?? "").length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
}

/**
 * One-line, password-free description of DATABASE_URL for the startup log, plus a hint when it
 * looks malformed (the usual cause is an unencoded special character in the password).
 */
export function describeDatabaseUrl(raw = process.env.DATABASE_URL ?? ""): { line: string; problem?: string } {
  try {
    const u = new URL(raw);
    const db = decodeURIComponent(u.pathname.replace(/^\//, ""));
    const problems: string[] = [];
    if (u.protocol !== "mysql:") problems.push(`scheme is "${u.protocol.replace(":", "")}" but must be mysql://`);
    if (!db) problems.push("no database name after the host (an unencoded # or ? or / in the password usually causes this)");
    if (!u.username) problems.push("no username");
    if (!u.password) problems.push("no password");
    return { line: `user=${u.username ? "set" : "MISSING"} host=${u.hostname || "MISSING"} port=${u.port || "3306(default)"} database=${db || "MISSING"}`, problem: problems.join("; ") || undefined };
  } catch {
    return { line: "unparseable", problem: "DATABASE_URL is not a valid URL. Check for spaces, quotes, or an unencoded @ in the password." };
  }
}
