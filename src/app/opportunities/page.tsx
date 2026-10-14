import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { parseNaturalQuery } from "@/lib/nlsearch";
import { PageHero, Block } from "@/components/pages/shell";
import { searchOpportunities, SORTS, type OppQuery, type SortKey } from "@/lib/public-data";
import { OpportunityBrowser } from "@/components/pages/opportunity-browser";

export const metadata: Metadata = { title: "Opportunities", description: "Internships, jobs and challenges for freshers — with pay, work mode and eligibility always shown." };

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 80);

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const nl = one(sp.nl);
  if (nl) {
    // "Describe what you want": a transparent keyword parser (no AI service) that maps a sentence onto the normal filters.
    let cities: string[] = [];
    try { cities = (await db.opportunity.findMany({ where: { moderated: "VERIFIED", closedAt: null }, select: { location: true }, distinct: ["location"], take: 100 })).map((c) => c.location); } catch { /* parse without known cities */ }
    const p = parseNaturalQuery(nl, cities);
    const u = new URLSearchParams();
    for (const k of ["skill", "type", "mode", "pay", "location", "year"] as const) if (p[k]) u.set(k, p[k]!);
    u.set("interpreted", p.summary.join(", ") || "no filters recognised");
    redirect(`/opportunities?${u.toString()}`);
  }
  const interpreted = one(sp.interpreted);
  const sort = one(sp.sort);
  const query: OppQuery = {
    q: one(sp.q), skill: one(sp.skill), type: one(sp.type), mode: one(sp.mode), pay: one(sp.pay), employer: one(sp.employer),
    location: one(sp.location), year: one(sp.year), closing: one(sp.closing) === "7" || one(sp.closing) === "30" ? one(sp.closing) : undefined,
    min: Math.max(0, Number(one(sp.min)) || 0), sort: sort && sort in SORTS ? (sort as SortKey) : "new", page: Number(one(sp.page)) || 1,
  };
  let res: Awaited<ReturnType<typeof searchOpportunities>> = { total: 0, page: 1, pages: 1, items: [] };
  let unavailable = false;
  try { res = await searchOpportunities(query); } catch (e) { unavailable = true; console.error("[opportunities] load failed:", e instanceof Error ? e.message : e); }
  return (
    <>
      <PageHero eyebrow="Opportunities" title="Roles that show you the pay." lead="Every listing shows pay, work mode, location and eligibility. Unpaid roles are labelled clearly. Nothing here is a guaranteed job." />
      <Block>
        <form role="search" aria-label="Describe what you want" className="mb-6 flex flex-wrap gap-2"><label className="sr-only" htmlFor="nl">Describe what you want</label>
          <input id="nl" name="nl" placeholder="Describe what you want, e.g. remote React internship, paid, class of 2026" className="h-11 min-w-[260px] flex-1 rounded-lg border border-line bg-surface px-3" />
          <button className="h-11 rounded-lg bg-primary px-5 font-semibold text-white">Find</button></form>
        {interpreted && <p className="mb-4 text-sm text-ink-soft" role="status">We read that as: {interpreted}. Adjust the filters below if that is not what you meant.</p>}
        {unavailable && <p role="status" className="mb-6 rounded-xl border border-dashed border-line p-4 text-sm text-ink-soft">Listings are temporarily unavailable. Please check back in a few minutes.</p>}
        <OpportunityBrowser items={res.items} total={res.total} page={res.page} pages={res.pages} query={query} />
      </Block>
    </>
  );
}
