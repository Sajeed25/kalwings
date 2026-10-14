import "server-only";
import { db } from "@/lib/db";
import { asList } from "@/lib/lists";

/** One source of truth: the usage panel, the admin plans page and server-side enforcement all read PlanConfig. */
export type PlanRow = { key: string; label: string; priceText: string; description: string | null; features: string[]; listings: number; challenges: number; assessments: number; team: number; highlight: boolean; active: boolean; position: number };

/** Used only if the plans table is empty or unreachable, so limits are still enforced. */
const FALLBACK: PlanRow[] = [
  { key: "STARTER", label: "Starter", priceText: "Contact us", description: null, features: [], listings: 3, challenges: 1, assessments: 2, team: 2, highlight: false, active: true, position: 1 },
  { key: "GROWTH", label: "Growth", priceText: "Contact us", description: null, features: [], listings: 20, challenges: 5, assessments: 10, team: 10, highlight: true, active: true, position: 2 },
  { key: "ENTERPRISE", label: "Enterprise", priceText: "Talk to us", description: null, features: [], listings: 100, challenges: 25, assessments: 50, team: 25, highlight: false, active: true, position: 3 },
];

export async function allPlans(): Promise<PlanRow[]> {
  try {
    const rows = await db.planConfig.findMany({ orderBy: [{ position: "asc" }, { label: "asc" }] });
    if (rows.length) return rows.map((r) => ({ ...r, features: asList(r.features) }));
  } catch (e) { console.error("[plans] could not load plans:", e instanceof Error ? e.message : e); }
  return FALLBACK;
}

/** A company's plan. A key with no row (deleted or never created) falls back to the smallest plan so nothing is unlimited by accident. */
export async function getPlan(key: string): Promise<PlanRow> {
  const plans = await allPlans();
  return plans.find((p) => p.key === key) ?? plans.slice().sort((a, b) => a.listings - b.listings)[0];
}

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
export async function limitError(companyId: string, planKey: string, meter: Meter): Promise<string | null> {
  const [used, plan] = await Promise.all([usage(companyId).then((u) => u[meter]), getPlan(planKey)]);
  const max = plan[meter];
  return used >= max ? `Your ${plan.label} plan allows ${max} ${NOUN[meter]} and you have ${used}. Close or finish some, or contact us to change plan.` : null;
}
