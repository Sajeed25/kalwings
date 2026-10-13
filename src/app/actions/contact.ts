"use server";
import { db } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { clientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { emailConfigured, sendEmail } from "@/lib/email";
import { fail, obj, type Result } from "./_shared";

export async function sendContact(_: Result, fd: FormData): Promise<Result> {
  const r = contactSchema.safeParse(obj(fd));
  if (!r.success) return r.error.issues.some((i) => i.path[0] === "website") ? { ok: true } : fail(r.error); // silently drop bots
  if (!(await rateLimit(`contact:${await clientIp()}`, 5, 60 * 60 * 1000))) return { error: "Too many messages. Please try again later." };
  const data = { name: r.data.name, email: r.data.email, topic: r.data.topic, message: r.data.message };
  let stored = true;
  try {
    await db.contactMessage.create({ data });
  } catch (e) {
    stored = false;
    console.error("[contact] could not store message:", e instanceof Error ? e.message : e);
  }
  // Email is best-effort when the message was stored, and the fallback when the database is unavailable.
  const to = process.env.CONTACT_TO || process.env.EMAIL_FROM;
  let emailed = false;
  if (to && emailConfigured()) {
    emailed = await sendEmail({ to, subject: `Kalwings contact: ${data.topic} — ${data.name}`, text: `From: ${data.name} <${data.email}>\nTopic: ${data.topic}\n\n${data.message}` }).then(() => true).catch(() => false);
  }
  if (!stored && !emailed) return { error: "We couldn't send your message right now. Please try again in a few minutes." };
  return { ok: true };
}
