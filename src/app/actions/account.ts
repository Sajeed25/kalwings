"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActionRole, destroySession, sessionAgeSeconds } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { emailConfigured, sendEmail } from "@/lib/email";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/password";
import { audit, notify } from "@/lib/audit";
import type { Result } from "./_shared";

/**
 * Permanently deletes the signed-in user's account and personal data.
 * - Students: profile, projects, evidence, applications, session requests, endorsements received.
 * - Mentors: profile, slots, sessions, endorsements given (and the verified-skill evidence those created).
 * - Employers: their membership; if they were the company's only member its open listings are closed
 *   (the company record and other people's applications stay: they aren't this user's personal data).
 * - Everyone: messages sent, notifications, uploaded images, pending sign-in codes.
 * Platform admins can't self-delete (avoids locking the site out); do that in the database.
 */
export async function deleteMyAccount(_: Result, fd: FormData): Promise<Result> {
  const u = await requireActionRole();
  if (u.role === "PLATFORM_ADMIN") return { error: "Platform admin accounts can't be deleted here. Ask another admin or use the database." };
  if (String(fd.get("confirm") ?? "").trim() !== "DELETE") return { error: 'Type DELETE (in capitals) to confirm.' };
  if (!(await rateLimit(`delete-account:${u.id}`, 3, 60 * 60 * 1000))) return { error: "Too many attempts. Try again later." };

  const email = u.email;
  await db.$transaction(async (tx) => {
    const sp = await tx.studentProfile.findUnique({ where: { userId: u.id } });
    const mp = await tx.mentorProfile.findUnique({ where: { userId: u.id } });
    const em = await tx.employerMember.findUnique({ where: { userId: u.id }, include: { company: { include: { members: true } } } });
    if (sp) {
      await tx.application.deleteMany({ where: { studentId: sp.id } }); // their messages cascade
      await tx.mentorSession.deleteMany({ where: { studentId: sp.id } }); // frees any booked slot
      await tx.endorsement.deleteMany({ where: { studentId: sp.id } });
    }
    if (mp) {
      const ends = await tx.endorsement.findMany({ where: { mentorId: mp.id }, select: { id: true } });
      if (ends.length) await tx.skillEvidence.deleteMany({ where: { basis: { in: ends.map((e) => `endorsement:${e.id}`) } } });
      await tx.endorsement.deleteMany({ where: { mentorId: mp.id } });
      await tx.mentorSession.deleteMany({ where: { mentorId: mp.id } });
    }
    if (em && em.company.members.length === 1) await tx.opportunity.updateMany({ where: { companyId: em.companyId, closedAt: null }, data: { closedAt: new Date() } });
    await tx.message.deleteMany({ where: { senderId: u.id } });
    await tx.report.updateMany({ where: { reporterId: u.id }, data: { reporterId: null } });
    await tx.upload.deleteMany({ where: { ownerId: u.id } });
    const ids = [u.email, u.phone].filter((x): x is string => !!x);
    if (ids.length) await tx.otpCode.deleteMany({ where: { identifier: { in: ids } } });
    await tx.user.delete({ where: { id: u.id } }); // cascades profiles, memberships, notifications
  });

  if (email && emailConfigured()) {
    await sendEmail({ to: email, subject: "Your Kalwings account was deleted", text: "Your Kalwings account and personal data have been deleted as you requested. If this wasn't you, contact support immediately." }).catch(() => {});
  }
  await destroySession();
  redirect("/");
}

const WRONG = "Your current password is incorrect.";

/**
 * Set or change the optional password. Changing needs the current password. If you forgot it, log out and log in with an
 * email code: a session younger than 10 minutes may set a new password without the old one (you just proved you control the email).
 */
export async function setPassword(_: Result, fd: FormData): Promise<Result> {
  const u = await requireActionRole();
  const next = String(fd.get("password") ?? ""), confirm = String(fd.get("confirmPassword") ?? ""), current = String(fd.get("current") ?? "");
  if (!(await rateLimit(`pwset:${u.id}`, 12, 15 * 60 * 1000))) return { error: "Too many attempts. Try again in a few minutes." };
  if (u.passwordHash) {
    if (current) { if (!(await verifyPassword(current, u.passwordHash))) return { error: WRONG, fieldErrors: { current: WRONG } }; }
    else if ((await sessionAgeSeconds()) > 600) return { error: "Enter your current password. Forgot it? Log out, log in with an email code, then set a new one straight away.", fieldErrors: { current: "Required" } };
  }
  if (next !== confirm) return { error: "The two passwords don't match.", fieldErrors: { confirmPassword: "Doesn't match" } };
  const problem = passwordProblem(next, { email: u.email, name: u.name });
  if (problem) return { error: problem, fieldErrors: { password: problem } };
  await db.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(next), passwordSetAt: new Date() } });
  await audit(u.id, u.passwordHash ? "account.password_changed" : "account.password_set", "self");
  await notify(u.id, u.passwordHash ? "Your password was changed" : "Password login turned on", "If this wasn't you, log in with an email code and change it, then contact support.");
  return { ok: true };
}

export async function removePassword(_: Result, fd: FormData): Promise<Result> {
  const u = await requireActionRole();
  if (!u.passwordHash) return { error: "No password is set." };
  if (!(await rateLimit(`pwset:${u.id}`, 12, 15 * 60 * 1000))) return { error: "Too many attempts. Try again in a few minutes." };
  const current = String(fd.get("current") ?? "");
  if (!(current && (await verifyPassword(current, u.passwordHash)))) return { error: WRONG, fieldErrors: { current: WRONG } };
  await db.user.update({ where: { id: u.id }, data: { passwordHash: null, passwordSetAt: null } });
  await audit(u.id, "account.password_removed", "self");
  return { ok: true };
}
