import type { Metadata } from "next";
import { PageHero, Block, DraftNotice } from "@/components/pages/shell";
import { Team } from "@/components/home/rest";

export const metadata: Metadata = { title: "About", description: "Kalwings is incubated at T-Hub, Hyderabad, and built by the team behind Robokalam and CareerKalam." };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="About" title="Talent is everywhere. We build the proof." lead="Kalwings is a community-powered career platform for India's freshers, incubated at T-Hub, Hyderabad (2024)." />
      <Block>
        <div className="grid gap-10 md:grid-cols-2">
          <div><h2 className="text-3xl font-extrabold">Our story</h2><p className="mt-4 text-ink-soft">Kalwings comes from the team behind Robokalam — a DPIIT-recognised deep-tech EdTech company running STEM labs in India, Germany and Saudi Arabia — and CareerKalam, focused on student placement. [Expand with the founders&apos; own words.]</p></div>
          <div><h2 className="text-3xl font-extrabold">Our mission</h2><p className="mt-4 text-ink-soft">Make it possible for every fresher to be judged on what they can do — and for every employer to see it.</p></div>
        </div>
      </Block>
      <Team />
      <Block>
        <div id="advisors" className="scroll-mt-28"><h2 className="text-3xl font-extrabold">Advisors</h2>
          <div className="mt-4 max-w-2xl"><DraftNotice>Add advisors by name, photo and affiliation — only with their consent.</DraftNotice></div></div>
        <div id="careers" className="mt-14 scroll-mt-28"><h2 className="text-3xl font-extrabold">Careers</h2><p className="mt-3 text-ink-soft">[Add open roles, or a note on how to reach the team.]</p></div>
      </Block>
    </>
  );
}
