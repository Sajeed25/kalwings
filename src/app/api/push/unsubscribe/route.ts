import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { assertSameOrigin } from "@/lib/request";

/** POST { endpoint }: stops push to that device for the signed-in person. */
export async function POST(req: Request) {
  try { await assertSameOrigin(); } catch { return NextResponse.json({ error: "Bad origin" }, { status: 403 }); }
  const user = await getUser(); if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const j = (await req.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (typeof j?.endpoint !== "string" || j.endpoint.length > 800) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  await db.pushSubscription.deleteMany({ where: { userId: user.id, endpointHash: createHash("sha256").update(j.endpoint).digest("hex") } });
  return NextResponse.json({ ok: true });
}
