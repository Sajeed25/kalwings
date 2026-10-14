import type { Metadata } from "next";
import { PageHero, Block } from "@/components/pages/shell";
import { Team } from "@/components/home/rest";
import { SOURCE, mentorCommunity, office, tracks } from "@/data/robokalam";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "About", description: "Kalwings is incubated at T-Hub, Hyderabad, and built by the team behind Robokalam and KodeZ." };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="About" title="Talent is everywhere. We build the proof." lead="Kalwings is a community-powered career platform for India's freshers, incubated at T-Hub, Hyderabad (2024)." />
      <Block>
        <div className="grid gap-10 md:grid-cols-2">
          <div><h2 className="text-3xl font-extrabold">Our story</h2><p className="mt-4 text-ink-soft">Kalwings comes from the team behind Robokalam, a DPIIT-recognised deep-tech EdTech company running STEM labs in India, Germany and Saudi Arabia, and KodeZ, its mentor-led programmes in Python / AI, Java and Web development. Robokalam received the “Tech For Good” award at T-Hub and its Robothon was supported by the Ministry of Education, Telangana. We kept meeting students who could build, and employers who could not see it. Kalwings is how we close that gap.</p></div>
          <div><h2 className="text-3xl font-extrabold">Our mission</h2><p className="mt-4 text-ink-soft">Make it possible for every fresher to be judged on what they can do, and for every employer to see it.</p></div>
        </div>
      </Block>
      <Team />
      <Block>
        <h2 className="text-3xl font-extrabold">Where students start: KodeZ programmes</h2>
        <ul className="mt-6 grid gap-6 md:grid-cols-3">
          {tracks.map((t) => (
            <li key={t.name} className="card p-6"><h3 className="text-xl">{t.name}</h3><p className="mt-1 text-sm text-ink-soft">{t.mode}</p><p className="mt-3">{t.includes}</p></li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-soft">Programme details as published by <a className="underline" href={SOURCE.url} rel="noopener">{SOURCE.label}</a>. Fees and batches are set by KodeZ.</p>
      </Block>
      <Block className="bg-muted">
        <div id="advisors" className="scroll-mt-28"><h2 className="text-3xl font-extrabold">Mentors and advisors</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {mentorCommunity.map((m) => (<li key={m.name} className="card p-5"><span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-black font-display font-bold text-white">{m.name[0]}</span><p className="mt-3 font-semibold leading-snug">{m.name}</p><p className="text-sm text-ink-soft">{m.role}</p></li>))}
          </ul></div>
        <div id="careers" className="mt-14 scroll-mt-28"><h2 className="text-3xl font-extrabold">Careers</h2><p className="mt-3 max-w-2xl text-ink-soft">We hire mentors, instructors and builders who care about freshers. We do not have a formal job board yet, so write to <a className="font-semibold text-accent underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> with what you would like to work on.</p></div>
        <div className="mt-14"><h2 className="text-3xl font-extrabold">Find us</h2>
          <p className="mt-3 text-ink-soft">{office.org}<br />{office.lines.map((l) => <span key={l}>{l}<br /></span>)}<a className="font-semibold text-accent underline" href={office.map} rel="noopener">Open in Google Maps</a></p></div>
      </Block>
    </>
  );
}
