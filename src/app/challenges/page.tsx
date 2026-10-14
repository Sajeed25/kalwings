import type { Metadata } from "next";
import { PageHero } from "@/components/pages/shell";
import { ChallengeSpotlight } from "@/components/home/challenge";
import { Block, FeatureGrid } from "@/components/pages/shell";
import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, SampleTag } from "@/components/ui/badge";
import { KIND_LABEL, STYLE_LABEL } from "@/lib/challenge-labels";

async function loadLive() {
  return db.challenge.findMany({
    where: { opportunity: { moderated: "VERIFIED", closedAt: null, deadline: { gt: new Date() }, company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } } },
    include: { opportunity: { include: { company: true } } }, orderBy: { createdAt: "desc" }, take: 30,
  });
}

export const metadata: Metadata = { title: "Challenges", description: "Solve real company problems and earn an interview through Kalwings' Challenge-to-Hire programme." };

export const dynamic = "force-dynamic";

export default async function Page() {
  let live: Awaited<ReturnType<typeof loadLive>> = [];
  try { live = await loadLive(); } catch (e) { console.error("[challenges] load failed:", e instanceof Error ? e.message : e); }
  return (
    <>
      <PageHero eyebrow="Challenge-to-Hire" title="Solve a real problem. Earn a real interview." lead="Companies post challenges. You build the answer. The best work gets fast-tracked to an interview — an interview, never a guaranteed job." />
      {live.length > 0 && (
        <Block>
          <h2 className="mb-6 text-3xl font-extrabold">Open challenges</h2>
          <ul className="grid gap-6 sm:grid-cols-2">{live.map((c) => (
            <li key={c.id} className="card card-hover p-6">
              <div className="flex flex-wrap gap-2"><Badge tone="spot">{KIND_LABEL[c.kind]}</Badge><Badge tone="accent">{STYLE_LABEL[c.style]}</Badge>{c.opportunity.company.isSample && <SampleTag />}</div>
              <h3 className="mt-3 text-xl"><Link href={`/challenges/${c.opportunityId}`} className="hover:underline">{c.opportunity.title}</Link></h3>
              <p className="text-sm text-ink-soft">{c.opportunity.company.name} · Verified employer ✓</p>
              <p className="mt-2 text-sm">{c.opportunity.payText}{c.opportunity.unpaid && " (Unpaid)"} · {c.opportunity.workMode.toLowerCase()} · {c.opportunity.location}</p>
              <p className="mt-1 text-sm text-ink-soft">Eligibility: {c.opportunity.eligibility} · closes {c.opportunity.deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</p>
            </li>))}</ul>
        </Block>)}
      <ChallengeSpotlight />
      <Block>
        <h2 className="mb-8 text-3xl font-extrabold">How a challenge runs</h2>
        <FeatureGrid items={[
          { t: "1. Read the brief", d: "Every challenge states the problem, eligibility, timeline and judging criteria up front." },
          { t: "2. Build and submit", d: "Submit your work to your Talent Card. Mentors can review and endorse against evidence." },
          { t: "3. Get evaluated", d: "A published rubric decides outcomes. Badges are only awarded for defined assessments." },
        ]} />
      </Block>
    </>
  );
}
