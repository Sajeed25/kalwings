import Link from "next/link";
import { Quote } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Badge, PhotoPlaceholder, SampleTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mentorOfTheMonth, mentors, type Mentor } from "@/data/sample";

export function MentorCard({ m }: { m: Mentor }) {
  return (
    <article className="card card-hover flex h-full flex-col overflow-hidden">
      <PhotoPlaceholder label="mentor" className="h-44" />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl">{m.name}</h3>
          <span title={m.country} aria-label={m.country} className="text-xl">{m.flag}</span>
        </div>
        <p className="text-[15px] text-ink-soft">{m.role} · {m.company}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">{m.tags.map((t) => <li key={t}><Badge>{t}</Badge></li>)}</ul>
        <p className="mt-4 text-sm text-ink-soft"><span className="font-semibold text-ink">{m.isSample === undefined && m.guided === 0 ? "[X]" : m.guided}</span> students guided</p>
        <div className="mt-auto flex items-center gap-2 pt-5">
          <Button asChild size="sm" className="flex-1"><Link href={`/mentors/${m.slug}`}>{m.available ? "Book a session" : "View profile"}</Link></Button>
          {m.isSample !== false && <SampleTag />}
        </div>
      </div>
    </article>
  );
}

export function MentorWall() {
  const { mentor, quote } = mentorOfTheMonth;
  return (
    <section className="section">
      <div className="container">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Mentor Wall</p>
            <h2 className="h-section mt-3">Learn from people who&apos;ve done it.</h2>
          </div>
          <Button asChild variant="secondary"><Link href="/mentors#become-a-mentor">Become a mentor</Link></Button>
        </Reveal>

        <Reveal className="mt-12">
          <figure className="relative overflow-hidden rounded-card-lg border border-saffron/40 bg-saffron-50 p-8 dark:bg-saffron/10 md:p-10">
            <div className="grid items-center gap-8 md:grid-cols-[220px_1fr]">
              <PhotoPlaceholder label="Mentor of the Month" className="h-52 rounded-2xl" />
              <div>
                <Badge tone="saffron">★ Mentor of the Month · Sample</Badge>
                <blockquote className="mt-4 font-display text-2xl font-bold leading-snug tracking-tight text-navy dark:text-ink md:text-3xl">
                  <Quote aria-hidden className="mb-2 h-6 w-6 text-saffron-700 dark:text-saffron" />
                  {quote}
                </blockquote>
                <figcaption className="mt-4 text-[15px] text-ink-soft">{mentor.name} · {mentor.role}, {mentor.company}</figcaption>
              </div>
            </div>
          </figure>
        </Reveal>

        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m, i) => (<Reveal as="li" key={m.slug} delay={(i % 3) * 0.07}><MentorCard m={m} /></Reveal>))}
        </ul>
      </div>
    </section>
  );
}
