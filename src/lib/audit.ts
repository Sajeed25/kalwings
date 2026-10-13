import "server-only";
import { db } from "@/lib/db";
import { emailConfigured, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { unsubToken } from "@/lib/unsub";

export const audit = (actorId: string, action: string, target: string) => db.auditLog.create({ data: { actorId, action, target } });

/**
 * In-app notification, plus an email when the user has an address, hasn't opted out, and email is configured.
 * Email is best-effort and capped at 10/hour per user; it never makes the calling action fail.
 */
export async function notify(userId: string, title: string, body?: string) {
  await db.notification.create({ data: { userId, title, body } });
  try {
    if (!emailConfigured()) return;
    const u = await db.user.findUnique({ where: { id: userId }, select: { email: true, emailNotifications: true } });
    if (!u?.email || !u.emailNotifications) return;
    if (!(await rateLimit(`notify-email:${userId}`, 10, 60 * 60 * 1000))) return;
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    await sendEmail({
      to: u.email,
      subject: `Kalwings: ${title}`,
      text: `${title}${body ? `\n${body}` : ""}\n\nOpen your dashboard: ${site}/dashboard/notifications\n\nTurn off these emails: ${site}/unsubscribe?u=${userId}&t=${unsubToken(userId)}`,
    });
  } catch {
    /* ignore: the in-app notification is already saved */
  }
}
