import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Block } from "@/components/pages/shell";
import { publicMentors } from "@/lib/public-data";
import { MentorDirectory } from "@/components/pages/mentor-directory";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Mentors", description: "Learn from industry mentors across India, Germany, Saudi Arabia and beyond." };

export const dynamic = "force-dynamic";

export default async function Page() {
  let items: Awaited<ReturnType<typeof publicMentors>> = [];
  let unavailable = false;
  try { items = await publicMentors(); } catch (e) { unavailable = true; console.error("[mentors] load failed:", e instanceof Error ? e.message : e); }
  return (
    <>
      <PageHero eyebrow="Mentor Network" title="Learn from people who've done it." lead="Book office hours, get portfolio reviews and earn endorsements that are backed by real work." />
      <Block>
        {unavailable && <p role="status" className="mb-6 rounded-xl border border-dashed border-line p-4 text-sm text-ink-soft">The mentor directory is temporarily unavailable. Please check back in a few minutes.</p>}
        <MentorDirectory items={items} />
      </Block>
      <Block className="bg-muted">
        <div id="become-a-mentor" className="mx-auto max-w-2xl scroll-mt-28 text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">Become a mentor</h2>
          <p className="mt-3 text-lg text-ink-soft">Share an hour a fortnight. Mentors are verified before they appear in the directory, and endorsements are only given against evidence.</p>
          <Button asChild size="lg" className="mt-6"><Link href="/join?role=mentor">Apply to mentor</Link></Button>
        </div>
      </Block>
    </>
  );
}
