import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const paths = ["/opportunities", "/mentors", "/challenges", "/community", "/contact", "/help", "/privacy", "/terms", "/trust"];

/** Static pages plus REAL (non-sample) verified opportunities and mentors. If the database is down, only static pages are listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = paths.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "weekly", priority: 0.7 }));
  try {
    const [opps, mentors, careers] = await Promise.all([
      db.opportunity.findMany({ where: { moderated: "VERIFIED", closedAt: null, deadline: { gt: new Date() }, company: { status: "VERIFIED", isSample: false, members: { none: { user: { suspendedAt: { not: null } } } } } }, select: { id: true, createdAt: true }, take: 5000 }),
      db.mentorProfile.findMany({ where: { status: "VERIFIED", isSample: false, user: { suspendedAt: null } }, select: { slug: true }, take: 5000 }),
      db.company.findMany({ where: { slug: { not: null }, status: "VERIFIED", isSample: false, members: { none: { user: { suspendedAt: { not: null } } } } }, select: { slug: true }, take: 5000 }),
    ]);
    return [
      ...base,
      ...opps.map((o) => ({ url: `${site.url}/opportunities/${o.id}`, lastModified: o.createdAt, changeFrequency: "daily" as const, priority: 0.6 })),
      ...careers.map((c) => ({ url: `${site.url}/careers/${c.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
      ...mentors.map((m) => ({ url: `${site.url}/mentors/${m.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ];
  } catch {
    return base;
  }
}
