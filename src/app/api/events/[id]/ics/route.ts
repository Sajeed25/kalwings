import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildIcs } from "@/lib/calendar";
import { site } from "@/lib/site";
import { priceLabel } from "@/lib/events";

/** Calendar file for a public event. The joining link is NOT included (it is for people who RSVP). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await db.event.findFirst({ where: { id, status: { in: ["LIVE", "CANCELLED"] } } });
  if (!e) return new NextResponse("Not found", { status: 404 });
  const ics = buildIcs({ uid: `event-${e.id}`, title: e.title, start: e.startsAt, end: e.endsAt, location: e.location, description: `${e.organiserName} · ${priceLabel(e)}\n${e.description.slice(0, 300)}`, url: `${site.url}/events/${e.id}` });
  return new NextResponse(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="kalwings-event.ics"`, "Cache-Control": "public, max-age=300" } });
}
