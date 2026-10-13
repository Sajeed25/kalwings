import type { Metadata } from "next";
import { PageHero, Block } from "@/components/pages/shell";
import { publicOpportunities } from "@/lib/public-data";
import { OpportunityBrowser } from "@/components/pages/opportunity-browser";

export const metadata: Metadata = { title: "Opportunities", description: "Internships, jobs and challenges for freshers — with pay, work mode and eligibility always shown." };

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; location?: string }> }) {
  const sp = await searchParams;
  const items = await publicOpportunities();
  return (
    <>
      <PageHero eyebrow="Opportunities" title="Roles that show you the pay." lead="Every listing shows pay, work mode, location and eligibility. Unpaid roles are labelled clearly. Nothing here is a guaranteed job." />
      <Block><OpportunityBrowser items={items} initialQ={sp.q ?? ""} initialLocation={sp.location ?? ""} /></Block>
    </>
  );
}
