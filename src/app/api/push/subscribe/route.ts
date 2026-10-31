import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { assertSameOrigin } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { parseSubscription } from "@/lib/push-parse";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** POST a browser PushSubscription ({ endpoint, keys: { p256dh, auth } }). A person can have 5 devices. */
export async function POST(req: Request) {
  try { await assertSameOrigin(); } catch { return bad("Bad origin", 403); }
  const user = await getUser(); if (!user) return bad("Please sign in", 401);
  if (!(await rateLimit(`pushsub:${user.id}`, 30, 60 * 60 * 1000))) return bad("Too many requests. Try again later.", 429);
  const sub = parseSubscription(await req.json().catch(() => null)); if (!sub) return bad("That subscription is not valid");
  const endpointHash = createHash("sha256").update(sub.endpoint).digest("hex");
  const mine = await db.pushSubscription.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { id: true, endpointHash: true } });
  if (!mine.some((m) => m.endpointHash === endpointHash) && mine.length >= 5) await db.pushSubscription.delete({ where: { id: mine[0].id } }); // keep the newest five
  await db.pushSubscription.upsert({ where: { endpointHash }, create: { userId: user.id, endpointHash, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, update: { userId: user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth } });
  return NextResponse.json({ ok: true });
}
