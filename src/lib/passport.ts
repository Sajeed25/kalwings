import "server-only";
import type { Visibility } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";

/** Usernames that would collide with routes or look official. */
export const RESERVED = new Set(["admin", "api", "kalwings", "support", "help", "root", "me", "new", "resume", "login", "join", "team", "staff", "official"]);
export const usernameSchema = z.string().trim().toLowerCase()
  .regex(/^[a-z0-9][a-z0-9_-]{2,29}$/, "3 to 30 letters, numbers, - or _ (start with a letter or number)")
  .refine((u) => !RESERVED.has(u), "That username is reserved");

export type Viewer = { owner: boolean; recruiter: boolean };

export async function getViewer(profileUserId: string): Promise<Viewer> {
  const u = await getUser();
  if (!u) return { owner: false, recruiter: false };
  if (u.id === profileUserId) return { owner: true, recruiter: false };
  if (u.role === "PLATFORM_ADMIN") return { owner: false, recruiter: true };
  if (u.role === "EMPLOYER") {
    const m = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: { select: { status: true } } } });
    return { owner: false, recruiter: m?.company.status === "VERIFIED" };
  }
  return { owner: false, recruiter: false };
}

/** Owner always sees everything; PUBLIC is open; RECRUITERS needs a verified employer (or admin). */
export const canSee = (vis: Visibility, v: Viewer) => v.owner || vis === "PUBLIC" || (vis === "RECRUITERS" && v.recruiter);

export const canonicalKey = (p: { username: string | null; slug: string }) => p.username ?? p.slug;

/** Explicit select: email and phone can never reach a public page. */
export async function loadPassport(key: string) {
  const k = key.toLowerCase();
  const p = await db.studentProfile.findFirst({
    where: { OR: [{ username: k }, { slug: key }] },
    select: {
      id: true, slug: true, username: true, avatarId: true, headline: true, bio: true, city: true, graduationYear: true, githubUrl: true, skillsClaimed: true, lookingFor: true, isSample: true,
      passportVisibility: true, projectsVisibility: true, endorsementsVisibility: true, entriesVisibility: true,
      user: { select: { id: true, name: true, suspendedAt: true } },
      college: { select: { name: true } },
      projects: true, skills: true, entries: { orderBy: [{ year: "desc" }, { createdAt: "desc" }] },
      endorsements: { include: { mentor: { include: { user: { select: { name: true } } } } } },
    },
  });
  if (!p || !p.headline || p.user.suspendedAt) return null;
  return p;
}

export const KIND_LABEL = { EXPERIENCE: "Experience", ACHIEVEMENT: "Achievements", HACKATHON: "Hackathons", CERTIFICATE: "Certificates" } as const;
