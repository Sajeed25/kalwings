"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { messageSchema, reportSchema } from "@/lib/validation";
import { notify } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { fail, obj, type Result } from "./_shared";

/** Messaging is per-application: only the applicant and members of the owning (verified) company can post. */
export async function sendMessage(_: Result, fd: FormData): Promise<Result> {
  const u = await requireActionRole("STUDENT", "EMPLOYER");
  const r = messageSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  if (!(await rateLimit(`msg:${u.id}`, 30, 60_000))) return { error: "Slow down a little." };
  const app = await db.application.findUnique({ where: { id: r.data.applicationId }, include: { student: true, opportunity: { include: { company: { include: { members: true } } } } } });
  if (!app) return { error: "Not found" };
  const isStudent = app.student.userId === u.id;
  const isEmployer = app.opportunity.company.status === "VERIFIED" && app.opportunity.company.members.some((m) => m.userId === u.id);
  if (!isStudent && !isEmployer) return { error: "Forbidden" };
  // Students can reply only once an employer has opened the conversation.
  if (isStudent && !(await db.message.count({ where: { applicationId: app.id } })) && app.stage === "APPLIED") return { error: "You can message once the employer has responded." };
  await db.message.create({ data: { applicationId: app.id, senderId: u.id, body: r.data.body } });
  const others = isStudent ? app.opportunity.company.members.map((m) => m.userId) : [app.student.userId];
  await Promise.all(others.map((id) => notify(id, "New message", `About: ${app.opportunity.title}`)));
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function reportContent(_: Result, fd: FormData): Promise<Result> {
  const u = await requireActionRole();
  const r = reportSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  if (!(await rateLimit(`report:${u.id}`, 10, 60 * 60 * 1000))) return { error: "Too many reports. Try again later." };
  await db.report.create({ data: { ...r.data, reporterId: u.id } });
  return { ok: true };
}

export async function setEmailNotifications(_: Result, fd: FormData): Promise<Result> {
  const u = await requireActionRole();
  await db.user.update({ where: { id: u.id }, data: { emailNotifications: fd.get("email") === "on" } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
