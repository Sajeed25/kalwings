"use server";
import { cleanSource } from "@/lib/distribution";
import { stageEvent } from "@/lib/stage-history";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { profileSchema, projectSchema, sessionRequestSchema, studentCollegeSchema, privacySchema, entrySchema, submissionSchema, csv } from "@/lib/validation";
import { usernameSchema } from "@/lib/passport";
import { WITHDRAWABLE } from "@/lib/stages";
import { completeness } from "@/lib/completeness";
import { notify } from "@/lib/audit";
import { liveProfileScore } from "@/lib/profile-score";
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
  await db.studentProfile.update({ where: { id: p.id }, data: { collegeId, departmentId: collegeId === p.collegeId ? p.departmentId : null, shareWithCollege: !!collegeId && r.data.share === "on" } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function toggleContactVisible() {
  const { p } = await me();
  await db.studentProfile.update({ where: { id: p.id }, data: { contactVisible: !p.contactVisible } });
  revalidatePath("/dashboard", "layout");
}

type Attach = { resume: boolean; intro: boolean };
async function createApplication(opportunityId: string, srcIn: string | undefined, refIn: string | undefined, answers: Map<string, string>, attach: Attach) {
  const { u, p } = await me();
  const o = await db.opportunity.findUnique({ where: { id: opportunityId }, include: { questions: { orderBy: { position: "asc" } }, company: { include: { members: true } } } });
  if (!o || o.moderated !== "VERIFIED" || o.company.status !== "VERIFIED" || o.closedAt || o.deadline < new Date()) throw new Error("This opportunity isn't open for applications.");
  if (!p.headline) throw new Error("Complete your profile before applying.");
  const existing = await db.application.findUnique({ where: { opportunityId_studentId: { opportunityId, studentId: p.id } } });
  if (existing) return;
  const missing = o.questions.find((q) => !(answers.get(q.id) ?? "").trim());
  if (missing) throw new Error("Please answer every screening question.");
  // The candidate chooses what this company receives: the resume on file, and (only at a 100% profile) the intro video
  const resumeId = attach.resume ? p.resumeId ?? null : null;
  let introVideoId: string | null = null;
  if (attach.intro && p.introVideoId && (await liveProfileScore(p.id)).score >= 100) introVideoId = p.introVideoId;
  const src = cleanSource(srcIn);
  const ref = refIn && refIn !== p.id ? (await db.studentProfile.findUnique({ where: { id: refIn }, select: { id: true } }))?.id ?? null : null;
  await db.application.create({ data: {
    opportunityId, studentId: p.id, source: ref ? "referral" : src, referrerId: ref, resumeId, introVideoId,
    events: { create: { toStage: "APPLIED", actorId: u.id } },
    answers: { create: o.questions.map((q) => ({ questionId: q.id, answer: (answers.get(q.id) ?? "").trim().slice(0, 1000) })) },
  } });
  await Promise.all(o.company.members.map((m) => notify(m.userId, "New application", `${u.name} applied to ${o.title}${resumeId ? " (resume attached)" : ""}${introVideoId ? " (intro video shared)" : ""}`)));
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/opportunities/${opportunityId}`);
}

/** One-click apply for listings without screening questions. */
export async function applyTo(opportunityId: string, srcIn?: string, refIn?: string) {
  await createApplication(opportunityId, srcIn, refIn, new Map(), { resume: true, intro: false }); // one tap: sends the resume on file, never the video
}

/** Apply to a listing that has screening questions. Answers are for the hiring team to read; they never score or filter anyone. */
export async function applyWithAnswers(opportunityId: string, srcIn: string | undefined, refIn: string | undefined, _: Result, fd: FormData): Promise<Result> {
  const answers = new Map<string, string>();
  for (const [k, v] of fd.entries()) if (k.startsWith("q_") && typeof v === "string") answers.set(k.slice(2), v);
  try { await createApplication(opportunityId, srcIn, refIn, answers, { resume: fd.get("attachResume") === "on", intro: fd.get("shareIntro") === "on" }); } catch (e) { return { error: e instanceof Error ? e.message : "Could not apply." }; }
  return { ok: true };
}

export async function withdrawApplication(id: string) {
  const { p } = await me();
  const cur = await db.application.findFirst({ where: { id, studentId: p.id, stage: { in: WITHDRAWABLE } }, select: { stage: true } });
  if (cur) await db.$transaction([db.application.updateMany({ where: { id, studentId: p.id, stage: { in: WITHDRAWABLE } }, data: { stage: "WITHDRAWN" } }), stageEvent(id, cur.stage, "WITHDRAWN", p.userId)]);
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
    ...(accept ? [] : [db.application.update({ where: { id: app.id }, data: { stage: "WITHDRAWN" } }), stageEvent(app.id, "OFFER", "WITHDRAWN", u.id)]),
  ]);
  await Promise.all(app.opportunity.company.members.map((m) => notify(m.userId, accept ? "Offer accepted" : "Offer declined", `${u.name} · ${app.opportunity.title}`)));
  revalidatePath("/dashboard", "layout");
}

/** Submit (or resubmit before review) work for a challenge. One submission per student per challenge. */
export async function submitWork(_: Result, fd: FormData): Promise<Result> {
  const { u, p } = await me();
  const r = submissionSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const ch = await db.challenge.findUnique({ where: { id: r.data.challengeId }, include: { opportunity: { include: { company: { include: { members: true } } } } } });
  const o = ch?.opportunity;
  if (!ch || !o || o.moderated !== "VERIFIED" || o.company.status !== "VERIFIED" || o.closedAt || o.deadline < new Date()) return { error: "This challenge isn't open for submissions." };
  if (!p.headline) return { error: "Complete your profile before submitting." };
  if (r.data.teamNote && !ch.allowTeams) return { error: "This challenge is individual. Remove the team note." };
  const key = { challengeId_studentId: { challengeId: ch.id, studentId: p.id } };
  const existing = await db.submission.findUnique({ where: key });
  if (existing && existing.status !== "SUBMITTED" && existing.status !== "WITHDRAWN") return { error: "This submission has already been reviewed or withdrawn." };
  const data = { title: r.data.title, summary: r.data.summary, workUrl: r.data.workUrl, teamNote: r.data.teamNote || null, status: "SUBMITTED" as const };
  if (existing) await db.submission.update({ where: key, data });
  else {
    await db.submission.create({ data: { ...data, challengeId: ch.id, studentId: p.id } });
    await Promise.all(o.company.members.map((m) => notify(m.userId, "New challenge submission", `${u.name} submitted to ${o.title}`)));
  }
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/challenges/${o.id}`);
  return { ok: true };
}

export async function withdrawSubmission(id: string) {
  const { p } = await me();
  await db.submission.updateMany({ where: { id, studentId: p.id, status: "SUBMITTED" }, data: { status: "WITHDRAWN" } });
  revalidatePath("/dashboard", "layout");
}

/** Removes every resume this student ever uploaded, including from applications that carried it. */
export async function deleteResume() {
  const { u, p } = await me();
  const ids = (await db.upload.findMany({ where: { ownerId: u.id, kind: "RESUME" }, select: { id: true } })).map((x) => x.id);
  await db.$transaction([
    db.application.updateMany({ where: { resumeId: { in: ids } }, data: { resumeId: null } }),
    db.upload.deleteMany({ where: { id: { in: ids }, ownerId: u.id } }),
    db.studentProfile.update({ where: { id: p.id }, data: { resumeId: null, resumeName: null } }),
  ]);
  revalidatePath("/dashboard", "layout");
}

/** Removes the intro video everywhere: from the profile and from every company it was shared with. */
export async function deleteIntroVideo() {
  const { u, p } = await me();
  const ids = (await db.upload.findMany({ where: { ownerId: u.id, kind: "INTRO_VIDEO" }, select: { id: true } })).map((x) => x.id);
  await db.$transaction([
    db.application.updateMany({ where: { introVideoId: { in: ids } }, data: { introVideoId: null } }),
    db.upload.deleteMany({ where: { id: { in: ids }, ownerId: u.id } }),
    db.studentProfile.update({ where: { id: p.id }, data: { introVideoId: null, introVideoAt: null } }),
  ]);
  revalidatePath("/dashboard", "layout");
}
