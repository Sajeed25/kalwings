import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Block, FeatureGrid } from "@/components/pages/shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "For Colleges", description: "Run smarter placements with student proof and wider recruiter reach." };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="For colleges" title="Run smarter placements." lead="Give every student a Talent Card and put your campus in front of more recruiters.">
        <Button asChild size="lg"><Link href="/contact?topic=college">Partner with us</Link></Button>
      </PageHero>
      <Block>
        <FeatureGrid items={[
          { t: "College dashboard", d: "See student progress, profile completeness and application activity across your campus." },
          { t: "Wider recruiter reach", d: "Verified employers can discover your students through proof, not pedigree." },
          { t: "Chapters & events", d: "Start a Kalwings chapter, host challenges and run mentor sessions on campus." },
        ]} />
      </Block>
    </>
  );
}
