import "server-only";
import { db } from "@/lib/db";

export type City = { name: string; slug: string; count: number };
const NOT_A_CITY = /^(remote|pan[- ]?india|india|anywhere|work from home|wfh|hybrid|on-?site)$/i;
export const citySlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

/** Cities that have open listings right now, with counts, most listings first. Read from real listings, never a fixed list. */
export async function liveCities(): Promise<City[]> {
  const rows = await db.opportunity.findMany({
    where: { moderated: "VERIFIED", closedAt: null, deadline: { gt: new Date() }, company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } },
    select: { location: true }, take: 2000,
  });
  const m = new Map<string, City>();
  for (const { location } of rows) {
    for (const part of location.split(/[,/|]/)) {
      const name = part.trim().replace(/\s+/g, " ");
      if (name.length < 2 || name.length > 40 || NOT_A_CITY.test(name)) continue;
      const slug = citySlug(name); if (!slug) continue;
      const c = m.get(slug) ?? { name, slug, count: 0 }; c.count++; m.set(slug, c);
    }
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 60);
}
