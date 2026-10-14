import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Calendar file for an interview. Only the candidate or a recruiter at the hiring company can download it. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const iv = await db.interview.findFirst({
    where: { id, status: "SCHEDULED", application: { OR: [{ student: { userId: user.id } }, { opportunity: { company: { members: { some: { userId: user.id } } } } }] } },
    include: { application: { include: { opportunity: { include: { company: true } }, student: { include: { user: { select: { name: true } } } } } } },
  });
  if (!iv) return new NextResponse("Not found", { status: 404 });
  const a = iv.application;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kalwings//Interview//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${iv.id}@kalwings`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(iv.scheduledAt)}`, `DTEND:${stamp(new Date(iv.scheduledAt.getTime() + iv.minutes * 60_000))}`,
    `SUMMARY:${esc(`Interview: ${a.opportunity.title} at ${a.opportunity.company.name}`)}`,
    `LOCATION:${esc(iv.detail)}`,
    `DESCRIPTION:${esc(`Candidate: ${a.student.user.name}\nMode: ${iv.mode.toLowerCase()}\n${iv.notes ?? ""}`)}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return new NextResponse(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="kalwings-interview.ics"`, "Cache-Control": "private, no-store" } });
}
