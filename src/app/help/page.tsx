import { Serif } from "@/components/ui/serif";
import type { Metadata } from "next";
import { PageHero, Block } from "@/components/pages/shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Help Centre" };
const faqs = [
  ["Is Kalwings free for students?", "Yes. Building a profile, learning and applying are free for students."],
  ["Who can see my email?", "No one by default. Your contact details stay private until you choose to share them."],
  ["Do badges guarantee a job?", "No. Badges show a skill backed by a defined assessment or evidence. Kalwings never promises a guaranteed job."],
  ["How are employers verified?", "Companies are reviewed by the Kalwings team before they can post roles or search talent."],
];
export default function Page() {
  return (
    <>
      <PageHero eyebrow="Help Centre" title={<>How can we <Serif>help</Serif>?</>} />
      <Block>
        <div className="max-w-3xl space-y-3">
          {faqs.map(([q, a]) => (<details key={q} className="card group p-5"><summary className="cursor-pointer font-display text-lg font-bold">{q}</summary><p className="mt-2 text-ink-soft">{a}</p></details>))}
          <p className="pt-4 text-ink-soft">Still stuck? Write to <a className="font-semibold text-accent underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> or use the <a className="font-semibold text-accent underline" href="/contact">contact form</a>.</p>
        </div>
      </Block>
    </>
  );
}
