/**
 * Explainable matching. Everything here is deterministic and shows its working: which skills matched (and whether
 * they are evidence-backed or self-declared), which are missing, and whether the graduation year fits. The score is
 * an advisory indicator for sorting and conversation. It is never used to hide, filter out or reject anyone.
 * Nothing is inferred or invented: only skills the student actually listed or earned count.
 */
export type SkillSet = { verified: string[]; claimed: string[] };
export type MatchInput = { wantedSkills: string[]; gradYears: string[]; student: SkillSet & { graduationYear: number | null } };
export type Match = {
  score: number | null; // null when the listing names no skills, so there is nothing to compare
  matchedVerified: string[]; matchedClaimed: string[]; missing: string[];
  yearFit: "fits" | "does-not-fit" | "unknown";
  reasons: string[];
};

const norm = (s: string) => s.trim().toLowerCase();

export function explainMatch({ wantedSkills, gradYears, student }: MatchInput): Match {
  const ver = new Map(student.verified.map((s) => [norm(s), s]));
  const clm = new Map(student.claimed.map((s) => [norm(s), s]));
  const matchedVerified: string[] = [], matchedClaimed: string[] = [], missing: string[] = [];
  for (const w of wantedSkills) {
    const k = norm(w);
    if (ver.has(k)) matchedVerified.push(w);
    else if (clm.has(k)) matchedClaimed.push(w);
    else missing.push(w);
  }
  const yearFit: Match["yearFit"] = !gradYears.length || !student.graduationYear ? "unknown" : gradYears.includes(String(student.graduationYear)) ? "fits" : "does-not-fit";
  const reasons: string[] = [];
  if (matchedVerified.length) reasons.push(`Evidence-backed: ${matchedVerified.join(", ")}`);
  if (matchedClaimed.length) reasons.push(`Self-declared (not yet verified): ${matchedClaimed.join(", ")}`);
  if (missing.length) reasons.push(`Not found on the profile: ${missing.join(", ")}`);
  if (yearFit === "fits") reasons.push(`Graduation year ${student.graduationYear} fits the listing`);
  if (yearFit === "does-not-fit") reasons.push(`Listing targets ${gradYears.join(", ")}; the profile says ${student.graduationYear}. Check eligibility`);
  if (yearFit === "unknown" && gradYears.length) reasons.push("Graduation year missing from the profile");
  if (!wantedSkills.length) return { score: null, matchedVerified, matchedClaimed, missing, yearFit, reasons: ["This listing names no skills, so there is nothing to compare. Read the description."] };
  const skillPart = ((matchedVerified.length + matchedClaimed.length * 0.7) / wantedSkills.length) * 70;
  const yearPart = yearFit === "fits" ? 30 : yearFit === "unknown" ? 15 : 0;
  return { score: Math.round(skillPart + yearPart), matchedVerified, matchedClaimed, missing, yearFit, reasons };
}

/** One honest, concrete way to close each gap. No promises about outcomes. */
export const closeGapTip = (skill: string) => `Add a project or finish a challenge that really uses ${skill}, then ask a mentor to endorse it with a link as evidence.`;
