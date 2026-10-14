/**
 * The public origin of this site, for OAuth redirects. Behind a hosting proxy the request URL can carry an internal
 * address (http://localhost:PORT), which Google rejects, so the configured NEXT_PUBLIC_SITE_URL wins; otherwise the
 * proxy's forwarded headers; last resort the request's own origin.
 */
export function publicOrigin(req: { headers: { get(n: string): string | null }; nextUrl: { origin: string } }, configured = process.env.NEXT_PUBLIC_SITE_URL): string {
  try {
    if (configured) { const u = new URL(configured); if (u.protocol === "https:" || u.hostname === "localhost") return u.origin; }
  } catch { /* fall through */ }
  const host = req.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host) && (proto === "https" || proto === "http")) return `${proto}://${host}`;
  return req.nextUrl.origin;
}
