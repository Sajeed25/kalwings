"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { departmentSchema, driveSchema, studentDepartmentSchema, csv } from "@/lib/validation";
import { audit, notify } from "@/lib/audit";
import { fail, obj, type Result } from "./_shared";

const refresh = () => revalidatePath("/dashboard", "layout");

async function verifiedCollege() {
  const u = await requireActionRole("COLLEGE_ADMIN");
  const mem = await db.collegeAdmin.findUnique({ where: { userId: u.id }, include: { college: true } });
  if (!mem || mem.college.status !== "VERIFIED") throw new Error("Your college must be verified first.");
  return { u, college: mem.college };
}
async function verifiedCompany() {
  const u = await requireActionRole("EMPLOYER");
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
  if (!mem || mem.company.status !== "VERIFIED") throw new Error("Your company must be verified first.");
  return { u, company: mem.company };
}

export async function addDepartment(_: Result, fd: FormData): Promise<Result> {
  const { college } = await verifiedCollege();
  const r = departmentSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  if ((await db.department.count({ where: { collegeId: college.id } })) >= 40) return { error: "Department limit reached (40)." };
  try { await db.department.create({ data: { collegeId: college.id, name: r.data.name } }); } catch { return { error: "That department already exists." }; }
  refresh();
  return { ok: true };
}

export async function deleteDepartment(id: string) {
  const { college } = await verifiedCollege();
  await db.department.deleteMany({ where: { id, collegeId: college.id } });
  refresh();
}

export async function createDrive(_: Result, fd: FormData): Promise<Result> {
  const { u, college } = await verifiedCollege();
  const r = driveSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const company = await db.company.findFirst({ where: { id: r.data.companyId, status: "VERIFIED" }, include: { members: true } });
  if (!company) return { error: "Choose a verified company." };
  const deptIds = fd.getAll("departmentIds").map(String);
  const valid = deptIds.length ? await db.department.findMany({ where: { id: { in: deptIds }, collegeId: college.id }, select: { id: true } }) : [];
  const d = r.data;
  const drive = await db.drive.create({ data: { collegeId: college.id, companyId: company.id, title: d.title, description: d.description, driveDate: d.driveDate, gradYears: csv(d.gradYears).map(Number).filter((n) => n > 2000 && n < 2100), departmentIds: valid.map((x) => x.id), minCompleteness: d.minCompleteness, createdById: u.id } });
  await audit(u.id, "drive.proposed", `${d.title} (${drive.id}) → ${company.name}`);
  await Promise.all(company.members.map((m) => notify(m.userId, "Campus drive proposed", `${college.name} proposed "${d.title}". Open Campus drives to respond.`)));
  refresh();
  return { ok: true };
}

export async function respondDrive(driveId: string, accept: boolean) {
  const { u, company } = await verifiedCompany();
  const dr = await db.drive.findFirst({ where: { id: driveId, companyId: company.id, status: "PROPOSED" }, include: { college: { include: { admins: true } } } });
  if (!dr) return;
  await db.drive.update({ where: { id: dr.id }, data: { status: accept ? "CONFIRMED" : "DECLINED" } });
  await audit(u.id, accept ? "drive.confirmed" : "drive.declined", `${dr.title} (${dr.id})`);
  await Promise.all(dr.college.admins.map((a) => notify(a.userId, accept ? "Drive confirmed" : "Drive declined", `${company.name}: ${dr.title}`)));
  refresh();
}

export async function closeDrive(driveId: string) {
  const { college } = await verifiedCollege();
  await db.drive.updateMany({ where: { id: driveId, collegeId: college.id, status: { in: ["PROPOSED", "CONFIRMED"] } }, data: { status: "CLOSED" } });
  refresh();
}

/** Invites only students of this college who opted in, are eligible, and have a profile. Never anyone else. */
export async function inviteEligible(driveId: string) {
  const { u, college } = await verifiedCollege();
  const dr = await db.drive.findFirst({ where: { id: driveId, collegeId: college.id, status: "CONFIRMED" } });
  if (!dr) throw new Error("The company must confirm the drive before you invite students.");
  const years = (Array.isArray(dr.gradYears) ? (dr.gradYears as number[]) : []).map(Number);
  const depts = Array.isArray(dr.departmentIds) ? (dr.departmentIds as string[]) : [];
  const students = await db.studentProfile.findMany({
    where: { collegeId: college.id, shareWithCollege: true, headline: { not: null }, completeness: { gte: dr.minCompleteness }, user: { suspendedAt: null }, ...(years.length ? { graduationYear: { in: years } } : {}), ...(depts.length ? { departmentId: { in: depts } } : {}), driveInvites: { none: { driveId: dr.id } } },
    select: { id: true, userId: true }, take: 500,
  });
  if (!students.length) return;
  await db.driveInvite.createMany({ data: students.map((s) => ({ driveId: dr.id, studentId: s.id })), skipDuplicates: true });
  await audit(u.id, "drive.invited", `${students.length} students → ${dr.title} (${dr.id})`);
  await Promise.all(students.map((s) => notify(s.userId, "Campus drive invitation", `${dr.title}. Accepting shares your name, headline and Passport link with the company. Open Campus drives.`)));
  refresh();
}

/** Accepting is the student's consent to share name, headline, department and Passport link with this company for this drive. */
export async function respondInvite(inviteId: string, accept: boolean) {
  const u = await requireActionRole("STUDENT");
  const inv = await db.driveInvite.findFirst({ where: { id: inviteId, student: { userId: u.id }, status: "INVITED", drive: { status: "CONFIRMED" } }, include: { drive: { include: { company: { include: { members: true } } } } } });
  if (!inv) return;
  await db.driveInvite.update({ where: { id: inv.id }, data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() } });
  if (accept) await Promise.all(inv.drive.company.members.map((m) => notify(m.userId, "Student joined a drive", `${u.name} accepted ${inv.drive.title}`)));
  refresh();
}

export async function setOutcome(inviteId: string, outcome: "SHORTLISTED" | "OFFERED" | "HIRED" | "NOT_SELECTED") {
  const { company } = await verifiedCompany();
  if (!["SHORTLISTED", "OFFERED", "HIRED", "NOT_SELECTED"].includes(outcome)) throw new Error("Invalid");
  const inv = await db.driveInvite.findFirst({ where: { id: inviteId, status: "ACCEPTED", drive: { companyId: company.id } }, include: { student: true, drive: true } });
  if (!inv) return;
  await db.driveInvite.update({ where: { id: inv.id }, data: { outcome } });
  await notify(inv.student.userId, "Drive update", `${inv.drive.title}: ${outcome.replace("_", " ").toLowerCase()}`);
  refresh();
}

export async function setDepartment(_: Result, fd: FormData): Promise<Result> {
  const u = await requireActionRole("STUDENT");
  const sp = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id } });
  const r = studentDepartmentSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const id = r.data.departmentId || null;
  if (id && !(sp.collegeId && (await db.department.findFirst({ where: { id, collegeId: sp.collegeId } })))) return { error: "Choose a department from your college." };
  await db.studentProfile.update({ where: { id: sp.id }, data: { departmentId: id } });
  refresh();
  return { ok: true };
}
