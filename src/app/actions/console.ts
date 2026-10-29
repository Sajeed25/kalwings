"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { audit, notify } from "@/lib/audit";
import { fail, obj, type Result } from "./_shared";
import { opportunitySchema, csv } from "@/lib/validation";
import { slugProblem } from "@/lib/distribution-utils";
import { uniqueSlug } from "@/lib/slug";
import { emailAccountReady } from "@/lib/account-email";
import { SIGNUP_ROLES } from "@/lib/settings";
import { uniqueShortCode } from "@/lib/short-code";

/**
 * Platform admin console: everything an admin can create or change directly. Each action re-checks the role, validates its input,
 * writes an audit entry and never trusts the page that called it.
 */
export type NoteResult = Result & { note?: string };
const admin = () => requireActionRole("PLATFORM_ADMIN");
const text = (max: number) => z.string().trim().max(max);
const done = (note?: string): NoteResult => { revalidatePath("/dashboard", "layout"); return { ok: true, note }; };
const STATUS = z.enum(["PENDING", "VERIFIED", "REJECTED"]);

/* ───────────────────────── Plans ───────────────────────── */

const planSchema = z.object({
  key: z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9_]{1,39}$/, "Use 2 to 40 capital letters, numbers or underscores for the plan key"),
  label: text(60).min(2, "Give the plan a name"),
  priceText: text(80).min(1, "Say what it costs, e.g. “₹2,999 / month”, “Free” or “Contact us”"),
  description: text(300).optional().default(""),
  features: text(1500).optional().default(""),
  listings: z.coerce.number().int().min(0).max(100000),
  challenges: z.coerce.number().int().min(0).max(100000),
  assessments: z.coerce.number().int().min(0).max(100000),
  team: z.coerce.number().int().min(1).max(100000),
  position: z.coerce.number().int().min(0).max(1000).default(0),
  highlight: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
});

/** Creates a plan, or edits it when `isNew` is not "1". Renaming, pricing and limits take effect at once for every company on the plan. */
export async function savePlan(_: NoteResult, fd: FormData): Promise<NoteResult> {
  const a = await admin();
  const raw = obj(fd);
  const r = planSchema.safeParse({ ...raw, highlight: raw.highlight === "on" || raw.highlight === "true", active: raw.active === "on" || raw.active === "true" });
  if (!r.success) return fail(r.error);
  const d = r.data;
  const existing = await db.planConfig.findUnique({ where: { key: d.key } });
  if (raw.isNew === "1" && existing) return { error: "A plan with that key already exists." };
  if (raw.isNew !== "1" && !existing) return { error: "Plan not found." };
  const features = d.features.split("\n").map((x) => x.trim().slice(0, 120)).filter(Boolean).slice(0, 12);
  const data = { label: d.label, priceText: d.priceText, description: d.description || null, features, listings: d.listings, challenges: d.challenges, assessments: d.assessments, team: d.team, position: d.position, highlight: d.highlight, active: d.active };
  if (existing && !d.active) {
    const others = await db.planConfig.count({ where: { active: true, NOT: { key: d.key } } });
    if (!others) return { error: "Keep at least one plan active." };
  }
  await db.planConfig.upsert({ where: { key: d.key }, create: { key: d.key, ...data }, update: data });
  await audit(a.id, existing ? "plan.updated" : "plan.created", `${d.key}: ${d.label}, ${d.priceText}`.slice(0, 190));
  return done(existing ? "Plan saved. Every company on it sees the change now." : "Plan added.");
}

export async function deletePlan(key: string) {
  const a = await admin();
  const [inUse, total] = await Promise.all([db.company.count({ where: { plan: key } }), db.planConfig.count()]);
  if (inUse) throw new Error(`${inUse} compan${inUse === 1 ? "y is" : "ies are"} on this plan. Move them first, or just switch the plan off.`);
  if (total <= 1) throw new Error("Keep at least one plan.");
  await db.planConfig.delete({ where: { key } });
  await audit(a.id, "plan.deleted", key);
  revalidatePath("/dashboard", "layout");
}

/* ───────────────────────── Site settings ───────────────────────── */

const settingsSchema = z.object({ announcement: text(300).optional().default(""), supportEmail: z.union([z.literal(""), z.string().trim().toLowerCase().email().max(254)]) });

export async function saveSettings(_: NoteResult, fd: FormData): Promise<NoteResult> {
  const a = await admin();
  const raw = obj(fd);
  const r = settingsSchema.safeParse(raw);
  if (!r.success) return fail(r.error);
  const rows: [string, string][] = [["announcement", r.data.announcement], ["supportEmail", r.data.supportEmail], ...SIGNUP_ROLES.map((role): [string, string] => [`signup.${role}`, raw[`signup_${role}`] === "on" ? "on" : "off"])];
  await db.$transaction(rows.map(([key, value]) => db.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } })));
  await audit(a.id, "settings.updated", rows.map(([k, v]) => `${k}=${v ? v.slice(0, 30) : "(empty)"}`).join("; ").slice(0, 190));
  return done("Settings saved.");
}

/* ───────────────────────── Companies and their listings ───────────────────────── */

const companySchema = z.object({
  id: z.string().optional().default(""),
  name: text(120).min(2, "Enter the company name"),
  website: text(400).optional().default(""),
  about: text(1500).optional().default(""),
  slug: text(40).optional().default(""),
  status: STATUS,
  plan: z.string().trim().min(1).max(40),
});

/** Adds or edits a company. A new company created here is the admin's own decision, so it can be verified straight away. */
export async function saveCompany(_: NoteResult, fd: FormData): Promise<NoteResult> {
  const a = await admin();
  const r = companySchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const d = r.data;
  let website: string | null = null;
  if (d.website) { try { const u = new URL(d.website); if (!/^https?:$/.test(u.protocol)) throw new Error(); website = u.toString().slice(0, 400); } catch { return { error: "The website must start with http:// or https://" }; } }
  if (d.slug) { const bad = slugProblem(d.slug.toLowerCase()); if (bad) return { error: bad }; }
  if (!(await db.planConfig.findUnique({ where: { key: d.plan } }))) return { error: "Choose one of the existing plans." };
  const slug = d.slug ? d.slug.toLowerCase() : null;
  if (slug && (await db.company.findFirst({ where: { slug, NOT: d.id ? { id: d.id } : undefined }, select: { id: true } }))) return { error: "That career-page address is taken." };
  const dup = await db.company.findFirst({ where: { name: d.name, NOT: d.id ? { id: d.id } : undefined }, select: { id: true } });
  if (dup) return { error: "A company with that name already exists. Open it from the list instead." };
  const data = { name: d.name, website, about: d.about || null, slug, status: d.status, plan: d.plan, verifiedAt: d.status === "VERIFIED" ? new Date() : null };
  if (d.id) {
    const before = await db.company.findUnique({ where: { id: d.id } });
    if (!before) return { error: "Company not found." };
    await db.company.update({ where: { id: d.id }, data: { ...data, verifiedAt: d.status === "VERIFIED" ? before.verifiedAt ?? new Date() : null } });
    await audit(a.id, "company.edited", `${d.name} (${d.id}) ${d.status}`.slice(0, 190));
    return done("Company saved.");
  }
  const c = await db.company.create({ data });
  await audit(a.id, "company.created", `${d.name} (${c.id}) ${d.status}`.slice(0, 190));
  return done(`Added ${d.name}.`);
}

const listingExtra = z.object({ companyId: z.string().min(1) });

/** Posts a listing on a company's behalf. It goes live at once (the admin is the moderator) but only for a verified company. */
export async function postListingFor(_: NoteResult, fd: FormData): Promise<NoteResult> {
  const a = await admin();
  const raw = obj(fd);
  const ex = listingExtra.safeParse(raw);
  const r = opportunitySchema.safeParse(raw);
  if (!ex.success) return { error: "Choose a company." };
  if (!r.success) return fail(r.error);
  const d = r.data;
  if (d.type === "CHALLENGE") return { error: "Challenges need a brief and a rubric. Create them from the employer's Challenges tab." };
  const company = await db.company.findUnique({ where: { id: ex.data.companyId } });
  if (!company) return { error: "Company not found." };
  if (company.status !== "VERIFIED") return { error: "Verify the company first, or the listing would not be visible." };
  const questions = String(fd.get("questions") ?? "").split("\n").map((q) => q.trim().slice(0, 300)).filter(Boolean).slice(0, 5);
  const o = await db.opportunity.create({
    data: {
      companyId: company.id, title: d.title, type: d.type, description: d.description, payText: d.unpaid ? `Unpaid — ${d.payText}` : d.payText,
      unpaid: d.unpaid, monthlyINR: d.unpaid ? 0 : d.monthlyINR, workMode: d.workMode, location: d.location, eligibility: d.eligibility,
      gradYears: csv(d.gradYears).map(Number).filter((n) => n > 2000 && n < 2100), skills: csv(d.skills), deadline: d.deadline,
      moderated: "VERIFIED", shortCode: await uniqueShortCode(), questions: { create: questions.map((text, position) => ({ text, position })) },
    },
  });
  await audit(a.id, "listing.posted_by_admin", `${d.title} at ${company.name} (${o.id})`.slice(0, 190));
  return done(`Posted “${d.title}” for ${company.name}. It is live now.`);
}

export async function adminSetListingClosed(id: string, closed: boolean) {
  const a = await admin();
  const o = await db.opportunity.update({ where: { id }, data: { closedAt: closed ? new Date() : null }, include: { company: true } });
  await audit(a.id, closed ? "listing.closed_by_admin" : "listing.reopened_by_admin", `${o.title} at ${o.company.name} (${id})`.slice(0, 190));
  revalidatePath("/dashboard", "layout");
}

/* ───────────────────────── Colleges ───────────────────────── */

const collegeSchema = z.object({ id: z.string().optional().default(""), name: text(160).min(2, "Enter the college name"), city: text(80).optional().default(""), status: STATUS });

export async function saveCollege(_: NoteResult, fd: FormData): Promise<NoteResult> {
  const a = await admin();
  const r = collegeSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const d = r.data;
  const dup = await db.college.findFirst({ where: { name: d.name, NOT: d.id ? { id: d.id } : undefined }, select: { id: true } });
  if (dup) return { error: "A college with that name already exists." };
  if (d.id) {
    if (!(await db.college.findUnique({ where: { id: d.id }, select: { id: true } }))) return { error: "College not found." };
    await db.college.update({ where: { id: d.id }, data: { name: d.name, city: d.city || null, status: d.status } });
    await audit(a.id, "college.edited", `${d.name} (${d.id}) ${d.status}`.slice(0, 190));
    return done("College saved.");
  }
  const c = await db.college.create({ data: { name: d.name, city: d.city || null, status: d.status } });
  await audit(a.id, "college.created", `${d.name} (${c.id}) ${d.status}`.slice(0, 190));
  return done(`Added ${d.name}.`);
}

/* ───────────────────────── Mentors ───────────────────────── */

const mentorSchema = z.object({
  userId: z.string().optional().default(""),
  name: text(80).min(2, "Enter the mentor's name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  roleTitle: text(120).min(2, "Enter their role"),
  company: text(120).min(1, "Enter their company"),
  country: text(60).min(2, "Enter their country"),
  domain: text(60).min(2, "Enter their domain, e.g. AI / ML"),
  tags: text(300).optional().default(""),
  bio: text(1500).optional().default(""),
  status: STATUS,
});

/**
 * Adds a mentor with every profile detail, or edits one. A new mentor gets an account (they sign in with an emailed code) and can then
 * add or change anything themselves under Dashboard > Mentor profile; their status can only be changed here.
 */
export async function saveMentor(_: NoteResult, fd: FormData): Promise<NoteResult> {
  const a = await admin();
  const r = mentorSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const d = r.data;
  const profile = { roleTitle: d.roleTitle, company: d.company, country: d.country, domain: d.domain, tags: csv(d.tags), bio: d.bio || null, status: d.status, verifiedAt: d.status === "VERIFIED" ? new Date() : null };
  if (d.userId) {
    const u = await db.user.findUnique({ where: { id: d.userId }, include: { mentor: true } });
    if (!u?.mentor) return { error: "Mentor not found." };
    await db.$transaction([
      db.user.update({ where: { id: u.id }, data: { name: d.name } }),
      db.mentorProfile.update({ where: { id: u.mentor.id }, data: { ...profile, verifiedAt: d.status === "VERIFIED" ? u.mentor.verifiedAt ?? new Date() : null } }),
    ]);
    await audit(a.id, "mentor.edited", `${d.name} (${u.id}) ${d.status}`.slice(0, 190));
    return done("Mentor saved.");
  }
  const existing = await db.user.findUnique({ where: { email: d.email }, include: { mentor: true } });
  if (existing) return { error: existing.mentor ? "That email already belongs to a mentor." : "An account with this email already exists. Use a different email." };
  await db.user.create({ data: { name: d.name, email: d.email, role: "MENTOR", mentor: { create: { ...profile, slug: uniqueSlug(d.name) } } } });
  await audit(a.id, "mentor.created", `${d.email} ${d.status}`.slice(0, 190));
  const note = `Added ${d.name} (${d.email}) as a mentor.${await emailAccountReady({ name: d.name, email: d.email, extra: "After you sign in, open Mentor profile to add or change any detail: your role, company, domains, bio, photo and office-hour slots." })}`;
  return done(note);
}

/* ───────────────────────── Roles ───────────────────────── */

const ROLES = ["STUDENT", "MENTOR", "EMPLOYER", "COLLEGE_ADMIN", "PLATFORM_ADMIN"] as const;
type RoleKey = (typeof ROLES)[number];
const ROLE_LABEL: Record<RoleKey, string> = { STUDENT: "Student", MENTOR: "Mentor", EMPLOYER: "Employer", COLLEGE_ADMIN: "College admin", PLATFORM_ADMIN: "Platform admin" };

/** Moves an account to another role. The account and everything on it is kept; only what the person can open changes. */
async function applyRole(actorId: string, userId: string, role: RoleKey, via: string): Promise<string | null> {
  const t = await db.user.findUnique({ where: { id: userId } });
  if (!t) return "User not found.";
  if (t.role === role) return `They are already a ${ROLE_LABEL[role].toLowerCase()}.`;
  if (t.id === actorId) return "You can't change your own role. Ask another platform admin.";
  if (t.role === "PLATFORM_ADMIN" && (await db.user.count({ where: { role: "PLATFORM_ADMIN", suspendedAt: null } })) <= 1) return "That is the last platform admin.";
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { role } });
    // Student pages expect a profile row; create an empty one if this person never had one. Nothing existing is touched or removed.
    if (role === "STUDENT" && !(await tx.studentProfile.findUnique({ where: { userId } }))) await tx.studentProfile.create({ data: { userId, slug: uniqueSlug(t.name) } });
  });
  await audit(actorId, "user.role_changed", `${t.name} (${userId}): ${t.role} → ${role} ${via}`.slice(0, 190));
  await notify(userId, `Your role is now ${ROLE_LABEL[role]}`, "An admin changed your role. Your account and data are unchanged; the menu shows what you can open now.");
  return null;
}

export async function changeUserRole(_: NoteResult, fd: FormData): Promise<NoteResult> {
  const a = await admin();
  const r = z.object({ userId: z.string().min(1), role: z.enum(ROLES) }).safeParse(obj(fd));
  if (!r.success) return { error: "Choose a role." };
  const err = await applyRole(a.id, r.data.userId, r.data.role, "(admin)");
  if (err) return { error: err };
  return done(`Role changed to ${ROLE_LABEL[r.data.role]}.`);
}

/** Any signed-in user can ask; only an admin can grant. */
export async function requestRoleChange(_: NoteResult, fd: FormData): Promise<NoteResult> {
  const u = await requireActionRole();
  const r = z.object({ role: z.enum(ROLES), reason: text(500).min(10, "Tell the admin why, in a sentence or two") }).safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  if (r.data.role === u.role) return { error: "That is already your role." };
  if (await db.roleChangeRequest.findFirst({ where: { userId: u.id, status: "PENDING" }, select: { id: true } })) return { error: "You already have a request waiting for an admin." };
  await db.roleChangeRequest.create({ data: { userId: u.id, fromRole: u.role, requestedRole: r.data.role, reason: r.data.reason } });
  await audit(u.id, "role.requested", `${u.role} → ${r.data.role}`);
  const admins = await db.user.findMany({ where: { role: "PLATFORM_ADMIN", suspendedAt: null }, select: { id: true }, take: 20 });
  await Promise.all(admins.map((x) => notify(x.id, "Role change request", `${u.name} asked to become ${ROLE_LABEL[r.data.role]}. Open Users to decide.`)));
  return done("Request sent. An admin will review it and you will get a notification.");
}

export async function cancelRoleRequest(id: string) {
  const u = await requireActionRole();
  await db.roleChangeRequest.updateMany({ where: { id, userId: u.id, status: "PENDING" }, data: { status: "DECLINED", decisionNote: "Withdrawn by the user", decidedAt: new Date() } });
  revalidatePath("/dashboard", "layout");
}

export async function decideRoleRequest(id: string, approve: boolean) {
  const a = await admin();
  const req = await db.roleChangeRequest.findUnique({ where: { id } });
  if (!req || req.status !== "PENDING") throw new Error("This request was already decided.");
  if (approve) {
    const err = await applyRole(a.id, req.userId, req.requestedRole, "(approved request)");
    if (err) throw new Error(err);
  } else {
    await notify(req.userId, "Role change request declined", `An admin declined your request to become ${ROLE_LABEL[req.requestedRole]}.`);
    await audit(a.id, "role.request_declined", `${req.userId}: ${req.requestedRole}`.slice(0, 190));
  }
  await db.roleChangeRequest.update({ where: { id }, data: { status: approve ? "APPROVED" : "DECLINED", decidedById: a.id, decidedAt: new Date() } });
  revalidatePath("/dashboard", "layout");
}
