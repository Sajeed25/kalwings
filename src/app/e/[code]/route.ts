import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cleanSource } from "@/lib/distribution-utils";

/** Short link for an event: /e/<code> opens it and keeps the share source. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; const url = new URL(req.url);
  const e = /^[a-z0-9]{6,12}$/.test(code) ? await db.event.findUnique({ where: { shortCode: code }, select: { id: true } }) : null;
  if (!e) return NextResponse.redirect(new URL("/events", url.origin), 302);
  const dest = new URL(`/events/${e.id}`, url.origin); const src = cleanSource(url.searchParams.get("src")); if (src) dest.searchParams.set("src", src);
  return NextResponse.redirect(dest, 302);
}
