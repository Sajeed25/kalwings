import { Serif } from "@/components/ui/serif";
import { CompanyLogo } from "@/components/ui/company-logo";
import type { Metadata } from "next";
import { PageHero } from "@/components/pages/shell";
import { Block } from "@/components/pages/shell";
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

export const metadata: Metadata = { title: "Challenges", description: "Solve real company problems and earn an interview through Kalwings." };

export const dynamic = "force-dynamic";

export default async function Page() {
  let live: Awaited<ReturnType<typeof loadLive>> = [];
  try { live = await loadLive(); } catch (e) { console.error("[challenges] load failed:", e instanceof Error ? e.message : e); }
  return (
    <>
      <PageHero eyebrow="Challenges" title={<>Solve a real <Serif>problem</Serif>. Earn a real interview.</>} lead="Companies post challenges. You build the answer. The best work gets fast-tracked to an interview — an interview, never a guaranteed job." />
      {live.length > 0 && (
        <Block>
          <h2 className="mb-6 text-2xl font-semibold">Open challenges</h2>
          <ul className="grid gap-6 sm:grid-cols-2">{live.map((c) => (
            <li key={c.id} className="card card-hover p-6">
              <div className="flex flex-wrap gap-2"><Badge tone="spot">{KIND_LABEL[c.kind]}</Badge><Badge tone="accent">{STYLE_LABEL[c.style]}</Badge>{c.opportunity.company.isSample && <SampleTag />}</div>
              <div className="mt-3 flex items-center gap-3"><CompanyLogo name={c.opportunity.company.name} logoId={c.opportunity.company.logoId} /><h3 className="text-xl font-bold"><Link href={`/challenges/${c.opportunityId}`} className="hover:underline">{c.opportunity.title}</Link></h3></div>
              <p className="text-sm text-ink-soft">{c.opportunity.company.name} · Verified employer ✓</p>
              <p className="mt-2 text-sm">{c.opportunity.payText}{c.opportunity.unpaid && " (Unpaid)"} · {c.opportunity.workMode.toLowerCase()} · {c.opportunity.location}</p>
              <p className="mt-1 text-sm text-ink-soft">Eligibility: {c.opportunity.eligibility} · closes {c.opportunity.deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</p>
            </li>))}</ul>
        </Block>)}
      {live.length === 0 && <Block><p className="max-w-2xl text-ink-soft">No challenge is open right now. When an employer posts one, it appears here with the brief, eligibility, deadline and the rubric it will be judged on.</p></Block>}
      <Block>
        <h2 className="mb-6 text-2xl font-semibold">How a challenge runs</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[["1. Read the brief", "Every challenge states the problem, eligibility, timeline and judging criteria up front."], ["2. Build and submit", "Submit your work to your profile. Mentors can review and endorse against evidence."], ["3. Get evaluated", "A person scores it against the published rubric. Badges are only awarded for defined assessments."]].map(([t, d]) => (
            <li key={t} className="card p-6"><h3 className="text-lg">{t}</h3><p className="mt-2 text-ink-soft">{d}</p></li>
          ))}
        </ol>
      </Block>
    </>
  );
}
