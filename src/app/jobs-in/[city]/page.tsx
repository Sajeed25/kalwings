import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Serif } from "@/components/ui/serif";
import { PageHero, Block } from "@/components/pages/shell";
import { OpportunityBrowser } from "@/components/pages/opportunity-browser";
import { searchOpportunities, type OppQuery } from "@/lib/public-data";
import { liveCities } from "@/lib/cities";
import { SharePanel } from "@/components/share-panel";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ city: string }>; searchParams: Promise<{ page?: string }> };

async function find(slug: string) { try { return (await liveCities()).find((c) => c.slug === slug) ?? null; } catch { return null; } }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await find((await params).city);
  return c ? { title: `Jobs and internships in ${c.name}`, description: `${c.count} open opportunities in ${c.name} for freshers, with pay, work mode and eligibility shown.` } : { title: "Jobs by city" };
}

export default async function Page({ params, searchParams }: P) {
  const slug = (await params).city; const c = await find(slug);
  if (!c) notFound();
  const query: OppQuery = { location: c.name, sort: "new", page: Number((await searchParams).page) || 1, min: 0 };
  const res = await searchOpportunities(query);
  return (
    <>
      <PageHero eyebrow="Near you" title={<>Opportunities in <Serif>{c.name}</Serif>.</>} lead={`${c.count} open right now. Every listing shows pay, work mode, location and eligibility. Applying doesn't guarantee an interview or offer.`} />
      <Block>
        <p className="mb-6 text-sm"><Link href="/jobs-in" className="font-semibold text-accent underline">← All cities</Link></p>
        <OpportunityBrowser items={res.items} total={res.total} page={res.page} pages={res.pages} query={query} />
        <SharePanel title={`Opportunities in ${c.name}`} company="Kalwings" details={`${c.count} open roles for freshers, with pay, work mode and eligibility shown.`} link={`${site.url}/jobs-in/${c.slug}`} heading={`Share ${c.name} opportunities with friends`} />
      </Block>
    </>
  );
}
