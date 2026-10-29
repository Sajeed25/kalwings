/**
 * Where to send someone after they sign in. Only same-site paths in an allow-list are accepted (never a full URL or "//host"),
 * so a shared link can bring a friend back to exactly the listing they were looking at, and cannot be used to redirect elsewhere.
 */
const ALLOWED = ["/opportunities/", "/challenges/", "/j/", "/careers/", "/jobs-in/", "/dashboard", "/mentors/", "/talent/"];
export function safeNext(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s.length === 0 || s.length > 300 || !s.startsWith("/") || s.startsWith("//") || s.includes("\\") || /[\u0000-\u001f\u007f]/.test(s) || /^\/[a-z][a-z0-9+.-]*:/i.test(s)) return null;
  return ALLOWED.some((p) => s === p.replace(/\/$/, "") || s.startsWith(p)) ? s : null;
}
