import "server-only";
import { db } from "@/lib/db";
import { feedableWhere } from "@/lib/distribution";

/** Career pages exist only for verified companies whose team is in good standing. Sample companies are shown but never indexed. */
export async function careerPage(slug: string) {
  const company = await db.company.findFirst({ where: { slug, status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } });
  if (!company) return null;
  const jobs = await db.opportunity.findMany({ where: { ...feedableWhere(), companyId: company.id, company: undefined }, orderBy: { createdAt: "desc" } });
  const open = company.isSample ? await db.opportunity.findMany({ where: { companyId: company.id, moderated: "VERIFIED", closedAt: null, deadline: { gt: new Date() } }, orderBy: { createdAt: "desc" } }) : jobs;
  return { company, jobs: open };
}
