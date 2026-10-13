import type { Metadata } from "next";
import { PageHero, Block, DraftNotice } from "@/components/pages/shell";
import { Recognition } from "@/components/home/rest";

export const metadata: Metadata = { title: "Press & Awards" };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Press & awards" title="Recognition, when it's earned." lead="We list only awards and coverage we can link to." />
      <Recognition />
      <Block><DraftNotice>Add real press coverage, awards and a downloadable press kit (logos, boilerplate, founder photos) here.</DraftNotice></Block>
    </>
  );
}
