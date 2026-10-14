import Link from "next/link";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
import { Badge, SampleTag } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/ui/company-logo";
import type { Opportunity } from "@/data/sample";

export function OpportunityCard({ o }: { o: Opportunity }) {
  return (
    <article className="card card-hover flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <CompanyLogo name={o.company} logoId={o.logoId} />
        <Badge tone={o.type === "Challenge" ? "spot" : "accent"}>{o.type}</Badge>
      </div>
      <h3 className="mt-5 text-xl font-bold leading-snug">{o.role}</h3>
      <p className="mt-1 flex items-center gap-1 text-[15px] text-ink-soft">
        {o.company}
        {o.verified && <BadgeCheck className="h-4 w-4 text-accent" aria-label="Verified employer" />}
      </p>
      <p className="mt-4 text-lg font-bold">{o.pay}{o.unpaid && <Badge tone="spot" className="ml-2 align-middle">Unpaid</Badge>}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
        <li className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden />{o.location} · {o.mode}</li>
        <li className="flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden />Apply by {o.deadline}</li>
        <li>Eligibility: {o.eligibility}</li>
      </ul>
      <div className="mt-auto flex items-center justify-between pt-6">
        <Link href={`/opportunities/${o.id}`} className="inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90">View details</Link>
        {o.isSample !== false && <SampleTag />}
      </div>
    </article>
  );
}
