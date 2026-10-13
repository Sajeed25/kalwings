import type { Metadata } from "next";
import { PageHero, Block } from "@/components/pages/shell";
import { searchOpportunities, SORTS, type OppQuery, type SortKey } from "@/lib/public-data";
import { OpportunityBrowser } from "@/components/pages/opportunity-browser";

export const metadata: Metadata = { title: "Opportunities", description: "Internships, jobs and challenges for freshers — with pay, work mode and eligibility always shown." };

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 80);

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
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
        {unavailable && <p role="status" className="mb-6 rounded-xl border border-dashed border-line p-4 text-sm text-ink-soft">Listings are temporarily unavailable. Please check back in a few minutes.</p>}
        <OpportunityBrowser items={res.items} total={res.total} page={res.page} pages={res.pages} query={query} />
      </Block>
    </>
  );
}
