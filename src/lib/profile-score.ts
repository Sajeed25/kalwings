import "server-only";
import { db } from "@/lib/db";
import { completeness } from "@/lib/completeness";

/** The live profile score (not the stored copy), used to gate features that need a complete profile. */
export async function liveProfileScore(studentId: string) {
  const p = await db.studentProfile.findUniqueOrThrow({ where: { id: studentId }, include: { projects: true } });
  const ev = await db.skillEvidence.count({ where: { studentId } });
  return completeness(p, ev);
}
