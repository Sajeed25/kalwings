import { TYPE_LABEL } from "@/lib/opportunity-types";
import type { Metadata } from "next";
import { asList } from "@/lib/lists";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { Block } from "@/components/pages/shell";
import { Badge, SampleTag } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/ui/company-logo";
import { Button } from "@/components/ui/button";
import { ActionButton, ActionForm, Area } from "@/components/dash/action-form";
import { applyTo, applyWithAnswers, toggleSave } from "@/app/actions/student";
import { reportContent } from "@/app/actions/common";
import { site } from "@/lib/site";
import { cleanSource } from "@/lib/distribution";

export const dynamic = "force-dynamic";
const MODE = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" } as const;

async function load(id: string) {
  return db.opportunity.findFirst({
    where: { id, moderated: "VERIFIED", company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } },
    include: { company: true, questions: { orderBy: { position: "asc" } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const o = await load((await params).id);
  return { title: o ? `${o.title} at ${o.company.name}` : "Opportunity", robots: o && (o.company.isSample || o.closedAt || o.deadline < new Date()) ? { index: false } : undefined };
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ src?: string; ref?: string }> }) {
  const { id } = await params;
  const { src, ref } = await searchParams;
  const o = await load(id);
  if (!o) notFound();
  if (o.type === "CHALLENGE") redirect(`/challenges/${o.id}`);
  const user = await getUser();
  let applied = false, saved = false, myId: string | null = null;
  if (user?.role === "STUDENT") {
    const sp = await db.studentProfile.findUnique({ where: { userId: user.id } });
    if (sp) {
      myId = sp.id;
      applied = !!(await db.application.findUnique({ where: { opportunityId_studentId: { opportunityId: id, studentId: sp.id } } }));
      saved = !!(await db.savedOpportunity.findUnique({ where: { studentId_opportunityId: { studentId: sp.id, opportunityId: id } } }));
    }
  }
  const closed = !!o.closedAt || o.deadline < new Date();
  const ld = {
    "@context": "https://schema.org", "@type": "JobPosting", title: o.title, description: o.description, employmentType: ["JOB","GRADUATE_TRAINEE","CAMPUS"].includes(o.type) ? "FULL_TIME" : o.type === "FREELANCE" ? "CONTRACTOR" : "INTERN",
    datePosted: o.createdAt.toISOString(), validThrough: o.deadline.toISOString(), hiringOrganization: { "@type": "Organization", name: o.company.name, sameAs: o.company.website },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: o.location, addressCountry: "IN" } }, jobLocationType: o.workMode === "REMOTE" ? "TELECOMMUTE" : undefined,
    url: `${site.url}/opportunities/${o.id}`, identifier: { "@type": "PropertyValue", name: o.company.name, value: o.id }, directApply: true,
    baseSalary: !o.unpaid && o.monthlyINR > 0 ? { "@type": "MonetaryAmount", currency: "INR", value: { "@type": "QuantitativeValue", value: o.monthlyINR, unitText: "MONTH" } } : undefined,
  };
  return (
    <Block>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Link href="/opportunities" className="text-sm font-semibold text-accent">← All opportunities</Link>
      <div className="mt-6 max-w-3xl">
        <div className="flex items-center gap-4"><CompanyLogo name={o.company.name} logoId={o.company.logoId} className="h-16 w-16" /><div className="flex flex-wrap gap-2"><Badge tone="accent">{TYPE_LABEL[o.type]}</Badge>{o.company.isSample && <SampleTag />}</div></div>
        <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">{o.title}</h1>
        <p className="mt-3 text-lg text-ink-soft"><span className="serif-accent text-[1.2em] text-ink">{o.company.name}</span> · Verified employer ✓</p>
        <dl className="card mt-8 grid gap-6 p-7 sm:grid-cols-2">
          {[["Pay", o.payText + (o.unpaid ? " (Unpaid)" : "")], ["Location", o.location], ["Work mode", MODE[o.workMode]], ["Eligibility", o.eligibility], ["Deadline", o.deadline.toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" })], ["Skills", asList(o.skills).join(", ") || "—"]].map(([k, v]) => (
            <div key={k}><dt className="text-sm text-ink-soft">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-6 whitespace-pre-line text-ink-soft">{o.description}</p>
        <p className="mt-4 text-sm text-ink-soft">Applying doesn&apos;t guarantee an interview or offer.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {closed ? <Badge>Applications closed</Badge>
            : !user ? <Button asChild size="lg"><Link href="/login">Log in to apply</Link></Button>
            : user.role !== "STUDENT" ? <Badge>Only students can apply</Badge>
            : applied ? <Badge tone="accent">You&apos;ve applied — track it in your dashboard</Badge>
            : o.questions.length > 0 ? null
            : <ActionButton variant="primary" size="md" action={applyTo.bind(null, o.id, cleanSource(src) ?? undefined, typeof ref === "string" ? ref.slice(0, 40) : undefined)}>Apply with my Talent Card</ActionButton>}
          {user?.role === "STUDENT" && <ActionButton variant="secondary" size="md" action={toggleSave.bind(null, o.id)}>{saved ? "Saved ✓" : "Save role"}</ActionButton>}
          {user?.role === "STUDENT" && <Link href={`/dashboard/copilot?listing=${o.id}`} className="text-sm font-semibold text-accent underline">How well do I match?</Link>}
        </div>
        {user?.role === "STUDENT" && !applied && !closed && o.questions.length > 0 && (
          <ActionForm action={applyWithAnswers.bind(null, o.id, cleanSource(src) ?? undefined, typeof ref === "string" ? ref.slice(0, 40) : undefined)} submit="Apply with my Talent Card" success="Applied" className="mt-6 max-w-xl space-y-3">
            <h2 className="text-lg font-bold">A few questions from {o.company.name}</h2>
            {o.questions.map((q) => <Area key={q.id} label={q.text} name={`q_${q.id}`} required maxLength={1000} />)}
            <p className="text-xs text-ink-soft">Your answers are read by the hiring team. They are not scored by software.</p>
          </ActionForm>
        )}
        {myId && !closed && <p className="mt-6 text-sm text-ink-soft">Know someone who fits? Share your referral link: <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs">{`${site.url}/opportunities/${o.id}?ref=${myId}`}</code>. The employer will see that you referred them. It doesn&apos;t change how anyone is assessed.</p>}
        {user && (
          <details className="mt-10 text-sm"><summary className="cursor-pointer font-semibold text-ink-soft">Report this listing</summary>
            <ActionForm action={reportContent} reset submit="Send report" success="Thanks — our team will review it." className="mt-3 max-w-md space-y-3">
              <input type="hidden" name="targetType" value="OPPORTUNITY" /><input type="hidden" name="targetId" value={o.id} />
              <Area label="What's wrong?" name="reason" required minLength={10} maxLength={500} />
            </ActionForm></details>
        )}
      </div>
    </Block>
  );
}
