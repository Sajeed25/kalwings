import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Calendar invite for an accepted session. Only the student or the mentor of that session can download it. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const s = await db.mentorSession.findFirst({
    where: { id, status: { in: ["ACCEPTED", "COMPLETED"] }, startsAt: { not: null }, OR: [{ student: { userId: user.id } }, { mentor: { userId: user.id } }] },
    include: { slot: true, mentor: { include: { user: true } }, student: { include: { user: true } } },
  });
  if (!s || !s.startsAt) return new NextResponse("Not found", { status: 404 });
  const end = s.slot?.endsAt ?? new Date(s.startsAt.getTime() + 30 * 60_000);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kalwings//Mentor session//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${s.id}@kalwings`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(s.startsAt)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`Kalwings mentor session: ${s.topic}`)}`,
    `DESCRIPTION:${esc(`Mentor: ${s.mentor.user.name}\nStudent: ${s.student.user.name}\nAgree the meeting link in your Kalwings messages.`)}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return new NextResponse(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="kalwings-session.ics"`, "Cache-Control": "private, no-store" } });
}
