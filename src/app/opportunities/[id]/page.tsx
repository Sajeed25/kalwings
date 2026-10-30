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
import { applyWithAnswers, toggleSave } from "@/app/actions/student";
import { reportContent } from "@/app/actions/common";
import { site } from "@/lib/site";
import { cleanSource, shortUrl } from "@/lib/distribution";
import { SharePanel } from "@/components/share-panel";
import { liveProfileScore } from "@/lib/profile-score";
import { googleCalendarUrl, mapsUrl } from "@/lib/calendar";
import { learningLinks } from "@/lib/learn";

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
  const desc = o ? `${TYPE_LABEL[o.type]} · ${o.location} · ${MODE[o.workMode]} · ${o.payText}${o.unpaid ? " (Unpaid)" : ""} · Eligibility: ${o.eligibility}` : undefined;
  return { title: o ? `${o.title} at ${o.company.name}` : "Opportunity", description: desc, openGraph: o ? { title: `${o.title} at ${o.company.name}`, description: desc } : undefined, robots: o && (o.company.isSample || o.closedAt || o.deadline < new Date()) ? { index: false } : undefined };
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ src?: string; ref?: string }> }) {
  const { id } = await params;
  const { src, ref } = await searchParams;
  const o = await load(id);
  if (!o) notFound();
  if (o.type === "CHALLENGE") redirect(`/challenges/${o.id}`);
  const user = await getUser();
  let applied = false, saved = false, myId: string | null = null, resume: { name: string } | null = null, canShareVideo = false, hasVideoUnlocked = false;
  if (user?.role === "STUDENT") {
    const sp = await db.studentProfile.findUnique({ where: { userId: user.id } });
    if (sp) {
      myId = sp.id;
      if (sp.resumeId) resume = { name: sp.resumeName ?? "Resume" };
      if (sp.introVideoId && (await liveProfileScore(sp.id)).score >= 100) canShareVideo = true;
      hasVideoUnlocked = !!sp.introVideoId;
      applied = !!(await db.application.findUnique({ where: { opportunityId_studentId: { opportunityId: id, studentId: sp.id } } }));
      saved = !!(await db.savedOpportunity.findUnique({ where: { studentId_opportunityId: { studentId: sp.id, opportunityId: id } } }));
    }
  }
  const closed = !!o.closedAt || o.deadline < new Date();
  const prep = asList(o.skills).map((skill) => ({ skill, links: learningLinks(skill) })).filter((x) => x.links.length > 0).slice(0, 4);
  const qs = [src ? `src=${encodeURIComponent(src)}` : "", ref ? `ref=${encodeURIComponent(ref)}` : ""].filter(Boolean).join("&");
  const here = `/opportunities/${o.id}${qs ? `?${qs}` : ""}`;
  const enc = encodeURIComponent(here);
  const details = `${TYPE_LABEL[o.type]} · ${o.location} · ${MODE[o.workMode]} · ${o.payText}${o.unpaid ? " (Unpaid)" : ""} · Eligibility: ${o.eligibility} · Apply by ${o.deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}`;
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
        {!closed && (
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <a href={googleCalendarUrl({ uid: `deadline-${o.id}`, title: `Apply by today: ${o.title} at ${o.company.name}`, start: o.deadline, allDay: true, location: o.location, description: `${o.payText}${o.unpaid ? " (unpaid)" : ""} · Eligibility: ${o.eligibility}`, url: shortUrl(o) })} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">Remind me: add the deadline to Google Calendar</a>
            <a href={`/api/opportunities/${o.id}/ics`} className="font-semibold text-accent underline">Calendar file (.ics)</a>
            {o.workMode !== "REMOTE" && <a href={mapsUrl(o.location)} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">View {o.location} on map</a>}
          </p>)}
        {prep.length > 0 && (
          <section aria-label="Prepare for this role" className="mt-6 rounded-card border border-line p-5"><h2 className="text-lg font-bold">Prepare for this role (free resources)</h2>
            <ul className="mt-2 space-y-1 text-sm">{prep.map((p) => <li key={p.skill}><b>{p.skill}:</b> {p.links.map((r, i) => <span key={r.url}>{i > 0 && ", "}<a href={r.url} target="_blank" rel="noopener noreferrer" className="text-accent underline">{r.label}</a></span>)}</li>)}</ul>
            <p className="mt-2 text-xs text-ink-soft">Free, public sources we picked. Kalwings earns nothing from these links.</p></section>)}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {closed ? <Badge>Applications closed</Badge>
            : !user ? <><Button asChild size="lg"><Link href={`/login?next=${enc}`}>Log in to apply</Link></Button><Button asChild size="lg" variant="secondary"><Link href={`/join?role=STUDENT&next=${enc}`}>New here? Create a free account</Link></Button></>
            : user.role !== "STUDENT" ? <Badge>Only students can apply</Badge>
            : applied ? <Badge tone="accent">You&apos;ve applied — track it in your dashboard</Badge>
            : null}
          {user?.role === "STUDENT" && <ActionButton variant="secondary" size="md" action={toggleSave.bind(null, o.id)}>{saved ? "Saved ✓" : "Save role"}</ActionButton>}
          {user?.role === "STUDENT" && <Link href={`/dashboard/copilot?listing=${o.id}`} className="text-sm font-semibold text-accent underline">How well do I match?</Link>}
        </div>
        {!user && !closed && <p className="mt-3 text-sm text-ink-soft">It takes a minute: enter your email, type the code we send, and you come straight back to this page. No password.</p>}
        {user?.role === "STUDENT" && !applied && !closed && (
          <ActionForm action={applyWithAnswers.bind(null, o.id, cleanSource(src) ?? undefined, typeof ref === "string" ? ref.slice(0, 40) : undefined)} submit="Apply with my Talent Card" success="Applied" className="mt-6 max-w-xl space-y-3">
            {o.questions.length > 0 && <><h2 className="text-lg font-bold">A few questions from {o.company.name}</h2>
              {o.questions.map((q) => <Area key={q.id} label={q.text} name={`q_${q.id}`} required maxLength={1000} />)}
              <p className="text-xs text-ink-soft">Your answers are read by the hiring team. They are not scored by software.</p></>}
            <fieldset className="rounded-xl border border-line p-4"><legend className="px-1 text-sm font-semibold">What {o.company.name} receives</legend>
              <p className="text-sm text-ink-soft">Your Talent Card is always sent. You choose the rest:</p>
              {resume
                ? <label className="mt-2 flex items-start gap-2 text-sm"><input type="checkbox" name="attachResume" defaultChecked className="mt-1 h-4 w-4" /><span>Attach my resume <b>{resume.name}</b> <Link href={`/dashboard/resume?next=${enc}`} className="text-accent underline">change</Link></span></label>
                : <p className="mt-2 text-sm text-ink-soft">No resume on file. <Link href={`/dashboard/resume?next=${enc}`} className="font-semibold text-accent underline">Add your resume</Link> (PDF, DOC, DOCX or RTF) so they can download it. You can also apply without one.</p>}
              {canShareVideo
                ? <label className="mt-2 flex items-start gap-2 text-sm"><input type="checkbox" name="shareIntro" className="mt-1 h-4 w-4" /><span>Share my selfie introduction with {o.company.name} so they can hear how I communicate</span></label>
                : <p className="mt-2 text-sm text-ink-soft">{hasVideoUnlocked ? "Finish your profile to 100% to share your intro video." : <>A selfie introduction lets employers hear you. <Link href="/dashboard/resume" className="font-semibold text-accent underline">Unlocks at a 100% profile</Link>.</>}</p>}
            </fieldset>
          </ActionForm>
        )}
        {!closed && <SharePanel title={o.title} company={o.company.name} details={details} link={shortUrl(o)} refId={myId ?? undefined} heading={applied ? "You've applied. Know someone who fits?" : "Share this with friends who might fit"} />}
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
