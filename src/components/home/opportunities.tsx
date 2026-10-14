import Link from "next/link";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
import { Badge, SampleTag } from "@/components/ui/badge";
import type { Opportunity } from "@/data/sample";

export function OpportunityCard({ o }: { o: Opportunity }) {
  return (
    <article className="card card-hover flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <div className="placeholder-img grid h-11 w-11 place-items-center rounded-xl text-sm font-bold" aria-label="Company logo placeholder">{o.company.slice(-1)}</div>
        <Badge tone={o.type === "Challenge" ? "spot" : "accent"}>{o.type}</Badge>
      </div>
      <h3 className="mt-4 text-xl">{o.role}</h3>
      <p className="flex items-center gap-1 text-[15px] text-ink-soft">
        {o.company}
        {o.verified && <BadgeCheck className="h-4 w-4 text-accent" aria-label="Verified employer" />}
      </p>
      <p className="mt-4 font-display text-lg font-bold">{o.pay}{o.unpaid && <Badge tone="spot" className="ml-2 align-middle">Unpaid</Badge>}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
        <li className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden />{o.location} · {o.mode}</li>
        <li className="flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden />Apply by {o.deadline}</li>
        <li>Eligibility: {o.eligibility}</li>
      </ul>
      <div className="mt-auto flex items-center justify-between pt-5">
        <Link href={`/opportunities/${o.id}`} className="text-sm font-semibold text-accent hover:underline ">View details →</Link>
        {o.isSample !== false && <SampleTag />}
      </div>
    </article>
  );
}
