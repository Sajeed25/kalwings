import Link from "next/link";
import type { Metadata } from "next";
import { Serif } from "@/components/ui/serif";
import { PageHero, Block } from "@/components/pages/shell";
import { PinFinder } from "@/components/pin-finder";
import { liveCities } from "@/lib/cities";

export const metadata: Metadata = { title: "Jobs and internships by city", description: "Find fresher jobs, internships and challenges near you. Pay, work mode and eligibility are always shown." };
export const dynamic = "force-dynamic";

export default async function Page() {
  let cities: Awaited<ReturnType<typeof liveCities>> = [];
  try { cities = await liveCities(); } catch (e) { console.error("[jobs-in] load failed:", e instanceof Error ? e.message : e); }
  return (
    <>
      <PageHero eyebrow="Near you" title={<>Opportunities in <Serif>your city</Serif>.</>} lead="Pick your city to see what is open right now. Every listing shows pay, work mode and eligibility. Nothing here is a guaranteed job." />
      <Block>
        <PinFinder />
        {cities.length ? (
          <ul className="flex flex-wrap gap-3">{cities.map((c) => <li key={c.slug}><Link href={`/jobs-in/${c.slug}`} className="inline-flex h-12 items-center gap-3 rounded-full border border-line px-5 font-semibold hover:border-accent">{c.name}<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-ink-soft">{c.count}</span></Link></li>)}</ul>
        ) : <p className="text-ink-soft">No city listings are open right now. <Link href="/opportunities" className="font-semibold text-accent underline">See all opportunities</Link>.</p>}
        <p className="mt-8 text-sm text-ink-soft">Looking for something else? <Link href="/opportunities" className="font-semibold text-accent underline">Search all opportunities</Link>.</p>
      </Block>
    </>
  );
}
