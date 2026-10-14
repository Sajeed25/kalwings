import Link from "next/link";
import { Badge, PhotoPlaceholder, SampleTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Mentor } from "@/data/sample";

export function MentorCard({ m }: { m: Mentor }) {
  return (
    <article className="card card-hover flex h-full flex-col overflow-hidden">
      {m.photo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={m.photo} alt={`Photo of ${m.name}`} className="h-44 w-full object-cover" width={400} height={176} loading="lazy" />
        : <PhotoPlaceholder label="mentor" className="h-44" />}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl">{m.name}</h3>
          <span title={m.country} aria-label={m.country} className="text-xl">{m.flag}</span>
        </div>
        <p className="text-[15px] text-ink-soft">{m.role} · {m.company}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">{m.tags.map((t) => <li key={t}><Badge>{t}</Badge></li>)}</ul>
        <p className="mt-4 text-sm text-ink-soft">{m.guided > 0 ? <><span className="font-semibold text-ink">{m.guided}</span> students guided</> : "New mentor on Kalwings"}</p>
        <div className="mt-auto flex items-center gap-2 pt-5">
          <Button asChild size="sm" className="flex-1"><Link href={`/mentors/${m.slug}`}>{m.available ? "Book a session" : "View profile"}</Link></Button>
          {m.isSample !== false && <SampleTag />}
        </div>
      </div>
    </article>
  );
}
