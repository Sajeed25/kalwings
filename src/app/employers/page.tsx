import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PageHero, Block, FeatureGrid, DraftNotice } from "@/components/pages/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "For Employers", description: "Hire proven freshers. See the work, not just the résumé." };

const tiers = [
  { n: "Starter", p: "[₹ — set price]", d: "For teams making their first fresher hires.", f: ["Verified company profile", "[X] active roles", "Talent search", "Basic pipeline"] },
  { n: "Growth", p: "[₹ — set price]", d: "For teams hiring through the year.", f: ["Everything in Starter", "[X] active roles & challenges", "Shortlists, notes & messaging", "Team seats"], hl: true },
  { n: "Enterprise", p: "Talk to us", d: "For campus-scale and multi-city hiring.", f: ["Everything in Growth", "Custom challenges", "Dedicated success manager", "SSO & reporting"] },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="For employers" title="Hire freshers who've already proven it." lead="Companies are verified before they get access. Sponsored placements are always labelled and never shown as “verified” or “better”.">
        <Button asChild size="lg"><Link href="/contact?topic=employer">Start hiring</Link></Button>
      </PageHero>
      <Block>
        <FeatureGrid items={[
          { t: "Talent search", d: "Filter by verified skills, projects and challenge results — not keywords on a CV." },
          { t: "Hiring Studio", d: "Shortlist and move candidates through Applied → Shortlisted → Interview → Offer with notes and messaging." },
          { t: "Challenge-to-Hire", d: "Post a real problem and meet the people who solve it best." },
        ]} />
      </Block>
      <Block className="bg-muted">
        <h2 className="text-3xl font-extrabold md:text-4xl">Pricing</h2>
        <div className="mt-6 max-w-2xl"><DraftNotice>Placeholder pricing — set real prices before launch.</DraftNotice></div>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <li key={t.n} className={`card flex flex-col p-8 ${t.hl ? "border-teal ring-2 ring-teal/40" : ""}`}>
              <div className="flex items-center justify-between"><h3 className="text-2xl">{t.n}</h3>{t.hl && <Badge tone="teal">Most popular</Badge>}</div>
              <p className="mt-4 font-display text-3xl font-extrabold">{t.p}</p>
              <p className="mt-2 text-ink-soft">{t.d}</p>
              <ul className="mt-6 space-y-2.5">{t.f.map((x) => <li key={x} className="flex gap-2 text-[15px]"><Check className="mt-1 h-4 w-4 shrink-0 text-teal-700 dark:text-teal" aria-hidden />{x}</li>)}</ul>
              <Button asChild variant={t.hl ? "primary" : "secondary"} className="mt-8"><Link href="/contact?topic=employer">Get started</Link></Button>
            </li>
          ))}
        </ul>
      </Block>
    </>
  );
}
