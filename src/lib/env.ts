import "server-only";

/** Fail fast in production if required configuration is missing (called from layout via instrumentation). */
export function assertEnv() {
  const missing = ["DATABASE_URL", "AUTH_SECRET"].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  if ((process.env.AUTH_SECRET ?? "").length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
}

/**
 * One-line description of DATABASE_URL for the startup log, plus hints for common mistakes.
 * Never prints the password: only its LENGTH and whether it contains symbols that need URL-encoding,
 * so you can compare against the password you meant to set (a stray space or quote changes the length).
 */
export function describeDatabaseUrl(raw = process.env.DATABASE_URL ?? ""): { line: string; problem?: string } {
  const problems: string[] = [];
  if (raw !== raw.trim()) problems.push("the value has a leading or trailing space/newline");
  if (/^["'`]|["'`]$/.test(raw.trim())) problems.push("the value is wrapped in quotes; remove them");
  if (/^DATABASE_URL\s*=/i.test(raw.trim())) problems.push('the value starts with "DATABASE_URL="; paste only the mysql://… part');
  try {
    const u = new URL(raw.trim());
    const db = decodeURIComponent(u.pathname.replace(/^\//, ""));
    const user = decodeURIComponent(u.username);
    const pw = decodeURIComponent(u.password);
    if (u.protocol !== "mysql:") problems.push(`scheme is "${u.protocol.replace(":", "")}" but must be mysql://`);
    if (!db) problems.push("no database name after the host (an unencoded # or ? or / in the password usually causes this)");
    if (!user) problems.push("no username");
    if (!pw) problems.push("no password");
    if (/\s/.test(user + pw)) problems.push("the username or password contains whitespace");
    if (/^(host|hostname|your[_-]?host|example\.com|localhost\.example)$/i.test(u.hostname) || /your[_-]?(password|user|db)/i.test(raw)) problems.push(`the host or credentials look like a placeholder ("${u.hostname}")`);
    return {
      line: `user=${user || "MISSING"} passwordLength=${pw.length} passwordHasSymbols=${/[^A-Za-z0-9]/.test(pw)} host=${u.hostname || "MISSING"} port=${u.port || "3306(default)"} database=${db || "MISSING"}`,
      problem: problems.join("; ") || undefined,
    };
  } catch {
    return { line: "unparseable", problem: [...problems, "DATABASE_URL is not a valid URL. Check for spaces, quotes, or an unencoded @ # / ? in the password."].join("; ") };
  }
}

/** Public site URL sanity check for the startup log (NEXT_PUBLIC_SITE_URL is baked in at BUILD time). */
export function describeSiteUrl(raw = process.env.NEXT_PUBLIC_SITE_URL ?? ""): { line: string; problem?: string } {
  try {
    const u = new URL(raw);
    const problems: string[] = [];
    if (u.protocol !== "https:" && u.hostname !== "localhost") problems.push("should start with https://");
    if (raw.endsWith("/")) problems.push("remove the trailing slash");
    if (u.pathname !== "/" && u.pathname !== "") problems.push("should be just the domain, no path");
    return { line: `siteUrl=${u.origin}`, problem: problems.join("; ") || undefined };
  } catch {
    return { line: "siteUrl=MISSING/invalid", problem: "NEXT_PUBLIC_SITE_URL is missing or not a valid URL (it is used in emails and unsubscribe links)" };
  }
}
