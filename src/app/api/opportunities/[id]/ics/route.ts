import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildIcs } from "@/lib/calendar";
import { shortUrl } from "@/lib/distribution";

/** Calendar reminder for a listing's deadline (an all-day entry). Only for listings the public can see. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await db.opportunity.findFirst({ where: { id, moderated: "VERIFIED", closedAt: null, deadline: { gt: new Date() }, company: { status: "VERIFIED" } }, include: { company: true } });
  if (!o) return new NextResponse("Not found", { status: 404 });
  const ics = buildIcs({ uid: `deadline-${o.id}`, title: `Apply by today: ${o.title} at ${o.company.name}`, start: o.deadline, allDay: true, location: o.location, description: `${o.payText}${o.unpaid ? " (unpaid)" : ""} · Eligibility: ${o.eligibility}`, url: shortUrl(o) });
  return new NextResponse(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="kalwings-deadline.ics"`, "Cache-Control": "public, max-age=300" } });
}
