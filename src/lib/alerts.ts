import "server-only";
import { db } from "@/lib/db";
import { notify } from "@/lib/audit";
import { asList } from "@/lib/lists";
import { shortUrl } from "@/lib/distribution";
import { alertMatches } from "@/lib/alerts-match";

/**
 * Called when a listing goes live. Tells people whose saved searches match, once each. Never throws: a failure here must not block publishing.
 * Sample companies never trigger alerts. Email goes through notify(), which respects each person's unsubscribe choice and the hourly cap.
 */
export async function fireAlerts(opportunityId: string): Promise<number> {
  try {
    const o = await db.opportunity.findUnique({ where: { id: opportunityId }, include: { company: true } });
    if (!o || o.moderated !== "VERIFIED" || o.closedAt || o.company.status !== "VERIFIED" || o.company.isSample) return 0;
    const alerts = await db.jobAlert.findMany({ take: 5000, orderBy: { createdAt: "asc" } });
    const facts = { title: o.title, type: o.type, workMode: o.workMode, location: o.location, skills: asList(o.skills), company: o.company.name };
    const hits = alerts.filter((a) => alertMatches(a, facts));
    const seen = new Set<string>(); let sent = 0;
    for (const a of hits) {
      if (seen.has(a.userId)) continue; seen.add(a.userId);
      await notify(a.userId, `New match: ${o.title} at ${o.company.name}`, `${o.location} · ${o.payText}${o.unpaid ? " (unpaid)" : ""} · Eligibility: ${o.eligibility}. Apply: ${shortUrl(o, "alert")}`, `/opportunities/${o.id}?src=alert`);
      await db.jobAlert.update({ where: { id: a.id }, data: { lastSentAt: new Date() } }); sent++;
    }
    return sent;
  } catch (e) { console.error("[alerts] failed:", e instanceof Error ? e.message : e); return 0; }
}
