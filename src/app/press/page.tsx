import type { Metadata } from "next";
import { PageHero, Block } from "@/components/pages/shell";
import { LEGAL } from "@/lib/legal";
import { Recognition } from "@/components/home/rest";

export const metadata: Metadata = { title: "Press & Awards" };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Press & awards" title="Recognition, when it's earned." lead="We list only awards and coverage we can link to." />
      <Recognition />
      <Block><h2 className="text-2xl font-extrabold">Press enquiries</h2><p className="mt-3 max-w-2xl text-ink-soft">For interviews, data requests or logos, write to <a className="font-semibold text-accent underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. We will add links to coverage here as it is published.</p></Block>
    </>
  );
}
