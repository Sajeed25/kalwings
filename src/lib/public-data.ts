import { asList } from "@/lib/lists";
import "server-only";
import type { Company, MentorProfile, Opportunity as DbOpp, User } from "@prisma/client";
import { db } from "@/lib/db";
import type { Mentor, Opportunity } from "@/data/sample";

const FLAGS: Record<string, string> = { India: "🇮🇳", Germany: "🇩🇪", "Saudi Arabia": "🇸🇦", UAE: "🇦🇪", "United States": "🇺🇸", "United Kingdom": "🇬🇧", Singapore: "🇸🇬", Canada: "🇨🇦", Australia: "🇦🇺" };
const MODE = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" } as const;
const TYPE = { INTERNSHIP: "Internship", JOB: "Job", CHALLENGE: "Challenge" } as const;

export const toCardOpp = (o: DbOpp & { company: Company }): Opportunity & { isSample: boolean } => ({
  id: o.id, company: o.company.name, role: o.title, type: TYPE[o.type], pay: o.payText, unpaid: o.unpaid, location: o.location, mode: MODE[o.workMode],
  eligibility: o.eligibility, deadline: o.deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }),
  verified: o.company.status === "VERIFIED", skills: asList(o.skills), monthly: o.monthlyINR, isSample: o.company.isSample,
});

export const toCardMentor = (m: MentorProfile & { user: User }, guided: number): Mentor & { id: string; isSample: boolean } => ({
  id: m.id, slug: m.slug, name: m.user.name, role: m.roleTitle, company: m.company, country: m.country, flag: FLAGS[m.country] ?? "🌍", domain: m.domain, tags: asList(m.tags),
  guided, available: false, isSample: m.isSample, photo: m.avatarId ? `/api/files/${m.avatarId}` : undefined,
});

/** Only verified companies' moderated, unexpired listings are public. */
export async function publicOpportunities() {
  const rows = await db.opportunity.findMany({ where: { moderated: "VERIFIED", closedAt: null, deadline: { gt: new Date() }, company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } }, include: { company: true }, orderBy: { createdAt: "desc" } });
  return rows.map(toCardOpp);
}

export async function publicMentors() {
  const rows = await db.mentorProfile.findMany({ where: { status: "VERIFIED", user: { suspendedAt: null } }, include: { user: true, slots: { where: { startsAt: { gt: new Date() }, sessionId: null }, take: 1 }, sessions: { where: { status: "COMPLETED" }, select: { studentId: true } } } });
  return rows.map((m) => ({ ...toCardMentor(m, new Set(m.sessions.map((s) => s.studentId)).size), available: m.slots.length > 0 }));
}
