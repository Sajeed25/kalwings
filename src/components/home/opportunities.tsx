import Link from "next/link";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Badge, SampleTag } from "@/components/ui/badge";
import { opportunities, type Opportunity } from "@/data/sample";

export function OpportunityCard({ o }: { o: Opportunity }) {
  return (
    <article className="card card-hover flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <div className="placeholder-img grid h-11 w-11 place-items-center rounded-xl text-sm font-bold" aria-label="Company logo placeholder">{o.company.slice(-1)}</div>
        <Badge tone={o.type === "Challenge" ? "saffron" : "teal"}>{o.type}</Badge>
      </div>
      <h3 className="mt-4 text-xl">{o.role}</h3>
      <p className="flex items-center gap-1 text-[15px] text-ink-soft">
        {o.company}
        {o.verified && <BadgeCheck className="h-4 w-4 text-teal-700 dark:text-teal" aria-label="Verified employer" />}
      </p>
      <p className="mt-4 font-display text-lg font-bold">{o.pay}{o.unpaid && <Badge tone="saffron" className="ml-2 align-middle">Unpaid</Badge>}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
        <li className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden />{o.location} · {o.mode}</li>
        <li className="flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden />Apply by {o.deadline}</li>
        <li>Eligibility: {o.eligibility}</li>
      </ul>
      <div className="mt-auto flex items-center justify-between pt-5">
        <Link href={`/opportunities/${o.id}`} className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal">View details →</Link>
        {o.isSample !== false && <SampleTag />}
      </div>
    </article>
  );
}

export function LiveOpportunities() {
  return (
    <section className="section bg-muted">
      <div className="container">
        <Reveal className="flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow">Live opportunities</p>
            <h2 className="h-section mt-3">Real roles. Real pay shown up front.</h2>
          </div>
          <Link href="/opportunities" className="hidden shrink-0 font-semibold hover:underline md:block">View all →</Link>
        </Reveal>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((o, i) => (<Reveal as="li" key={o.id} delay={(i % 3) * 0.07}><OpportunityCard o={o} /></Reveal>))}
        </ul>
        <Link href="/opportunities" className="mt-8 block font-semibold md:hidden">View all →</Link>
      </div>
    </section>
  );
}
