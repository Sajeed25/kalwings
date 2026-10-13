import Link from "next/link";
import { ArrowRight, Award, Building2, GraduationCap, Newspaper, Users } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { PhotoPlaceholder, SampleTag } from "@/components/ui/badge";
import { WingMark } from "@/components/ui/wing";
import { communityGroups, stories } from "@/data/sample";

export function Community() {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Community</p>
          <h2 className="h-section mt-3">You don&apos;t have to figure it out alone.</h2>
          <p className="mt-4 text-lg text-ink-soft">College chapters, events and project teams — learning in public, together.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-4 md:grid-rows-2">
          <Reveal className="md:col-span-2 md:row-span-2"><PhotoPlaceholder label="community event" className="h-72 rounded-card md:h-full md:min-h-[420px]" /></Reveal>
          <Reveal delay={0.05} className="md:col-span-2"><PhotoPlaceholder label="college chapter" className="h-48 rounded-card md:h-full" /></Reveal>
          <Reveal delay={0.1}><PhotoPlaceholder label="student project" className="h-48 rounded-card md:h-full" /></Reveal>
          <Reveal delay={0.15}>
            <div className="card flex h-full min-h-48 flex-col justify-between p-6">
              <p className="eyebrow">Active groups</p>
              <ul className="space-y-1.5 text-[15px]">{communityGroups.map((g) => <li key={g.name} className="flex items-center gap-2"><Users className="h-4 w-4 text-ink-soft" aria-hidden />{g.name}</li>)}</ul>
            </div>
          </Reveal>
        </div>
        <div className="mt-10"><Button asChild size="lg"><Link href="/community">Join a chapter</Link></Button></div>
      </div>
    </section>
  );
}

export function Stories() {
  return (
    <section className="section bg-muted">
      <div className="container">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Success stories</p>
          <h2 className="h-section mt-3">From proof to offer.</h2>
        </Reveal>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {stories.map((s, i) => (
            <Reveal as="li" key={i} delay={i * 0.08}>
              <article className="card card-hover h-full overflow-hidden">
                <PhotoPlaceholder label="student photo" className="h-48" />
                <div className="p-6">
                  <SampleTag />
                  <h3 className="mt-3 text-xl">{s.name}</h3>
                  <p className="text-sm text-ink-soft">{s.college}</p>
                  <p className="mt-3 font-medium">{s.path}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
        <p className="mt-6 text-sm text-ink-soft">Replace with real, consented stories only. We don&apos;t publish invented testimonials.</p>
      </div>
    </section>
  );
}

export function Recognition() {
  // Add ONLY real, verifiable entries. T-Hub incubation is the one fact supplied by the founders.
  const items = [
    { Icon: Building2, t: "Incubated at T-Hub, Hyderabad", s: "2024" },
    { Icon: Award, t: "[Award — add only if real]", s: "[Year]", ph: true },
    { Icon: Newspaper, t: "[Press mention — add only if real]", s: "[Publication]", ph: true },
  ];
  return (
    <section className="py-16">
      <div className="container">
        <h2 className="text-center font-sans text-sm font-semibold tracking-normal text-ink-soft">Awards &amp; recognition</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {items.map(({ Icon, t, s, ph }) => (
            <li key={t} className={`card flex items-center gap-4 p-5 ${ph ? "border-dashed" : ""}`}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-saffron-50 text-saffron-700 dark:bg-saffron/15 dark:text-saffron"><Icon className="h-5 w-5" /></span>
              <div><p className="font-semibold leading-snug">{t}</p><p className="text-sm text-ink-soft">{s}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const audiences = [
  { Icon: GraduationCap, t: "For Students", d: "Free forever. Build a Talent Card, learn from mentors and apply with one click.", cta: "Build my profile", href: "/students" },
  { Icon: Building2, t: "For Employers", d: "Hire proven freshers. See the work, not just the résumé.", cta: "Start hiring", href: "/employers" },
  { Icon: Users, t: "For Colleges", d: "Run smarter placements with student proof and wider recruiter reach.", cta: "Partner with us", href: "/colleges" },
];

export function AudienceSplit() {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Who it&apos;s for</p>
          <h2 className="h-section mt-3">A platform with a place for everyone.</h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {audiences.map(({ Icon, t, d, cta, href }, i) => (
            <Reveal key={t} delay={i * 0.08}>
              <div className="card card-hover flex h-full flex-col p-8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy text-white"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-6 text-2xl">{t}</h3>
                <p className="mt-2 text-ink-soft">{d}</p>
                <Button asChild variant={i === 0 ? "primary" : "secondary"} className="mt-8 self-start"><Link href={href}>{cta} <ArrowRight className="h-4 w-4" /></Link></Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Team() {
  return (
    <section className="section bg-muted">
      <div className="container grid items-center gap-12 md:grid-cols-[320px_1fr]">
        <Reveal><PhotoPlaceholder label="Mohammed Sajeed Khan" className="aspect-[4/5] rounded-card-lg" /></Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow">The team behind Kalwings</p>
          <blockquote className="mt-4 font-display text-2xl font-bold leading-snug tracking-tight md:text-3xl">
            “[Founder note — draft for Sajeed to edit] For years we built STEM labs and skilling programmes through Robokalam and CareerKalam. We kept meeting students who could build — and employers who couldn&apos;t see it. Kalwings is how we close that gap.”
          </blockquote>
          <p className="mt-5 font-semibold">Mohammed Sajeed Khan</p>
          <p className="text-ink-soft">Co-founder, Kalwings</p>
          <p className="mt-4 text-[15px] text-ink-soft">Built by the team behind Robokalam (DPIIT-recognised deep-tech EdTech) and CareerKalam, and guided by mentors and advisors with global industry experience.</p>
          <Link href="/about#advisors" className="mt-5 inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline dark:text-teal">Meet our advisors <ArrowRight className="h-4 w-4" /></Link>
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-6 py-20 md:py-28">
      <Reveal>
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[32px] bg-brand-gradient px-8 py-20 text-center text-navy md:py-24">
          <WingMark className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 opacity-20 [&_*]:fill-white" />
          <h2 className="h-display relative !text-[2.5rem] md:!text-6xl">Show your work. Get hired.</h2>
          <p className="relative mx-auto mt-4 max-w-md text-lg text-navy/80">Free for students. Always.</p>
          <Button asChild variant="dark" size="lg" className="relative mt-8"><Link href="/join">Build my profile</Link></Button>
        </div>
      </Reveal>
    </section>
  );
}
