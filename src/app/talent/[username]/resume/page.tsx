import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { asList } from "@/lib/lists";
import { site } from "@/lib/site";
import { canSee, canonicalKey, getViewer, KIND_LABEL, loadPassport } from "@/lib/passport";
import { PrintButton } from "@/components/passport/print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resume", robots: { index: false, follow: false } };

/** Recruiter-friendly resume built from the Passport and honouring its privacy settings. Use the browser's Print → Save as PDF. */
export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const p = await loadPassport(username);
  if (!p) notFound();
  const key = canonicalKey(p);
  if (username !== key) redirect(`/talent/${key}/resume`);
  const v = await getViewer(p.user.id);
  if (!canSee(p.passportVisibility, v)) notFound();
  const entries = canSee(p.entriesVisibility, v) ? p.entries.filter((e) => e.status !== "REJECTED") : [];
  const projects = canSee(p.projectsVisibility, v) ? p.projects : [];
  const claimed = asList(p.skillsClaimed);
  const sec = "mt-6 border-b border-line pb-1 text-sm font-bold uppercase tracking-widest";
  return (
    <div className="container max-w-3xl py-10">
      <div className="no-print mb-6 flex items-center justify-between"><Link href={`/talent/${key}`} className="text-sm font-semibold text-accent underline">← Back to Passport</Link><PrintButton /></div>
      <article className="card p-8 print:border-0 print:p-0">
        <h1 className="text-3xl font-extrabold">{p.user.name}</h1>
        <p className="mt-1">{p.headline}</p>
        <p className="text-sm text-ink-soft">{[p.college?.name, p.city, p.graduationYear && `Class of ${p.graduationYear}`].filter(Boolean).join(" · ")}</p>
        <p className="text-sm text-ink-soft">{site.url}/talent/{key}{p.githubUrl && ` · ${p.githubUrl}`}</p>
        {p.bio && <p className="mt-4 text-sm">{p.bio}</p>}
        {(p.skills.length > 0 || claimed.length > 0) && <><h2 className={sec}>Skills</h2>
          {p.skills.length > 0 && <p className="mt-2 text-sm"><b>Evidence-backed:</b> {p.skills.map((s) => s.skill).join(", ")}</p>}
          {claimed.length > 0 && <p className="mt-1 text-sm"><b>Self-declared:</b> {claimed.join(", ")}</p>}</>}
        {(Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k) => {
          const list = entries.filter((e) => e.kind === k);
          return list.length ? <div key={k}><h2 className={sec}>{KIND_LABEL[k]}</h2><ul className="mt-2 space-y-2 text-sm">{list.map((e) => (
            <li key={e.id}><b>{e.title}</b>{e.org && ` · ${e.org}`}{e.year && ` · ${e.year}`} <i className="text-ink-soft">({e.status === "VERIFIED" ? "verified by Kalwings" : k === "CERTIFICATE" ? "external certificate, not verified" : "self-declared"})</i>{e.summary && <span className="block text-ink-soft">{e.summary}</span>}</li>))}</ul></div> : null;
        })}
        {projects.length > 0 && <><h2 className={sec}>Projects</h2><ul className="mt-2 space-y-2 text-sm">{projects.map((x) => <li key={x.id}><b>{x.title}</b><span className="block text-ink-soft">{x.summary}</span><span className="text-ink-soft">{[x.githubUrl, x.demoUrl].filter(Boolean).join(" · ")}</span></li>)}</ul></>}
        <p className="mt-8 text-xs text-ink-soft">Contact details are not included. Reach this candidate through Kalwings. Generated from a Kalwings Talent Passport; items marked self-declared have not been checked.</p>
      </article>
    </div>
  );
}
