import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/pages/shell";
import { Community } from "@/components/home/rest";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Community", description: "College chapters, events and project teams — learning in public, together." };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Community" title="Builders helping builders." lead="Join a chapter, find a study group and ship projects with people who push you forward.">
        <Button asChild size="lg"><Link href="/join">Join a chapter</Link></Button>
      </PageHero>
      <Community />
    </>
  );
}
