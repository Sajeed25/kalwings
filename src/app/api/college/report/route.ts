import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

const RANK = ["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"];
/** Neutralise spreadsheet formulas and quote every cell. */
const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
const csv = (rows: unknown[][]) => rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";

/**
 * Placement reports for a verified college's own admins. Privacy: only students who opted in appear; no email or phone,
 * ever; drive reports contain counts only. Every download is audit-logged.
 */
export async function GET(req: Request) {
  const user = await getUser();
  if (!user || user.role !== "COLLEGE_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const mem = await db.collegeAdmin.findUnique({ where: { userId: user.id }, include: { college: true } });
  if (!mem || mem.college.status !== "VERIFIED") return new NextResponse("Forbidden", { status: 403 });
  if (!(await rateLimit(`college-report:${user.id}`, 20, 60 * 60 * 1000))) return new NextResponse("Too many downloads. Try again later.", { status: 429 });
  const type = new URL(req.url).searchParams.get("type");
  let body: string;
  if (type === "roster") {
    const rows = await db.studentProfile.findMany({
      where: { collegeId: mem.collegeId, shareWithCollege: true, user: { suspendedAt: null } }, orderBy: { completeness: "desc" }, take: 5000,
      select: { graduationYear: true, completeness: true, user: { select: { name: true } }, department: { select: { name: true } }, applications: { select: { stage: true } }, _count: { select: { skills: true } } },
    });
    body = csv([["Name", "Department", "Graduation year", "Profile score %", "Evidence-backed skills", "Applications", "Furthest stage"],
      ...rows.map((s) => [s.user.name, s.department?.name ?? "", s.graduationYear ?? "", s.completeness, s._count.skills, s.applications.length, s.applications.reduce((b, a) => (RANK.indexOf(a.stage) > RANK.indexOf(b) ? a.stage : b), "") || ""])]);
  } else if (type === "drives") {
    const drives = await db.drive.findMany({ where: { collegeId: mem.collegeId }, orderBy: { driveDate: "desc" }, include: { company: { select: { name: true } }, invites: { select: { status: true, outcome: true } } } });
    body = csv([["Drive", "Company", "Date", "Status", "Invited", "Accepted", "Declined", "Shortlisted", "Offered", "Hired"],
      ...drives.map((d) => [d.title, d.company.name, d.driveDate.toISOString().slice(0, 10), d.status, d.invites.length, d.invites.filter((i) => i.status === "ACCEPTED").length, d.invites.filter((i) => i.status === "DECLINED").length, d.invites.filter((i) => i.outcome === "SHORTLISTED").length, d.invites.filter((i) => i.outcome === "OFFERED").length, d.invites.filter((i) => i.outcome === "HIRED").length])]);
  } else return new NextResponse("Unknown report", { status: 400 });
  await audit(user.id, "college.report", `${type} (${mem.college.name})`);
  return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="kalwings-${type}.csv"`, "Cache-Control": "private, no-store" } });
}
