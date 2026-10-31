/** Pure checks for push subscriptions and payloads (unit tested). */
const B64URL = /^[A-Za-z0-9_-]+={0,2}$/;
export type SubInput = { endpoint: string; p256dh: string; auth: string };

/** Accepts only a plausible browser subscription: https endpoint, base64url keys of the right size. */
export function parseSubscription(v: unknown): SubInput | null {
  const o = v as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  const endpoint = typeof o?.endpoint === "string" ? o.endpoint : "", p256dh = o?.keys?.p256dh, auth = o?.keys?.auth;
  if (endpoint.length < 20 || endpoint.length > 800) return null;
  try { const u = new URL(endpoint); if (u.protocol !== "https:" || !u.hostname.includes(".")) return null; } catch { return null; }
  if (typeof p256dh !== "string" || typeof auth !== "string" || !B64URL.test(p256dh) || !B64URL.test(auth) || p256dh.length < 60 || p256dh.length > 100 || auth.length < 16 || auth.length > 40) return null;
  return { endpoint, p256dh, auth };
}

/** The JSON the service worker shows. Truncated so it always fits one notification. */
export function pushPayload(title: string, body: string | undefined, url: string | undefined): string {
  const safeUrl = url && url.startsWith("/") && !url.startsWith("//") ? url : "/dashboard/notifications";
  return JSON.stringify({ title: title.slice(0, 80), body: (body ?? "").slice(0, 160), url: safeUrl });
}
