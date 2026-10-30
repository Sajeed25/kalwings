import { asList } from "@/lib/lists";
import "server-only";
import { TYPE_LABEL } from "@/lib/opportunity-types";
import type { Company, MentorProfile, Opportunity as DbOpp, User } from "@prisma/client";
import { db } from "@/lib/db";
import type { Mentor, Opportunity } from "@/data/sample";

const FLAGS: Record<string, string> = { India: "🇮🇳", Germany: "🇩🇪", "Saudi Arabia": "🇸🇦", UAE: "🇦🇪", "United States": "🇺🇸", "United Kingdom": "🇬🇧", Singapore: "🇸🇬", Canada: "🇨🇦", Australia: "🇦🇺" };
const MODE = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" } as const;
const TYPE = TYPE_LABEL;

export const toCardOpp = (o: DbOpp & { company: Company }): Opportunity & { isSample: boolean } => ({
  id: o.id, company: o.company.name, role: o.title, type: TYPE[o.type], pay: o.payText, unpaid: o.unpaid, location: o.location, mode: MODE[o.workMode],
  eligibility: o.eligibility, deadline: o.deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }),
  verified: o.company.status === "VERIFIED", skills: asList(o.skills), monthly: o.monthlyINR, isSample: o.company.isSample, logoId: o.company.logoId,
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

export const PAGE_SIZE = 12;
export const SORTS = { new: "Newest", deadline: "Deadline soonest", pay: "Highest pay" } as const;
export type SortKey = keyof typeof SORTS;

export type OppQuery = { q?: string; skill?: string; type?: string; mode?: string; pay?: string; employer?: string; location?: string; year?: string; closing?: string; min?: number; sort?: SortKey; page?: number };

/**
 * Server-side search over verified, moderated, open listings. Text, type, mode, pay, employer, location,
 * deadline and sort run in the database; skills and graduation year live in JSON lists so they are
 * matched in memory over a capped candidate set (listings are moderated, so the set stays small).
 */
export async function searchOpportunities(p: OppQuery) {
  const now = new Date();
  const closeBy = p.closing ? new Date(now.getTime() + Number(p.closing) * 86_400_000) : null;
  const and: object[] = [];
  if (p.q) and.push({ OR: [{ title: { contains: p.q } }, { description: { contains: p.q } }, { company: { name: { contains: p.q } } }] });
  if (p.employer) and.push({ company: { name: { contains: p.employer } } });
  if (p.location) and.push({ location: { contains: p.location } });
  const rows = await db.opportunity.findMany({
    where: {
      moderated: "VERIFIED", closedAt: null, deadline: closeBy ? { gt: now, lte: closeBy } : { gt: now },
      company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } },
      ...(p.type && p.type in TYPE_LABEL ? { type: p.type as keyof typeof TYPE_LABEL } : {}),
      ...(p.mode === "REMOTE" || p.mode === "HYBRID" || p.mode === "ONSITE" ? { workMode: p.mode } : {}),
      ...(p.pay === "paid" ? { unpaid: false } : p.pay === "unpaid" ? { unpaid: true } : {}),
      ...(p.min && p.min > 0 ? { monthlyINR: { gte: p.min } } : {}),
      ...(and.length ? { AND: and } : {}),
    },
    include: { company: true },
    orderBy: p.sort === "deadline" ? { deadline: "asc" } : p.sort === "pay" ? [{ monthlyINR: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
    take: 500,
  });
  const skill = p.skill?.trim().toLowerCase();
  const year = p.year?.trim();
  const filtered = rows.filter((o) => {
    if (skill && !asList(o.skills).some((s) => s.toLowerCase().includes(skill))) return false;
    if (year) { const g = asList(o.gradYears); if (g.length && !g.includes(year)) return false; }
    return true;
  });
  const page = Math.max(1, Math.floor(p.page ?? 1));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  return { total: filtered.length, page: cur, pages, items: filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE).map(toCardOpp) };
}

/** How many listings the public can see right now with no filters. Used to tell "nothing matches your filters" apart from "nothing is published yet". */
export function openListingCount() {
  return db.opportunity.count({ where: { moderated: "VERIFIED", closedAt: null, deadline: { gt: new Date() }, company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } } });
}
