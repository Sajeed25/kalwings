import Link from "next/link";
import { ArrowRight, Award, Building2, GraduationCap, MessagesSquare, Users, Video, ListChecks, BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/brand";
import { SOURCE, alumniStories, recognitions } from "@/data/robokalam";

const learning = [
  { Icon: Video, t: "Live learning", d: "Learn live with educators, chat with teachers and other attendees, and get your doubts cleared." },
  { Icon: MessagesSquare, t: "Community & networking", d: "Exclusive chat groups to discuss with peers and instructors, and to meet people from different backgrounds." },
  { Icon: ListChecks, t: "Practice tests", d: "Quizzes and live tests to practise what you learned and track your performance." },
  { Icon: BadgeCheck, t: "Certificates", d: "Course certificates you can add to your LinkedIn profile." },
];

export function Community() {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Community</p>
          <h2 className="h-section mt-3">You don&apos;t have to figure it out alone.</h2>
          <p className="mt-4 text-lg text-ink-soft">Mentor-led, hands-on learning and chat groups, from the KodeZ programmes in Hyderabad.</p>
        </Reveal>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {learning.map(({ Icon, t, d }, i) => (
            <Reveal as="li" key={t} delay={i * 0.06}>
              <div className="card h-full p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-spot/10 text-spot"><Icon className="h-5 w-5" aria-hidden /></span><h3 className="mt-4 text-lg">{t}</h3><p className="mt-2 text-[15px] text-ink-soft">{d}</p></div>
            </Reveal>
          ))}
        </ul>
        <div className="mt-10"><Button asChild size="lg"><Link href="/community">Join the community</Link></Button></div>
      </div>
    </section>
  );
}

export function Stories() {
  return (
    <section className="section bg-muted">
      <div className="container">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Alumni voices</p>
          <h2 className="h-section mt-3">From proof to offer.</h2>
          <p className="mt-4 text-lg text-ink-soft">What KodeZ learners say about the work that got them hired.</p>
        </Reveal>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {alumniStories.map((s, i) => (
            <Reveal as="li" key={s.name} delay={i * 0.08}>
              <figure className="card card-hover flex h-full flex-col p-6">
                <blockquote className="flex-1 font-medium leading-relaxed">“{s.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-black font-display font-bold text-white">{s.name[0]}</span>
                  <span><span className="block font-semibold">{s.name}</span><span className="text-sm text-ink-soft">KodeZ alumni · {s.where}</span></span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
        <p className="mt-6 text-sm text-ink-soft">Quotes as published by <a className="underline" href={SOURCE.url} rel="noopener">{SOURCE.label}</a>. Placement support is not a guarantee of a job.</p>
      </div>
    </section>
  );
}

export function Recognition() {
  return (
    <section className="py-16">
      <div className="container">
        <h2 className="text-center font-sans text-sm font-semibold tracking-normal text-ink-soft">Awards &amp; recognition</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {recognitions.map(({ t, s }, i) => (
            <li key={t} className="card flex items-center gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-spot/10 text-spot">{i === 0 ? <Building2 className="h-5 w-5" /> : <Award className="h-5 w-5" />}</span>
              <div><p className="font-semibold leading-snug">{t}</p><p className="text-sm text-ink-soft">{s}</p></div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs text-ink-soft">Awards other than T-Hub incubation are those of Robokalam, as listed on <a className="underline" href={SOURCE.url} rel="noopener">{SOURCE.label}</a>.</p>
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
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-black text-white"><Icon className="h-6 w-6" /></span>
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
        <Reveal><div aria-hidden className="grid aspect-[4/5] place-items-center rounded-card-lg bg-black font-display text-8xl font-extrabold text-white">MS</div></Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow">The team behind Kalwings</p>
          <h2 className="mt-4 font-display text-2xl font-bold leading-snug tracking-tight md:text-3xl">Students who can build, and employers who can&apos;t see it yet. Kalwings closes that gap.</h2>
          <p className="mt-5 font-semibold">Mohammed Sajeed Khan</p>
          <p className="text-ink-soft">Co-founder, Kalwings · Program Instructor, KodeZ</p>
          <p className="mt-4 text-[15px] text-ink-soft">Built by the team behind Robokalam (DPIIT-recognised deep-tech EdTech running STEM labs) and KodeZ, the mentor-led Python / AI, Java and Web programmes in Hyderabad, with mentors and advisors from industry.</p>
          <Link href="/about#advisors" className="mt-5 inline-flex items-center gap-1 font-semibold text-accent hover:underline ">Meet our mentors and advisors <ArrowRight className="h-4 w-4" /></Link>
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-6 py-20 md:py-28">
      <Reveal>
        <div className="on-dark relative mx-auto max-w-[1200px] overflow-hidden rounded-card-lg border border-line bg-black px-8 py-20 text-center text-white md:py-24">
          <div aria-hidden className="rule-gradient absolute inset-x-0 top-0" />
          <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
          <LogoMark className="pointer-events-none absolute -right-6 -top-8 hidden h-64 opacity-[0.12] md:block" />
          <h2 className="h-display relative !text-[2rem] md:!text-5xl">Show your work. <span className="text-accent">Get hired.</span></h2>
          <p className="relative mx-auto mt-4 max-w-md text-lg text-white/70">Free for students. Always.</p>
          <Button asChild size="lg" className="relative mt-8"><Link href="/join">Build my profile</Link></Button>
        </div>
      </Reveal>
    </section>
  );
}
