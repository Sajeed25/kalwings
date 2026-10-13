import type { Metadata } from "next";
import { asList } from "@/lib/lists";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { Block } from "@/components/pages/shell";
import { Badge, SampleTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton, ActionForm, Area } from "@/components/dash/action-form";
import { applyTo, toggleSave } from "@/app/actions/student";
import { reportContent } from "@/app/actions/common";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
const MODE = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" } as const;

async function load(id: string) {
  return db.opportunity.findFirst({
    where: { id, moderated: "VERIFIED", company: { status: "VERIFIED", members: { none: { user: { suspendedAt: { not: null } } } } } },
    include: { company: true },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const o = await load((await params).id);
  return { title: o ? `${o.title} at ${o.company.name}` : "Opportunity", robots: o && (o.company.isSample || o.closedAt || o.deadline < new Date()) ? { index: false } : undefined };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await load(id);
  if (!o) notFound();
  const user = await getUser();
  let applied = false, saved = false;
  if (user?.role === "STUDENT") {
    const sp = await db.studentProfile.findUnique({ where: { userId: user.id } });
    if (sp) {
      applied = !!(await db.application.findUnique({ where: { opportunityId_studentId: { opportunityId: id, studentId: sp.id } } }));
      saved = !!(await db.savedOpportunity.findUnique({ where: { studentId_opportunityId: { studentId: sp.id, opportunityId: id } } }));
    }
  }
  const closed = !!o.closedAt || o.deadline < new Date();
  const ld = {
    "@context": "https://schema.org", "@type": "JobPosting", title: o.title, description: o.description, employmentType: o.type === "JOB" ? "FULL_TIME" : "INTERN",
    datePosted: o.createdAt.toISOString(), validThrough: o.deadline.toISOString(), hiringOrganization: { "@type": "Organization", name: o.company.name, sameAs: o.company.website },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: o.location, addressCountry: "IN" } }, jobLocationType: o.workMode === "REMOTE" ? "TELECOMMUTE" : undefined,
    url: `${site.url}/opportunities/${o.id}`,
  };
  return (
    <Block>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Link href="/opportunities" className="text-sm font-semibold text-teal-700 dark:text-teal">← All opportunities</Link>
      <div className="mt-6 max-w-3xl">
        <div className="flex gap-2"><Badge tone="teal">{o.type.toLowerCase()}</Badge>{o.company.isSample && <SampleTag />}</div>
        <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">{o.title}</h1>
        <p className="mt-2 text-lg text-ink-soft">{o.company.name} · Verified employer ✓</p>
        <dl className="card mt-8 grid gap-6 p-6 sm:grid-cols-2">
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
            : applied ? <Badge tone="teal">You&apos;ve applied — track it in your dashboard</Badge>
            : <ActionButton variant="primary" size="md" action={applyTo.bind(null, o.id)}>Apply with my Talent Card</ActionButton>}
          {user?.role === "STUDENT" && <ActionButton variant="secondary" size="md" action={toggleSave.bind(null, o.id)}>{saved ? "Saved ✓" : "Save role"}</ActionButton>}
        </div>
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
