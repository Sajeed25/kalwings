import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Block, FeatureGrid } from "@/components/pages/shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "For Students", description: "Free forever. Build a proof-of-skill Talent Card, learn from mentors and apply with one click." };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="For students" title="Free forever. Proof that's yours." lead="Third-year, final-year or recently graduated — build a Talent Card employers can trust." >
        <Button asChild size="lg"><Link href="/join">Build my profile</Link></Button>
      </PageHero>
      <Block>
        <FeatureGrid items={[
          { t: "Proof-of-Skill profile", d: "Projects, GitHub, demos, certificates and assessed skills in one shareable Talent Card with a QR code." },
          { t: "Private by default", d: "Your phone and email stay hidden until you choose to share them with an employer." },
          { t: "Apply in one click", d: "Track every application from Applied to Offer, save roles and get notified." },
          { t: "Learn with mentors", d: "Request sessions with verified mentors and earn endorsements." },
          { t: "Challenges", d: "Solve real company problems and get noticed for what you can do." },
          { t: "Community", d: "Join a college chapter and learn with people on the same journey." },
        ]} />
      </Block>
    </>
  );
}
