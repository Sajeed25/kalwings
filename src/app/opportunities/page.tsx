import type { Metadata } from "next";
import { PageHero, Block } from "@/components/pages/shell";
import { publicOpportunities } from "@/lib/public-data";
import { OpportunityBrowser } from "@/components/pages/opportunity-browser";

export const metadata: Metadata = { title: "Opportunities", description: "Internships, jobs and challenges for freshers — with pay, work mode and eligibility always shown." };

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; location?: string }> }) {
  const sp = await searchParams;
  let items: Awaited<ReturnType<typeof publicOpportunities>> = [];
  let unavailable = false;
  try { items = await publicOpportunities(); } catch (e) { unavailable = true; console.error("[opportunities] load failed:", e instanceof Error ? e.message : e); }
  return (
    <>
      <PageHero eyebrow="Opportunities" title="Roles that show you the pay." lead="Every listing shows pay, work mode, location and eligibility. Unpaid roles are labelled clearly. Nothing here is a guaranteed job." />
      <Block>
        {unavailable && <p role="status" className="mb-6 rounded-xl border border-dashed border-line p-4 text-sm text-ink-soft">Listings are temporarily unavailable. Please check back in a few minutes.</p>}
        <OpportunityBrowser items={items} initialQ={sp.q ?? ""} initialLocation={sp.location ?? ""} />
      </Block>
    </>
  );
}
