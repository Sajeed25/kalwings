import { CompanyLogo } from "@/components/ui/company-logo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { SharePanel } from "@/components/share-panel";
import { shortUrl } from "@/lib/distribution";
import { Block } from "@/components/pages/shell";
import { Badge, SampleTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionForm, Area, Field } from "@/components/dash/action-form";
import { submitWork } from "@/app/actions/student";
import { KIND_LABEL, STYLE_HELP, STYLE_LABEL } from "@/lib/challenge-labels";

export const dynamic = "force-dynamic";

async function load(id: string) {
  return db.challenge.findFirst({
    where: { opportunityId: id, opportunity: { moderated: "VERIFIED", company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } } },
    include: { opportunity: { include: { company: true } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = await load((await params).id);
  return { title: c ? `${c.opportunity.title}: challenge by ${c.opportunity.company.name}` : "Challenge", robots: c && (c.opportunity.company.isSample || c.opportunity.closedAt || c.opportunity.deadline < new Date()) ? { index: false } : undefined };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await load(id);
  if (!c) notFound();
  const o = c.opportunity;
  const rubric = c.rubric as { criterion: string; max: number; description: string }[];
  const user = await getUser();
  const mine = user?.role === "STUDENT" ? await db.submission.findFirst({ where: { challengeId: c.id, student: { userId: user.id } } }) : null;
  const closed = !!o.closedAt || o.deadline < new Date();
  return (
    <Block>
      <Link href="/challenges" className="text-sm font-semibold text-accent">← All challenges</Link>
      <div className="mt-6 max-w-3xl">
        <div className="flex flex-wrap gap-2"><Badge tone="spot">{KIND_LABEL[c.kind]}</Badge><Badge tone="accent">{STYLE_LABEL[c.style]}</Badge>{c.allowTeams && <Badge>Teams allowed</Badge>}{o.company.isSample && <SampleTag />}</div>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{o.title}</h1>
        <p className="mt-3 flex items-center gap-3 text-lg text-ink-soft"><CompanyLogo name={o.company.name} logoId={o.company.logoId} className="h-10 w-10 rounded-xl" /><span><span className="serif-accent text-[1.2em] text-ink">{o.company.name}</span> · Verified employer ✓</span></p>
        <p className="mt-2 text-sm text-ink-soft">{STYLE_HELP[c.style]}</p>
        <dl className="card mt-8 grid gap-6 p-6 sm:grid-cols-2">
          {[["Reward", o.payText + (o.unpaid ? " (Unpaid)" : "")], ["Location", o.location], ["Work mode", o.workMode.toLowerCase()], ["Eligibility", o.eligibility], ["Deadline", o.deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })]].map(([k, v]) => (
            <div key={k}><dt className="text-sm text-ink-soft">{k}</dt><dd className="font-semibold">{v}</dd></div>))}
        </dl>
        <p className="mt-6 whitespace-pre-line text-ink-soft">{o.description}</p>
        <h2 className="mt-10 text-2xl">The brief</h2>
        <p className="mt-2 whitespace-pre-line">{c.brief}</p>
        <h2 className="mt-10 text-2xl">How it is judged</h2>
        <p className="mt-1 text-sm text-ink-soft">A human reviewer scores each criterion. Scores are advisory input to a hiring decision, not a verdict on your ability.</p>
        <table className="mt-3 w-full text-left text-sm"><thead><tr className="text-ink-soft"><th className="py-2 pr-4 font-semibold">Criterion</th><th className="pr-4 font-semibold">Points</th><th className="font-semibold">What good looks like</th></tr></thead>
          <tbody className="divide-y divide-line">{rubric.map((r) => <tr key={r.criterion}><td className="py-2 pr-4 font-semibold">{r.criterion}</td><td className="pr-4">{r.max}</td><td className="text-ink-soft">{r.description}</td></tr>)}</tbody></table>
        <p className="mt-4 text-sm text-ink-soft">Taking part doesn&apos;t guarantee an interview or offer.</p>
        <div className="mt-8">
          {closed ? <Badge>Submissions closed</Badge>
            : !user ? <><Button asChild size="lg"><Link href={`/login?next=${encodeURIComponent(`/challenges/${o.id}`)}`}>Log in to take part</Link></Button><Button asChild size="lg" variant="secondary"><Link href={`/join?role=STUDENT&next=${encodeURIComponent(`/challenges/${o.id}`)}`}>New here? Create a free account</Link></Button></>
            : user.role !== "STUDENT" ? <Badge>Only students can submit</Badge>
            : mine && mine.status !== "SUBMITTED" && mine.status !== "WITHDRAWN" ? <Badge tone="accent">Your submission was reviewed. See Submissions in your dashboard.</Badge>
            : (
              <section className="card p-6"><h2 className="text-xl">{mine && mine.status === "SUBMITTED" ? "Update your submission" : "Submit your work"}</h2>
                <ActionForm action={submitWork} submit={mine?.status === "SUBMITTED" ? "Update submission" : "Submit"} success="Submission saved" className="mt-4 space-y-4">
                  <input type="hidden" name="challengeId" value={c.id} />
                  <Field label="Title" name="title" defaultValue={mine?.title ?? ""} required maxLength={120} />
                  <Area label="Your approach" name="summary" defaultValue={mine?.summary ?? ""} required maxLength={1500} hint="What you built, key decisions and anything the reviewer should know." />
                  <Field label="Link to your work" name="workUrl" type="url" defaultValue={mine?.workUrl ?? ""} required hint="Repository, document, prototype or demo. Make sure the reviewer can open it." />
                  {c.allowTeams && <Field label="Team (optional)" name="teamNote" defaultValue={mine?.teamNote ?? ""} maxLength={300} hint="Names and roles. Self-declared; only the submitter's account is recorded." />}
                </ActionForm></section>)}
        </div>
      </div>
        {!closed && <SharePanel title={o.title} company={o.company.name} details={`Challenge · ${o.location} · ${o.payText}${o.unpaid ? " (Unpaid)" : ""} · Eligibility: ${o.eligibility}`} link={shortUrl(o)} heading="Share this challenge with friends" />}
    </Block>
  );
}
