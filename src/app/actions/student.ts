"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { profileSchema, projectSchema, sessionRequestSchema, studentCollegeSchema, privacySchema, entrySchema, csv } from "@/lib/validation";
import { usernameSchema } from "@/lib/passport";
import { WITHDRAWABLE } from "@/lib/stages";
import { completeness } from "@/lib/completeness";
import { notify } from "@/lib/audit";
import { fail, obj, type Result } from "./_shared";

async function me() {
  const u = await requireActionRole("STUDENT");
  const p = await db.studentProfile.findUnique({ where: { userId: u.id }, include: { projects: true } });
  if (!p) throw new Error("No student profile");
  return { u, p };
}

async function refreshScore(studentId: string) {
  const p = await db.studentProfile.findUniqueOrThrow({ where: { id: studentId }, include: { projects: true } });
  const ev = await db.skillEvidence.count({ where: { studentId } });
  await db.studentProfile.update({ where: { id: studentId }, data: { completeness: completeness(p, ev).score } });
}

export async function saveProfile(_: Result, fd: FormData): Promise<Result> {
  const { u, p } = await me();
  const r = profileSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const d = r.data;
  await db.$transaction([
    db.user.update({ where: { id: u.id }, data: { name: d.name } }),
    db.studentProfile.update({ where: { id: p.id }, data: { headline: d.headline, bio: d.bio || null, city: d.city || null, graduationYear: d.graduationYear, githubUrl: d.githubUrl ?? null, skillsClaimed: csv(d.skills), lookingFor: d.lookingFor || null } }),
  ]);
  await refreshScore(p.id);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function addProject(_: Result, fd: FormData): Promise<Result> {
  const { p } = await me();
  const r = projectSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  if ((await db.project.count({ where: { studentId: p.id } })) >= 20) return { error: "Project limit reached (20)." };
  await db.project.create({ data: { studentId: p.id, title: r.data.title, summary: r.data.summary, githubUrl: r.data.githubUrl ?? null, demoUrl: r.data.demoUrl ?? null } });
  await refreshScore(p.id);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteProject(id: string) {
  const { u, p } = await me();
  const proj = await db.project.findFirst({ where: { id, studentId: p.id } }); // scoped to owner
  if (!proj) return;
  await db.project.delete({ where: { id: proj.id } });
  if (proj.imageId) await db.upload.deleteMany({ where: { id: proj.imageId, ownerId: u.id } });
  await refreshScore(p.id);
  revalidatePath("/dashboard", "layout");
}

export async function saveCollege(_: Result, fd: FormData): Promise<Result> {
  const { p } = await me();
  const r = studentCollegeSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const collegeId = r.data.collegeId || null;
  if (collegeId && !(await db.college.findFirst({ where: { id: collegeId, status: "VERIFIED" } }))) return { error: "Choose a college from the list." };
  // Consent is only meaningful with a college, and is off unless ticked.
  await db.studentProfile.update({ where: { id: p.id }, data: { collegeId, shareWithCollege: !!collegeId && r.data.share === "on" } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function toggleContactVisible() {
  const { p } = await me();
  await db.studentProfile.update({ where: { id: p.id }, data: { contactVisible: !p.contactVisible } });
  revalidatePath("/dashboard", "layout");
}

export async function applyTo(opportunityId: string) {
  const { u, p } = await me();
  const o = await db.opportunity.findUnique({ where: { id: opportunityId }, include: { company: { include: { members: true } } } });
  if (!o || o.moderated !== "VERIFIED" || o.company.status !== "VERIFIED" || o.closedAt || o.deadline < new Date()) throw new Error("This opportunity isn't open for applications.");
  if (!p.headline) throw new Error("Complete your profile before applying.");
  const existing = await db.application.findUnique({ where: { opportunityId_studentId: { opportunityId, studentId: p.id } } });
  if (existing) return;
  await db.application.create({ data: { opportunityId, studentId: p.id } });
  await Promise.all(o.company.members.map((m) => notify(m.userId, "New application", `${u.name} applied to ${o.title}`)));
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function withdrawApplication(id: string) {
  const { p } = await me();
  await db.application.updateMany({ where: { id, studentId: p.id, stage: { in: WITHDRAWABLE } }, data: { stage: "WITHDRAWN" } });
  revalidatePath("/dashboard", "layout");
}

export async function toggleSave(opportunityId: string) {
  const { p } = await me();
  const key = { studentId_opportunityId: { studentId: p.id, opportunityId } };
  if (await db.savedOpportunity.findUnique({ where: key })) await db.savedOpportunity.delete({ where: key });
  else await db.savedOpportunity.create({ data: { studentId: p.id, opportunityId } });
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function requestSession(_: Result, fd: FormData): Promise<Result> {
  const { u, p } = await me();
  const r = sessionRequestSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const m = await db.mentorProfile.findUnique({ where: { id: r.data.mentorId } });
  if (!m || m.status !== "VERIFIED") return { error: "This mentor isn't available." };
  const open = await db.mentorSession.count({ where: { studentId: p.id, mentorId: m.id, status: { in: ["REQUESTED", "ACCEPTED"] } } });
  if (open >= 1) return { error: "You already have an open request with this mentor." };
  const slotId = r.data.slotId || undefined;
  try {
    // Create the request and claim the slot atomically so two students can never hold the same slot.
    await db.$transaction(async (tx) => {
      const s = await tx.mentorSession.create({ data: { mentorId: m.id, studentId: p.id, topic: r.data.topic, message: r.data.message || null } });
      if (!slotId) return;
      const slot = await tx.officeHourSlot.findFirst({ where: { id: slotId, mentorId: m.id, sessionId: null, startsAt: { gt: new Date() } } });
      if (!slot) throw new Error("SLOT_TAKEN");
      const claimed = await tx.officeHourSlot.updateMany({ where: { id: slotId, sessionId: null }, data: { sessionId: s.id } });
      if (claimed.count !== 1) throw new Error("SLOT_TAKEN");
      await tx.mentorSession.update({ where: { id: s.id }, data: { startsAt: slot.startsAt } });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SLOT_TAKEN") return { error: "That time was just taken. Please pick another slot." };
    throw e;
  }
  await notify(m.userId, "New session request", `${u.name}: ${r.data.topic}`);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function cancelSession(id: string) {
  const { u, p } = await me();
  const s = await db.mentorSession.findFirst({ where: { id, studentId: p.id, status: { in: ["REQUESTED", "ACCEPTED"] } }, include: { mentor: true } });
  if (!s) throw new Error("Not found");
  await db.$transaction([
    db.mentorSession.update({ where: { id }, data: { status: "CANCELLED" } }),
    db.officeHourSlot.updateMany({ where: { sessionId: id }, data: { sessionId: null } }), // free the slot
  ]);
  await notify(s.mentor.userId, "Session cancelled", `${u.name} cancelled: ${s.topic}`);
  revalidatePath("/dashboard", "layout");
}

export async function markNotificationsRead() {
  const u = await requireActionRole();
  await db.notification.updateMany({ where: { userId: u.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/dashboard", "layout");
}

export async function saveUsername(_: Result, fd: FormData): Promise<Result> {
  const { p } = await me();
  const r = usernameSchema.safeParse(String(fd.get("username") ?? ""));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Invalid username", fieldErrors: { username: r.error.issues[0]?.message ?? "Invalid" } };
  const taken = await db.studentProfile.findFirst({ where: { OR: [{ username: r.data }, { slug: r.data }], NOT: { id: p.id } }, select: { id: true } });
  if (taken) return { error: "That username is taken." };
  try { await db.studentProfile.update({ where: { id: p.id }, data: { username: r.data } }); } catch { return { error: "That username is taken." }; }
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function savePrivacy(_: Result, fd: FormData): Promise<Result> {
  const { p } = await me();
  const r = privacySchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  await db.studentProfile.update({ where: { id: p.id }, data: r.data });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function addEntry(_: Result, fd: FormData): Promise<Result> {
  const { p } = await me();
  const r = entrySchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  if ((await db.passportEntry.count({ where: { studentId: p.id } })) >= 40) return { error: "Entry limit reached (40)." };
  const d = r.data;
  await db.passportEntry.create({ data: { studentId: p.id, kind: d.kind, title: d.title, org: d.org || null, year: d.year ?? null, url: d.url ?? null, summary: d.summary || null } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteEntry(id: string) {
  const { p } = await me();
  await db.passportEntry.deleteMany({ where: { id, studentId: p.id } }); // scoped to owner
  revalidatePath("/dashboard", "layout");
}

/** Verification needs evidence: an admin checks the URL. Nothing is verified automatically. */
export async function requestEntryVerification(id: string) {
  const { p } = await me();
  const e = await db.passportEntry.findFirst({ where: { id, studentId: p.id, status: "PENDING" } });
  if (!e || !e.url) return;
  await db.passportEntry.update({ where: { id: e.id }, data: { verifyRequested: true } });
  revalidatePath("/dashboard", "layout");
}

/** Candidate response to an offer. Declining withdraws the application. */
export async function respondOffer(applicationId: string, accept: boolean) {
  const { u, p } = await me();
  const app = await db.application.findFirst({ where: { id: applicationId, studentId: p.id, stage: "OFFER", offer: { status: "EXTENDED" } }, include: { offer: true, opportunity: { include: { company: { include: { members: true } } } } } });
  if (!app?.offer) return;
  await db.$transaction([
    db.offer.update({ where: { id: app.offer.id }, data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() } }),
    ...(accept ? [] : [db.application.update({ where: { id: app.id }, data: { stage: "WITHDRAWN" } })]),
  ]);
  await Promise.all(app.opportunity.company.members.map((m) => notify(m.userId, accept ? "Offer accepted" : "Offer declined", `${u.name} · ${app.opportunity.title}`)));
  revalidatePath("/dashboard", "layout");
}
