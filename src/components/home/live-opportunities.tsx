import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { publicOpportunities } from "@/lib/public-data";
import { OpportunityCard } from "@/components/home/opportunities";

export async function LiveOpportunities() {
  const opportunities = await publicOpportunities().then((r) => r.slice(0, 6)).catch(() => []);
  return (
    <section className="section bg-muted">
      <div className="container">
        <Reveal className="flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow">Live opportunities</p>
            <h2 className="h-section mt-3">Real roles. Real pay shown up front.</h2>
          </div>
          {opportunities.length > 0 && <Link href="/opportunities" className="hidden shrink-0 font-semibold hover:underline md:block">View all →</Link>}
        </Reveal>
        {opportunities.length ? (
          <>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((o, i) => (<Reveal as="li" key={o.id} delay={(i % 3) * 0.07}><OpportunityCard o={o} /></Reveal>))}
            </ul>
            <Link href="/opportunities" className="mt-8 block font-semibold md:hidden">View all →</Link>
          </>
        ) : (
          <div className="card mt-12 p-8">
            <h3 className="text-xl">New roles are added as employers are verified.</h3>
            <p className="mt-2 max-w-2xl text-ink-soft">Every listing shows pay, work mode, location and eligibility, and is reviewed before it goes live. Hiring freshers in Hyderabad or anywhere in India? Post your first role for free.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link href="/employers">Post a role</Link></Button><Button asChild variant="secondary"><Link href="/students">Build my Talent Card</Link></Button></div>
          </div>
        )}
      </div>
    </section>
  );
}
