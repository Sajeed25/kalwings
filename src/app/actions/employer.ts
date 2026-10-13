"use server";
import { revalidatePath } from "next/cache";
import type { ApplicationStage } from "@prisma/client";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { companySchema, opportunitySchema, noteSchema, csv } from "@/lib/validation";
import { notify } from "@/lib/audit";
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
  await db.opportunity.create({
    data: {
      companyId: company.id, title: d.title, type: d.type, description: d.description, payText: d.unpaid ? `Unpaid — ${d.payText}` : d.payText,
      unpaid: d.unpaid, monthlyINR: d.unpaid ? 0 : d.monthlyINR, workMode: d.workMode, location: d.location, eligibility: d.eligibility,
      gradYears: csv(d.gradYears).map(Number).filter((n) => n > 2000 && n < 2100), skills: csv(d.skills), deadline: d.deadline,
      moderated: "PENDING", // listed only after admin moderation
    },
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

const STAGES: ApplicationStage[] = ["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFER", "REJECTED"];

export async function setStage(applicationId: string, stage: ApplicationStage) {
  const { company } = await verifiedCompany();
  if (!STAGES.includes(stage)) throw new Error("Invalid stage");
  const app = await db.application.findFirst({ where: { id: applicationId, opportunity: { companyId: company.id } }, include: { student: true, opportunity: true } });
  if (!app || app.stage === "WITHDRAWN") throw new Error("Not found");
  await db.application.update({ where: { id: app.id }, data: { stage } });
  await notify(app.student.userId, "Application update", `${app.opportunity.title} is now: ${stage.toLowerCase()}`);
  revalidatePath("/dashboard", "layout");
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
