import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import QRCode from "qrcode";
import Link from "next/link";
import { BadgeCheck, GitBranch, FileText } from "lucide-react";
import { asList } from "@/lib/lists";
import { site } from "@/lib/site";
import { canSee, canonicalKey, getViewer, KIND_LABEL, loadPassport } from "@/lib/passport";
import { Badge, SampleTag } from "@/components/ui/badge";
import { LogoMark } from "@/components/ui/brand";
import { EntryLabel, EvidenceLegend } from "@/components/passport/evidence";

export const dynamic = "force-dynamic";
// Passports are not search-indexed; students share the link/QR themselves.
export const metadata: Metadata = { title: "Talent Passport", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const p = await loadPassport(username);
  if (!p) notFound();
  const key = canonicalKey(p);
  if (username !== key) permanentRedirect(`/talent/${key}`);
  const v = await getViewer(p.user.id);
  if (p.passportVisibility === "PRIVATE" && !v.owner) notFound();
  if (!canSee(p.passportVisibility, v)) {
    return (
      <div className="container max-w-xl py-24 text-center">
        <h1 className="text-3xl">This Talent Passport is limited</h1>
        <p className="mt-3 text-ink-soft">The student shares it only with verified recruiters. If you recruit on Kalwings, <Link href="/login" className="text-accent underline">log in</Link> with your verified employer account.</p>
      </div>
    );
  }
  const url = `${site.url}/talent/${key}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#000000", light: "#FFFFFF" } });
  const showProjects = canSee(p.projectsVisibility, v);
  const showEndorse = canSee(p.endorsementsVisibility, v);
  const showEntries = canSee(p.entriesVisibility, v);
  const entries = p.entries.filter((e) => v.owner || e.status !== "REJECTED");
  const kinds = (Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).filter((k) => entries.some((e) => e.kind === k));
  return (
    <div className="container max-w-3xl py-12">
      <article className="card overflow-hidden">
        <header className="flex items-start justify-between gap-4 bg-black p-8 text-white">
          <div className="flex items-start gap-5">
            {p.avatarId
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={`/api/files/${p.avatarId}`} alt={`Photo of ${p.user.name}`} className="h-20 w-20 shrink-0 rounded-2xl object-cover" width={80} height={80} />
              : null}
            <div><div className="flex items-center gap-2"><LogoMark className="h-6 w-6" /><span className="text-sm text-white/70">Kalwings Talent Passport</span></div>
              <h1 className="mt-4 text-4xl font-extrabold">{p.user.name}</h1><p className="mt-1 text-white/80">{p.headline}</p>
              <p className="text-sm text-white/60">{[p.college?.name, p.city, p.graduationYear && `Class of ${p.graduationYear}`].filter(Boolean).join(" · ")}</p></div></div>
          <div className="w-24 shrink-0 rounded-xl bg-white p-1.5" role="img" aria-label={`QR code linking to ${url}`} dangerouslySetInnerHTML={{ __html: qr }} />
        </header>
        <div className="space-y-8 p-8">
          <div className="flex flex-wrap items-center gap-3">
            {p.isSample && <SampleTag />}
            {v.owner && p.passportVisibility !== "PUBLIC" && <Badge tone="spot">Visible to: {p.passportVisibility === "PRIVATE" ? "only you" : "verified recruiters"}</Badge>}
            <Link href={`/talent/${key}/resume`} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-accent"><FileText className="h-4 w-4" aria-hidden />Resume view</Link>
          </div>
          {p.bio && <p className="text-ink-soft">{p.bio}</p>}
          {p.lookingFor && <p className="text-sm"><b>Looking for:</b> {p.lookingFor}</p>}
          <EvidenceLegend />
          <section><h2 className="text-xl">Evidence-backed skills</h2>
            {p.skills.length ? <ul className="mt-3 flex flex-wrap gap-2">{p.skills.map((s) => <li key={s.id}><Badge tone="accent" title={s.explanation}><BadgeCheck className="h-3.5 w-3.5" />{s.skill}</Badge></li>)}</ul> : <p className="mt-2 text-sm text-ink-soft">None yet. Badges appear only when backed by evidence.</p>}
            {p.skills.length > 0 && <details className="mt-3 text-sm text-ink-soft"><summary className="cursor-pointer font-semibold">Why these are shown</summary><ul className="mt-2 space-y-1">{p.skills.map((s) => <li key={s.id}><b>{s.skill}:</b> {s.explanation}</li>)}</ul></details>}
          </section>
          {asList(p.skillsClaimed).length > 0 && <section><h2 className="text-xl">Self-declared skills</h2><ul className="mt-3 flex flex-wrap gap-2">{asList(p.skillsClaimed).map((s) => <li key={s}><Badge>{s}</Badge></li>)}</ul><p className="mt-2 text-xs text-ink-soft">Not independently verified.</p></section>}
          {showEntries && kinds.map((k) => (
            <section key={k}><h2 className="text-xl">{KIND_LABEL[k]}</h2>
              <ul className="mt-3 space-y-3">{entries.filter((e) => e.kind === k).map((e) => (
                <li key={e.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{e.title}{e.org && <span className="font-normal text-ink-soft"> · {e.org}</span>}{e.year && <span className="font-normal text-ink-soft"> · {e.year}</span>}</p><EntryLabel kind={e.kind} status={e.status} /></div>
                  {e.summary && <p className="mt-1 text-sm text-ink-soft">{e.summary}</p>}
                  {e.url && <p className="mt-2 text-sm"><a className="font-semibold underline" href={e.url} rel="noopener noreferrer nofollow" target="_blank">Evidence link</a></p>}
                </li>))}</ul></section>))}
          {showProjects && p.projects.length > 0 && <section><h2 className="text-xl">Projects</h2><ul className="mt-3 space-y-4">{p.projects.map((x) => <li key={x.id} className="rounded-xl border border-line p-4"><p className="flex items-center gap-2 font-semibold"><GitBranch className="h-4 w-4" aria-hidden />{x.title}</p><p className="mt-1 text-sm text-ink-soft">{x.summary}</p>{x.imageId && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/files/${x.imageId}`} alt={`Screenshot of ${x.title}`} className="mt-3 max-h-64 w-full rounded-lg border border-line object-cover" loading="lazy" width={800} height={450} />)}<p className="mt-2 flex gap-4 text-sm">{x.githubUrl && <a className="font-semibold underline" rel="noopener noreferrer" target="_blank" href={x.githubUrl}>Code</a>}{x.demoUrl && <a className="font-semibold underline" rel="noopener noreferrer" target="_blank" href={x.demoUrl}>Demo</a>}</p></li>)}</ul></section>}
          {showEndorse && p.endorsements.length > 0 && <section><h2 className="text-xl">Mentor endorsements</h2><ul className="mt-3 space-y-3">{p.endorsements.map((e) => <li key={e.id}><blockquote className="rounded-xl border-l-2 border-spot bg-spot/10 p-4 text-ink">“{e.text}”<footer className="mt-1 text-xs text-spot">— {e.mentor.user.name}, {e.mentor.roleTitle} · <a className="underline" href={e.evidence} rel="noopener noreferrer" target="_blank">evidence</a></footer></blockquote></li>)}</ul></section>}
          <p className="border-t border-line pt-4 text-xs text-ink-soft">Contact details are private. Kalwings doesn&apos;t guarantee jobs or interviews.</p>
        </div>
      </article>
    </div>
  );
}
