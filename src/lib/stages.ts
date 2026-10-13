import type { ApplicationStage } from "@prisma/client";

/** Pipeline order. Recruiters can rename these per company, but the stages themselves are fixed. */
export const PIPELINE: ApplicationStage[] = ["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"];
export const DEFAULT_LABEL: Record<ApplicationStage, string> = {
  APPLIED: "Applied", UNDER_REVIEW: "Under review", SHORTLISTED: "Shortlisted", INTERVIEW: "Interview", OFFER: "Offer", HIRED: "Hired", REJECTED: "Rejected", WITHDRAWN: "Withdrawn",
};
export function stageLabels(custom: unknown): Record<ApplicationStage, string> {
  const out = { ...DEFAULT_LABEL };
  if (custom && typeof custom === "object" && !Array.isArray(custom)) {
    for (const k of Object.keys(DEFAULT_LABEL) as ApplicationStage[]) {
      const v = (custom as Record<string, unknown>)[k];
      if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 24);
    }
  }
  return out;
}
/** Stages a candidate can still withdraw from. */
export const WITHDRAWABLE: ApplicationStage[] = ["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW"];
/** Stages that count as "reached offer or beyond" in reports. */
export const OFFER_OR_BETTER: ApplicationStage[] = ["OFFER", "HIRED"];
