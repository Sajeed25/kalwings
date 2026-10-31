"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActionRole } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { grade, testBySlug, type ReviewItem } from "@/lib/practice-bank";

export type PracticeResult = { error?: string; score?: number; total?: number; review?: ReviewItem[] };
const schema = z.object({ slug: z.string().max(60), chosen: z.array(z.number().int().min(0).max(3).nullable()).max(50) });

/** Grades a practice test on the server and keeps the score for the student only. Never shown to employers or ranked. */
export async function submitPractice(input: { slug: string; chosen: (number | null)[] }): Promise<PracticeResult> {
  const u = await requireActionRole("STUDENT");
  const p = schema.safeParse(input);
  const t = p.success ? testBySlug(p.data.slug) : undefined;
  if (!p.success || !t) return { error: "That test was not found." };
  if (!(await rateLimit(`practice:${u.id}`, 30, 3_600_000))) return { error: "Too many attempts this hour. Take a break and come back." };
  const r = grade(t, p.data.chosen);
  await db.practiceAttempt.create({ data: { userId: u.id, testSlug: t.slug, score: r.score, total: r.total } });
  return r;
}
