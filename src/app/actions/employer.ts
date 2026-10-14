"use server";
import { revalidatePath } from "next/cache";
import type { ApplicationStage } from "@prisma/client";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { companySchema, opportunitySchema, noteSchema, challengeSchema, parseRubric, reviewSchema, interviewSchema, offerSchema, inviteSchema, stageLabelsSchema, feedbackSchema, templateSchema, csv } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { completeness } from "@/lib/completeness";
import { DEFAULT_LABEL } from "@/lib/stages";
import { limitError } from "@/lib/plans";
import { notify } from "@/lib/audit";
import { slugProblem } from "@/lib/distribution";
import { stageEvent } from "@/lib/stage-history";
import { fail, obj, type Result } from "./_shared";

async function myCompany() {
  const u = await requireActionRole("EMPLOYER");
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
  return { u, company: mem?.company ?? null };
}
async function verifiedCompany() {
  const { u, company } = await myCompany();
  if (!company) throw new Error("Create a company first.");
  if (company.status !== "VERIFIED") throw new Error("Your company must be verified before you can do this.");
  return { u, company };
}

export async function createCompany(_: Result, fd: FormData): Promise<Result> {
  const { u, company } = await myCompany();
  if (company) return { error: "You already have a company." };
  const r = companySchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  await db.company.create({ data: { name: r.data.name, website: r.data.website, about: r.data.about || null, members: { create: { userId: u.id } } } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function postOpportunity(_: Result, fd: FormData): Promise<Result> {
  const { company } = await verifiedCompany();
  const r = opportunitySchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const d = r.data;
  if (d.type === "CHALLENGE") return { error: "Create challenges under Challenges: they need a brief and a scoring rubric." };
  const cap = await limitError(company.id, company.plan, "listings");
  if (cap) return { error: cap };
  const questions = String(fd.get("questions") ?? "").split("\n").map((q) => q.trim().slice(0, 300)).filter(Boolean).slice(0, 5);
  await db.opportunity.create({
    data: {
      companyId: company.id, title: d.title, type: d.type, description: d.description, payText: d.unpaid ? `Unpaid — ${d.payText}` : d.payText,
      unpaid: d.unpaid, monthlyINR: d.unpaid ? 0 : d.monthlyINR, workMode: d.workMode, location: d.location, eligibility: d.eligibility,
      gradYears: csv(d.gradYears).map(Number).filter((n) => n > 2000 && n < 2100), skills: csv(d.skills), deadline: d.deadline,
      moderated: "PENDING", // listed only after admin moderation
      questions: { create: questions.map((text, position) => ({ text, position })) },
    },
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Closing stops new applications and hides the listing from search; existing applicants stay in the pipeline. */
export async function closeOpportunity(id: string) {
  const { company } = await verifiedCompany();
  await db.opportunity.updateMany({ where: { id, companyId: company.id, closedAt: null }, data: { closedAt: new Date() } });
  revalidatePath("/dashboard", "layout");
  revalidatePath("/opportunities");
}

export async function reopenOpportunity(id: string) {
  const { company } = await verifiedCompany();
  await db.opportunity.updateMany({ where: { id, companyId: company.id, closedAt: { not: null } }, data: { closedAt: null } });
  revalidatePath("/dashboard", "layout");
  revalidatePath("/opportunities");
}

// Offer and Hired have their own actions: an offer needs details, and "Hired" needs an accepted offer.
const MOVABLE: ApplicationStage[] = ["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "REJECTED"];

async function ownedApp(applicationId: string, companyId: string) {
  return db.application.findFirst({ where: { id: applicationId, opportunity: { companyId } }, include: { student: true, opportunity: true, offer: true } });
}

export async function setStage(applicationId: string, stage: ApplicationStage) {
  const { u, company } = await verifiedCompany();
  if (!MOVABLE.includes(stage)) throw new Error("Invalid stage");
  const app = await ownedApp(applicationId, company.id);
  if (!app || app.stage === "WITHDRAWN" || app.stage === "HIRED") throw new Error("Not found");
  if (app.stage === "OFFER" && app.offer?.status === "ACCEPTED") throw new Error("This candidate accepted your offer. Mark them as hired instead.");
  if (app.stage !== stage) await db.$transaction([db.application.update({ where: { id: app.id }, data: { stage } }), stageEvent(app.id, app.stage, stage, u.id)]);
  if (app.stage === "OFFER" && app.offer?.status === "EXTENDED") await db.offer.update({ where: { id: app.offer.id }, data: { status: "WITHDRAWN" } });
  await notify(app.student.userId, "Application update", `${app.opportunity.title} is now: ${DEFAULT_LABEL[stage].toLowerCase()}`);
  revalidatePath("/dashboard", "layout");
}

export async function scheduleInterview(_: Result, fd: FormData): Promise<Result> {
  const { u, company } = await verifiedCompany();
  const r = interviewSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const app = await ownedApp(r.data.applicationId, company.id);
  if (!app || ["WITHDRAWN", "REJECTED", "HIRED"].includes(app.stage)) return { error: "This application can't be scheduled." };
  const d = r.data;
  const clash = await db.interview.findFirst({ where: { applicationId: app.id, status: "SCHEDULED", scheduledAt: d.scheduledAt } });
  if (clash) return { error: "An interview is already scheduled at that time." };
  await db.$transaction([
    db.interview.create({ data: { applicationId: app.id, scheduledAt: d.scheduledAt, minutes: d.minutes, mode: d.mode, detail: d.detail, notes: d.notes || null, createdById: u.id } }),
    ...(app.stage === "APPLIED" || app.stage === "UNDER_REVIEW" || app.stage === "SHORTLISTED" ? [db.application.update({ where: { id: app.id }, data: { stage: "INTERVIEW" } }), stageEvent(app.id, app.stage, "INTERVIEW", u.id)] : []),
  ]);
  const when = d.scheduledAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  await notify(app.student.userId, "Interview scheduled", `${app.opportunity.title} · ${when} IST · ${d.mode.toLowerCase()}. Details and calendar file are in your Interviews page.`);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function setInterviewStatus(interviewId: string, status: "COMPLETED" | "CANCELLED") {
  const { company } = await verifiedCompany();
  if (status !== "COMPLETED" && status !== "CANCELLED") throw new Error("Invalid");
  const iv = await db.interview.findFirst({ where: { id: interviewId, status: "SCHEDULED", application: { opportunity: { companyId: company.id } } }, include: { application: { include: { student: true, opportunity: true } } } });
  if (!iv) return;
  await db.interview.update({ where: { id: iv.id }, data: { status } });
  if (status === "CANCELLED") await notify(iv.application.student.userId, "Interview cancelled", `${iv.application.opportunity.title}. The recruiter may reschedule.`);
  revalidatePath("/dashboard", "layout");
}

export async function extendOffer(_: Result, fd: FormData): Promise<Result> {
  const { u, company } = await verifiedCompany();
  const r = offerSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const app = await ownedApp(r.data.applicationId, company.id);
  if (!app || ["WITHDRAWN", "REJECTED", "HIRED"].includes(app.stage)) return { error: "This application can't receive an offer." };
  if (app.offer?.status === "ACCEPTED") return { error: "The candidate already accepted. Mark them as hired." };
  await db.$transaction([
    db.offer.upsert({ where: { applicationId: app.id }, create: { applicationId: app.id, summary: r.data.summary, joiningDate: r.data.joiningDate ?? null }, update: { summary: r.data.summary, joiningDate: r.data.joiningDate ?? null, status: "EXTENDED", respondedAt: null } }),
    db.application.update({ where: { id: app.id }, data: { stage: "OFFER" } }),
    ...(app.stage !== "OFFER" ? [stageEvent(app.id, app.stage, "OFFER", u.id)] : []),
  ]);
  await audit(u.id, "offer.extended", `${app.opportunity.title} (${app.id})`);
  await notify(app.student.userId, "You have an offer", `${app.opportunity.title}. Review and respond in your Applications page.`);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function markHired(applicationId: string) {
  const { u, company } = await verifiedCompany();
  const app = await ownedApp(applicationId, company.id);
  if (!app || app.stage !== "OFFER" || app.offer?.status !== "ACCEPTED") throw new Error("Only candidates who accepted an offer can be marked as hired.");
  await db.$transaction([db.application.update({ where: { id: app.id }, data: { stage: "HIRED" } }), stageEvent(app.id, "OFFER", "HIRED", u.id)]);
  await audit(u.id, "application.hired", `${app.opportunity.title} (${app.id})`);
  await notify(app.student.userId, "Congratulations", `${company.name} marked you as hired for ${app.opportunity.title}.`);
  revalidatePath("/dashboard", "layout");
}

export async function inviteMember(_: Result, fd: FormData): Promise<Result> {
  const { u, company } = await verifiedCompany();
  const r = inviteSchema.safeParse(obj(fd));
  if (!r.success) return { error: "Enter a valid email address." };
  const cap = await limitError(company.id, company.plan, "team");
  if (cap) return { error: cap };
  const existing = await db.user.findUnique({ where: { email: r.data.email }, include: { employer: true } });
  if (existing?.employer?.companyId === company.id) return { error: "They are already on your team." };
  if (existing && existing.role !== "EMPLOYER") return { error: "That email belongs to an account that isn't a recruiter account." };
  if (existing?.employer) return { error: "That recruiter already belongs to another company." };
  await db.companyInvite.upsert({ where: { companyId_email: { companyId: company.id, email: r.data.email } }, create: { companyId: company.id, email: r.data.email, invitedById: u.id }, update: { acceptedAt: null } });
  if (existing) await notify(existing.id, "Team invitation", `${company.name} invited you to join their recruiting team. Open Company to accept.`);
  await audit(u.id, "company.invite", `${r.data.email} → ${company.name}`);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** The invited person must be signed in (OTP-verified) with the invited email address. */
export async function acceptInvite(inviteId: string) {
  const u = await requireActionRole("EMPLOYER");
  if (!u.email) throw new Error("Not found");
  const inv = await db.companyInvite.findFirst({ where: { id: inviteId, email: u.email.toLowerCase(), acceptedAt: null }, include: { company: true } });
  if (!inv) throw new Error("Invitation not found");
  if (await db.employerMember.findUnique({ where: { userId: u.id } })) throw new Error("You already belong to a company.");
  await db.$transaction([
    db.employerMember.create({ data: { userId: u.id, companyId: inv.companyId } }),
    db.companyInvite.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } }),
  ]);
  await audit(u.id, "company.join", inv.company.name);
  revalidatePath("/dashboard", "layout");
}

export async function removeMember(memberId: string) {
  const { u, company } = await verifiedCompany();
  const m = await db.employerMember.findFirst({ where: { id: memberId, companyId: company.id } });
  if (!m || m.userId === u.id) return; // can't remove yourself or members of other companies
  await db.employerMember.delete({ where: { id: m.id } });
  await audit(u.id, "company.remove_member", `${m.userId} from ${company.name}`);
  revalidatePath("/dashboard", "layout");
}

export async function cancelInvite(inviteId: string) {
  const { company } = await verifiedCompany();
  await db.companyInvite.deleteMany({ where: { id: inviteId, companyId: company.id, acceptedAt: null } });
  revalidatePath("/dashboard", "layout");
}

export async function saveStageLabels(_: Result, fd: FormData): Promise<Result> {
  const { company } = await verifiedCompany();
  const r = stageLabelsSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const labels = Object.fromEntries(Object.entries(r.data).filter(([, v]) => v));
  await db.company.update({ where: { id: company.id }, data: { stageLabels: labels } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function saveNotes(_: Result, fd: FormData): Promise<Result> {
  const { company } = await verifiedCompany();
  const r = noteSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const n = await db.application.updateMany({ where: { id: r.data.applicationId, opportunity: { companyId: company.id } }, data: { employerNotes: r.data.notes } });
  if (!n.count) return { error: "Not found" };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function toggleShortlist(studentId: string) {
  const { company } = await verifiedCompany();
  const key = { companyId_studentId: { companyId: company.id, studentId } };
  if (await db.shortlist.findUnique({ where: key })) await db.shortlist.delete({ where: key });
  else await db.shortlist.create({ data: { companyId: company.id, studentId } });
  revalidatePath("/dashboard", "layout");
}

export async function createChallenge(_: Result, fd: FormData): Promise<Result> {
  const { company } = await verifiedCompany();
  const r = challengeSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const d = r.data;
  if (d.unpaid && !/unpaid|certificate|no stipend|none/i.test(d.payText)) return { error: "For unpaid challenges say so plainly, e.g. 'Unpaid, certificate only'.", fieldErrors: { payText: "State that it is unpaid" } };
  if (!d.unpaid && !/\d/.test(d.payText)) return { error: "Paid challenges must state the amount.", fieldErrors: { payText: "State the amount" } };
  const rubric = parseRubric(d.rubric);
  if (typeof rubric === "string") return { error: rubric, fieldErrors: { rubric } };
  const cap = await limitError(company.id, company.plan, "challenges");
  if (cap) return { error: cap };
  await db.opportunity.create({
    data: {
      companyId: company.id, title: d.title, type: "CHALLENGE", description: d.description, payText: d.unpaid ? `Unpaid: ${d.payText}` : d.payText,
      unpaid: d.unpaid, monthlyINR: 0, workMode: d.workMode, location: d.location, eligibility: d.eligibility, gradYears: [], skills: d.skillTag ? [d.skillTag] : [],
      deadline: d.deadline, moderated: "PENDING",
      challenge: { create: { kind: d.kind, style: d.style, allowTeams: d.allowTeams, brief: d.brief, rubric, skillTag: d.skillTag || null } },
    },
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Human review against the published rubric. Shortlisting feeds the hiring pipeline; a skill is awarded only if the reviewer ticks it. */
export async function reviewSubmission(_: Result, fd: FormData): Promise<Result> {
  const { u, company } = await verifiedCompany();
  const r = reviewSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const sub = await db.submission.findFirst({
    where: { id: r.data.submissionId, status: { not: "WITHDRAWN" }, challenge: { opportunity: { companyId: company.id } } },
    include: { challenge: { include: { opportunity: true } }, student: true },
  });
  if (!sub) return { error: "Submission not found." };
  const rubric = sub.challenge.rubric as { criterion: string; max: number }[];
  const raw = obj(fd);
  const scores: { criterion: string; points: number; comment: string }[] = [];
  for (let i = 0; i < rubric.length; i++) {
    const pts = Number(raw[`p${i}`]);
    if (!Number.isInteger(pts) || pts < 0 || pts > rubric[i].max) return { error: `"${rubric[i].criterion}": enter whole points from 0 to ${rubric[i].max}.` };
    scores.push({ criterion: rubric[i].criterion, points: pts, comment: String(raw[`c${i}`] ?? "").slice(0, 300) });
  }
  const total = scores.reduce((n, x) => n + x.points, 0);
  const max = rubric.reduce((n, x) => n + x.max, 0);
  await db.submission.update({ where: { id: sub.id }, data: { scores, totalScore: total, maxScore: max, feedback: r.data.feedback, status: r.data.outcome, reviewedAt: new Date() } });
  if (r.data.outcome === "SHORTLISTED") {
    const key = { opportunityId_studentId: { opportunityId: sub.challenge.opportunityId, studentId: sub.studentId } };
    const app = await db.application.findUnique({ where: key });
    if (!app) await db.application.create({ data: { opportunityId: sub.challenge.opportunityId, studentId: sub.studentId, stage: "SHORTLISTED", events: { create: { toStage: "SHORTLISTED", actorId: u.id } } } });
    else if (app.stage === "APPLIED" || app.stage === "UNDER_REVIEW") await db.$transaction([db.application.update({ where: { id: app.id }, data: { stage: "SHORTLISTED" } }), stageEvent(app.id, app.stage, "SHORTLISTED", u.id)]);
  }
  if (r.data.awardSkill && sub.challenge.skillTag) {
    const basis = `challenge:${sub.id}`;
    if (!(await db.skillEvidence.findFirst({ where: { studentId: sub.studentId, basis } }))) {
      await db.skillEvidence.create({ data: { studentId: sub.studentId, skill: sub.challenge.skillTag, basis, explanation: `Challenge "${sub.challenge.opportunity.title}" by ${company.name}: reviewer scored ${total}/${max} against a published rubric and awarded this skill.` } });
      const p = await db.studentProfile.findUniqueOrThrow({ where: { id: sub.studentId }, include: { projects: true } });
      await db.studentProfile.update({ where: { id: p.id }, data: { completeness: completeness(p, await db.skillEvidence.count({ where: { studentId: p.id } })).score } });
    }
    await audit(u.id, "skill.awarded", `${sub.challenge.skillTag} → ${sub.studentId} (${sub.id})`);
  }
  await notify(sub.student.userId, "Your challenge submission was reviewed", `${sub.challenge.opportunity.title}: ${total}/${max}. Open Submissions to read the feedback.`);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function saveCareerSlug(_: Result, fd: FormData): Promise<Result> {
  const { u, company } = await verifiedCompany();
  const slug = String(fd.get("slug") ?? "").trim().toLowerCase();
  if (!slug) {
    await db.company.update({ where: { id: company.id }, data: { slug: null } });
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  }
  const bad = slugProblem(slug);
  if (bad) return { error: bad };
  const taken = await db.company.findFirst({ where: { slug, NOT: { id: company.id } }, select: { id: true } });
  if (taken) return { error: "That address is already taken." };
  await db.company.update({ where: { id: company.id }, data: { slug } });
  await audit(u.id, "company.career_slug", `${slug} → ${company.name}`);
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/careers/${slug}`);
  return { ok: true };
}

/** Interviewer scorecard. Private to the hiring team; it never moves a candidate between stages. */
export async function saveInterviewFeedback(_: Result, fd: FormData): Promise<Result> {
  const { u, company } = await verifiedCompany();
  const r = feedbackSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const iv = await db.interview.findFirst({ where: { id: r.data.interviewId, application: { opportunity: { companyId: company.id } } }, select: { id: true, status: true } });
  if (!iv) return { error: "Interview not found." };
  if (iv.status !== "COMPLETED") return { error: "Mark the interview as completed before adding feedback." };
  const data = { rating: r.data.rating, recommendation: r.data.recommendation, strengths: r.data.strengths || null, concerns: r.data.concerns || null };
  await db.interviewFeedback.upsert({ where: { interviewId_authorId: { interviewId: iv.id, authorId: u.id } }, create: { interviewId: iv.id, authorId: u.id, ...data }, update: data });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function saveTemplate(_: Result, fd: FormData): Promise<Result> {
  const { company } = await verifiedCompany();
  const r = templateSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  if ((await db.messageTemplate.count({ where: { companyId: company.id } })) >= 20) return { error: "You can keep up to 20 templates. Delete one first." };
  await db.messageTemplate.create({ data: { companyId: company.id, name: r.data.name, body: r.data.body } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deleteTemplate(id: string) {
  const { company } = await verifiedCompany();
  await db.messageTemplate.deleteMany({ where: { id, companyId: company.id } });
  revalidatePath("/dashboard", "layout");
}
