import type { Metadata } from "next";
import { PageHero, Block, DraftNotice } from "@/components/pages/shell";

export const metadata: Metadata = { title: "Help Centre" };
const faqs = [
  ["Is Kalwings free for students?", "Yes. Building a profile, learning and applying are free for students."],
  ["Who can see my phone number and email?", "No one by default. Your contact details stay private until you choose to share them."],
  ["Do badges guarantee a job?", "No. Badges show a skill backed by a defined assessment or evidence. Kalwings never promises a guaranteed job."],
  ["How are employers verified?", "Companies are reviewed by the Kalwings team before they can post roles or search talent."],
];
export default function Page() {
  return (
    <>
      <PageHero eyebrow="Help Centre" title="How can we help?" />
      <Block>
        <div className="max-w-3xl space-y-3">
          {faqs.map(([q, a]) => (<details key={q} className="card group p-5"><summary className="cursor-pointer font-display text-lg font-bold">{q}</summary><p className="mt-2 text-ink-soft">{a}</p></details>))}
          <div className="pt-4"><DraftNotice>Draft answers — review for accuracy before launch.</DraftNotice></div>
        </div>
      </Block>
    </>
  );
}
