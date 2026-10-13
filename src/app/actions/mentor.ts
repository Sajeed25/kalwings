"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { mentorProfileSchema, slotSchema, endorsementSchema, csv } from "@/lib/validation";
import { notify } from "@/lib/audit";
import { uniqueSlug } from "@/lib/slug";
import { fail, obj, type Result } from "./_shared";

export async function saveMentorProfile(_: Result, fd: FormData): Promise<Result> {
  const u = await requireActionRole("MENTOR");
  const r = mentorProfileSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const d = { roleTitle: r.data.roleTitle, company: r.data.company, country: r.data.country, domain: r.data.domain, tags: csv(r.data.tags), bio: r.data.bio || null };
  await db.mentorProfile.upsert({ where: { userId: u.id }, create: { ...d, userId: u.id, slug: uniqueSlug(u.name) }, update: d }); // status untouched: only admins verify
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

async function myMentor() {
  const u = await requireActionRole("MENTOR");
  const m = await db.mentorProfile.findUnique({ where: { userId: u.id } });
  if (!m) throw new Error("Create your mentor profile first.");
  return { u, m };
}

export async function addSlot(_: Result, fd: FormData): Promise<Result> {
  const { m } = await myMentor();
  const r = slotSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  await db.officeHourSlot.create({ data: { mentorId: m.id, startsAt: r.data.startsAt, endsAt: new Date(r.data.startsAt.getTime() + r.data.minutes * 60000) } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteSlot(id: string) {
  const { m } = await myMentor();
  const r = await db.officeHourSlot.deleteMany({ where: { id, mentorId: m.id, sessionId: null } }); // booked slots can't be removed
  if (r.count === 0) throw new Error("This slot is booked. Decline or complete the session first.");
  revalidatePath("/dashboard", "layout");
}

export async function respondToSession(id: string, to: "ACCEPTED" | "DECLINED" | "COMPLETED") {
  const { u, m } = await myMentor();
  const s = await db.mentorSession.findFirst({ where: { id, mentorId: m.id }, include: { student: true } });
  if (!s) throw new Error("Not found");
  const allowed: Record<string, string[]> = { REQUESTED: ["ACCEPTED", "DECLINED"], ACCEPTED: ["COMPLETED"] };
  if (!allowed[s.status]?.includes(to)) throw new Error("Invalid transition");
  await db.mentorSession.update({ where: { id }, data: { status: to } });
  if (to === "DECLINED") await db.officeHourSlot.updateMany({ where: { sessionId: id }, data: { sessionId: null } }); // free the slot again
  await notify(s.student.userId, `Session ${to.toLowerCase()}`, `${u.name} ${to.toLowerCase()} your request: ${s.topic}`);
  revalidatePath("/dashboard", "layout");
}

/** Endorsements require a COMPLETED session with that student and a link to the work being endorsed. */
export async function giveEndorsement(_: Result, fd: FormData): Promise<Result> {
  const { u, m } = await myMentor();
  if (m.status !== "VERIFIED") return { error: "Your mentor profile must be verified first." };
  const r = endorsementSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const done = await db.mentorSession.findFirst({ where: { mentorId: m.id, studentId: r.data.studentId, status: "COMPLETED" }, include: { student: true } });
  if (!done) return { error: "You can only endorse students you've completed a session with." };
  const e = await db.endorsement.create({ data: { mentorId: m.id, studentId: done.studentId, text: r.data.text, evidence: r.data.evidence } });
  await db.skillEvidence.create({ data: { studentId: done.studentId, skill: r.data.skill, basis: `endorsement:${e.id}`, explanation: `Endorsed by ${u.name} (${m.roleTitle}, ${m.company}) after a mentoring session. Evidence: ${r.data.evidence}` } });
  await notify(done.student.userId, "New endorsement", `${u.name} endorsed your ${r.data.skill}`);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
