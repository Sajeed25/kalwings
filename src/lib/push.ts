import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { vapid } from "@/lib/vapid";
import { pushPayload } from "@/lib/push-parse";

/**
 * Sends a push notification to every device a person opted in on. Best effort: it never throws and never blocks the action that caused it.
 * At most 20 an hour per person. Devices the push service reports as gone (404 or 410) are removed.
 */
export async function sendPush(userId: string, n: { title: string; body?: string; url?: string }): Promise<number> {
  try {
    const subs = await db.pushSubscription.findMany({ where: { userId }, take: 5 });
    if (!subs.length || !(await rateLimit(`push:${userId}`, 20, 60 * 60 * 1000))) return 0;
    const v = await vapid();
    const subject = site.url.startsWith("https://") ? site.url : "mailto:hello@kalwings.com";
    const payload = pushPayload(n.title, n.body, n.url);
    let sent = 0;
    await Promise.all(subs.map(async (s) => {
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { vapidDetails: { subject, publicKey: v.publicKey, privateKey: v.privateKey }, TTL: 86_400, timeout: 5000 }); sent++; }
      catch (e) { const code = (e as { statusCode?: number }).statusCode; if (code === 404 || code === 410) await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {}); }
    }));
    return sent;
  } catch (e) { console.error("[push] failed:", e instanceof Error ? e.message : e); return 0; }
}
