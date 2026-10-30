"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { audit, notify } from "@/lib/audit";
import { fail, obj, type Result } from "./_shared";
import { adminUserSchema } from "@/lib/validation";
import { emailAccountReady } from "@/lib/account-email";
import { fireAlerts } from "@/lib/alerts";
import { uniqueSlug } from "@/lib/slug";

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
  if (d === "VERIFIED") await fireAlerts(id);
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

/** Suspension signs the user out everywhere immediately, blocks login, and hides their public profile/listings. Reversible. */
export async function suspendUser(_: Result, fd: FormData): Promise<Result> {
  const a = await requireActionRole("PLATFORM_ADMIN");
  const id = String(fd.get("userId") ?? "");
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 300);
  if (reason.length < 5) return { error: "Give a reason (at least 5 characters)." };
  const t = await db.user.findUnique({ where: { id } });
  if (!t) return { error: "User not found." };
  if (t.id === a.id || t.role === "PLATFORM_ADMIN") return { error: "Platform admins can't be suspended here." };
  await db.user.update({ where: { id }, data: { suspendedAt: new Date(), suspendedReason: reason } });
  await audit(a.id, "user.suspended", `${t.name} (${id}): ${reason}`.slice(0, 190));
  await notify(id, "Your Kalwings account was suspended", reason);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function unsuspendUser(id: string) {
  const a = await requireActionRole("PLATFORM_ADMIN");
  const t = await db.user.update({ where: { id }, data: { suspendedAt: null, suspendedReason: null } });
  await audit(a.id, "user.unsuspended", `${t.name} (${id})`.slice(0, 190));
  await notify(id, "Your Kalwings account was restored");
  revalidatePath("/dashboard", "layout");
}

/** Admin checks the evidence URL on a Passport entry. Only this action can mark an entry VERIFIED. */
export async function reviewEntry(id: string, d: Decision) {
  const a = await requireActionRole("PLATFORM_ADMIN");
  if (!ok(d)) throw new Error("Invalid");
  const e = await db.passportEntry.update({ where: { id }, data: { status: d, verifiedAt: d === "VERIFIED" ? new Date() : null, verifyRequested: false }, include: { student: true } });
  await audit(a.id, `entry.${d.toLowerCase()}`, `${e.title} (${id})`);
  await notify(e.student.userId, `Passport entry ${d.toLowerCase()}`, e.title);
  revalidatePath("/dashboard", "layout");
}

/** Plans are assigned by a platform admin until an online payment provider is chosen. */
export async function setPlan(companyId: string, plan: string) {
  const a = await requireActionRole("PLATFORM_ADMIN");
  const row = await db.planConfig.findUnique({ where: { key: plan } });
  if (!row) throw new Error("Unknown plan");
  const c = await db.company.update({ where: { id: companyId }, data: { plan: row.key }, include: { members: true } });
  await audit(a.id, `company.plan_${plan.toLowerCase()}`, `${c.name} (${companyId})`);
  await Promise.all(c.members.map((m) => notify(m.userId, "Your plan changed", `${c.name} is now on the ${row.label} plan.`)));
  revalidatePath("/dashboard", "layout");
}

export type CreateUserResult = Result & { note?: string };

/**
 * Platform admin adds an account directly: students, mentors, college admins, platform admins, and HR / recruiters who work at other companies.
 * The admin is vouching for the person, so an employer's company is created (or confirmed) as VERIFIED at once. The person then signs in with
 * a one-time code sent to the email address; no password is set. Everything is audit-logged.
 */
export async function createUser(_: CreateUserResult, fd: FormData): Promise<CreateUserResult> {
  const a = await requireActionRole("PLATFORM_ADMIN");
  const r = adminUserSchema.safeParse(obj(fd));
  if (!r.success) return fail(r.error);
  const d = r.data;
  if (await db.user.findUnique({ where: { email: d.email }, select: { id: true } })) return { error: "An account with this email already exists." };

  let website: string | null = null;
  if (d.companyWebsite) {
    try { const u = new URL(d.companyWebsite); if (!/^https?:$/.test(u.protocol)) throw new Error(); website = u.toString().slice(0, 400); } catch { return { error: "The company website must start with http:// or https://" }; }
  }
  if (d.role === "EMPLOYER" && d.companyName.length < 2) return { error: "Enter the company this person works for." };
  if (d.role === "COLLEGE_ADMIN" && d.collegeName.length < 2) return { error: "Enter the college this person administers." };

  let detail = "";
  try {
    await db.$transaction(async (tx) => {
      let companyId: string | undefined, collegeId: string | undefined;
      if (d.role === "EMPLOYER") {
        const existing = await tx.company.findFirst({ where: { name: d.companyName } }); // case-insensitive collation
        if (existing?.status === "REJECTED") throw new Error("That company was rejected earlier. Change its status before adding people to it.");
        const company = existing
          ? (existing.status === "VERIFIED" ? existing : await tx.company.update({ where: { id: existing.id }, data: { status: "VERIFIED", verifiedAt: new Date() } }))
          : await tx.company.create({ data: { name: d.companyName, website, status: "VERIFIED", verifiedAt: new Date() } });
        companyId = company.id; detail = ` at ${company.name}${existing ? "" : " (new, verified)"}`;
      }
      if (d.role === "COLLEGE_ADMIN") {
        const existing = await tx.college.findFirst({ where: { name: d.collegeName } });
        if (existing?.status === "REJECTED") throw new Error("That college was rejected earlier. Change its status before adding people to it.");
        const college = existing
          ? (existing.status === "VERIFIED" ? existing : await tx.college.update({ where: { id: existing.id }, data: { status: "VERIFIED" } }))
          : await tx.college.create({ data: { name: d.collegeName, city: d.city || null, status: "VERIFIED" } });
        collegeId = college.id; detail = ` at ${college.name}${existing ? "" : " (new, verified)"}`;
      }
      await tx.user.create({
        data: {
          name: d.name, email: d.email, role: d.role,
          ...(d.role === "STUDENT" ? { student: { create: { slug: uniqueSlug(d.name) } } } : {}),
          ...(companyId ? { employer: { create: { companyId } } } : {}),
          ...(collegeId ? { college: { create: { collegeId } } } : {}),
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && /rejected earlier/.test(e.message)) return { error: e.message };
    console.error("[admin] createUser failed:", e instanceof Error ? e.message : e);
    return { error: "Could not create the account. Check the details and try again." };
  }
  await audit(a.id, "user.created", `${d.email} as ${d.role.toLowerCase().replace("_", " ")}${detail}`.slice(0, 190));

  const note = `Added ${d.name} (${d.email}) as ${d.role.toLowerCase().replace("_", " ")}${detail}.${await emailAccountReady({ name: d.name, email: d.email })}`;
  revalidatePath("/dashboard", "layout");
  return { ok: true, note };
}
