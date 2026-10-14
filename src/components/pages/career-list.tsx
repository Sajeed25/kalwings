import Link from "next/link";
import { TYPE_LABEL } from "@/lib/opportunity-types";
import type { Company, Opportunity } from "@prisma/client";

const MODE = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" } as const;

/** Open listings for one company. `embed` opens links in a new tab and tags applications as coming from the widget. */
export function CareerList({ company, jobs, embed }: { company: Company; jobs: Opportunity[]; embed?: boolean }) {
  const src = embed ? "embed" : "careers";
  return jobs.length ? (
    <ul className="space-y-3">{jobs.map((o) => (
      <li key={o.id} className="card p-5">
        <Link href={`/${o.type === "CHALLENGE" ? "challenges" : "opportunities"}/${o.id}?src=${src}`} {...(embed ? { target: "_blank", rel: "noopener" } : {})} className="font-display text-lg font-bold underline-offset-2 hover:underline">{o.title}</Link>
        <p className="mt-1 text-sm text-ink-soft">{TYPE_LABEL[o.type]} · {MODE[o.workMode]} · {o.location}</p>
        <p className="text-sm text-ink-soft">{o.payText}{o.unpaid ? " (Unpaid)" : ""} · Eligibility: {o.eligibility}</p>
        <p className="text-xs text-ink-soft">Apply by {o.deadline.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" })}</p>
      </li>))}</ul>
  ) : <p className="text-ink-soft">{company.name} has no open roles right now. Check back soon.</p>;
}
