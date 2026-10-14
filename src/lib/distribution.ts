import "server-only";
import { db } from "@/lib/db";

export * from "./distribution-utils";

/** Same gate as the public marketplace: verified company, moderated listing, open, not past deadline, not from a suspended team. Sample data is excluded from outbound feeds. */
export function feedableWhere(extra: object = {}) {
  return { moderated: "VERIFIED" as const, closedAt: null, deadline: { gt: new Date() }, company: { status: "VERIFIED" as const, isSample: false, members: { none: { user: { suspendedAt: { not: null } } } } }, ...extra };
}
export function feedJobs() {
  return db.opportunity.findMany({ where: feedableWhere({ type: { not: "CHALLENGE" } }), include: { company: true }, orderBy: { createdAt: "desc" }, take: 500 });
}
