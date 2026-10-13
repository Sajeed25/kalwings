"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { audit, notify } from "@/lib/audit";

type Decision = "VERIFIED" | "REJECTED";
const ok = (d: string): d is Decision => d === "VERIFIED" || d === "REJECTED";

export async function reviewCompany(id: string, d: Decision) {
  const a = await requireActionRole("PLATFORM_ADMIN");
  if (!ok(d)) throw new Error("Invalid");
  const c = await db.company.update({ where: { id }, data: { status: d, verifiedAt: d === "VERIFIED" ? new Date() : null }, include: { members: true } });
  await audit(a.id, `company.${d.toLowerCase()}`, `${c.name} (${id})`);
  await Promise.all(c.members.map((m) => notify(m.userId, `Company ${d.toLowerCase()}`, c.name)));
  revalidatePath("/dashboard", "layout");
}

export async function reviewCollege(id: string, d: Decision) {
  const a = await requireActionRole("PLATFORM_ADMIN");
  if (!ok(d)) throw new Error("Invalid");
  const c = await db.college.update({ where: { id }, data: { status: d }, include: { admins: true } });
  await audit(a.id, `college.${d.toLowerCase()}`, `${c.name} (${id})`);
  await Promise.all(c.admins.map((m) => notify(m.userId, `College ${d.toLowerCase()}`, c.name)));
  revalidatePath("/dashboard", "layout");
}

export async function reviewMentor(id: string, d: Decision) {
  const a = await requireActionRole("PLATFORM_ADMIN");
  if (!ok(d)) throw new Error("Invalid");
  const m = await db.mentorProfile.update({ where: { id }, data: { status: d, verifiedAt: d === "VERIFIED" ? new Date() : null }, include: { user: true } });
  await audit(a.id, `mentor.${d.toLowerCase()}`, `${m.user.name} (${id})`);
  await notify(m.userId, `Mentor profile ${d.toLowerCase()}`);
  revalidatePath("/dashboard", "layout");
}

export async function moderateOpportunity(id: string, d: Decision) {
  const a = await requireActionRole("PLATFORM_ADMIN");
  if (!ok(d)) throw new Error("Invalid");
  const o = await db.opportunity.update({ where: { id }, data: { moderated: d }, include: { company: { include: { members: true } } } });
  await audit(a.id, `listing.${d.toLowerCase()}`, `${o.title} (${id})`);
  await Promise.all(o.company.members.map((m) => notify(m.userId, `Listing ${d.toLowerCase()}`, o.title)));
  revalidatePath("/dashboard", "layout");
  revalidatePath("/opportunities");
}

export async function resolveReport(id: string) {
  const a = await requireActionRole("PLATFORM_ADMIN");
  await db.report.update({ where: { id }, data: { resolvedAt: new Date() } });
  await audit(a.id, "report.resolved", id);
  revalidatePath("/dashboard", "layout");
}

export async function markContactHandled(id: string) {
  const a = await requireActionRole("PLATFORM_ADMIN");
  await db.contactMessage.update({ where: { id }, data: { handledAt: new Date() } });
  await audit(a.id, "contact.handled", id);
  revalidatePath("/dashboard", "layout");
}
