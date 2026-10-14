import "server-only";
import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";

/** One source of truth: the pricing page, the usage panel and server-side enforcement all read these numbers. */
export const PLAN_LIMITS: Record<Plan, { label: string; listings: number; challenges: number; assessments: number; team: number }> = {
  STARTER: { label: "Starter", listings: 3, challenges: 1, assessments: 2, team: 2 },
  GROWTH: { label: "Growth", listings: 20, challenges: 5, assessments: 10, team: 10 },
  ENTERPRISE: { label: "Enterprise", listings: 100, challenges: 25, assessments: 50, team: 25 },
};
export type Meter = "listings" | "challenges" | "assessments" | "team";
const NOUN: Record<Meter, string> = { listings: "active listings", challenges: "active challenges", assessments: "open assessments", team: "team members and pending invitations" };

export async function usage(companyId: string) {
  const [listings, challenges, assessments, members, invites] = await Promise.all([
    db.opportunity.count({ where: { companyId, closedAt: null, deadline: { gt: new Date() }, type: { not: "CHALLENGE" } } }),
    db.opportunity.count({ where: { companyId, closedAt: null, deadline: { gt: new Date() }, type: "CHALLENGE" } }),
    db.assessment.count({ where: { companyId, closedAt: null } }),
    db.employerMember.count({ where: { companyId } }),
    db.companyInvite.count({ where: { companyId, acceptedAt: null } }),
  ]);
  return { listings, challenges, assessments, team: members + invites };
}

/** Returns an error message when the company is at its plan limit for this meter, else null. */
export async function limitError(companyId: string, plan: Plan, meter: Meter): Promise<string | null> {
  const used = (await usage(companyId))[meter];
  const max = PLAN_LIMITS[plan][meter];
  return used >= max ? `Your ${PLAN_LIMITS[plan].label} plan allows ${max} ${NOUN[meter]} and you have ${used}. Close or finish some, or contact us to change plan.` : null;
}
