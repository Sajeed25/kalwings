import { asList } from "@/lib/lists";
import type { Project, StudentProfile } from "@prisma/client";

/** Profile completeness score 0–100. Weights are deliberately simple and visible to the student. */
export function completeness(p: StudentProfile & { projects: Project[] }, evidenceCount: number) {
  const checks: [string, boolean, number][] = [
    ["Add a headline", !!p.headline, 15],
    ["Write a short bio", (p.bio?.length ?? 0) >= 40, 15],
    ["Add your graduation year", !!p.graduationYear, 10],
    ["Add your city", !!p.city, 5],
    ["List at least 3 skills", asList(p.skillsClaimed).length >= 3, 15],
    ["Add a project", p.projects.length >= 1, 20],
    ["Link your GitHub", !!p.githubUrl, 5],
    ["Earn verified evidence (endorsement or challenge)", evidenceCount >= 1, 15],
  ];
  const score = checks.reduce((n, [, ok, w]) => n + (ok ? w : 0), 0);
  return { score, todo: checks.filter(([, ok]) => !ok).map(([t]) => t) };
}
