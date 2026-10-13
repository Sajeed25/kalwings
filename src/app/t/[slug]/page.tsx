import type { Metadata } from "next";
import { asList } from "@/lib/lists";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { BadgeCheck, GitBranch } from "lucide-react";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { Badge, SampleTag } from "@/components/ui/badge";
import { WingMark } from "@/components/ui/wing";

export const dynamic = "force-dynamic";
// Public Talent Cards are not search-indexed; students share the link/QR themselves.
export const metadata: Metadata = { title: "Talent Card", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Explicit select: email/phone can never leak onto this public page.
  const p = await db.studentProfile.findUnique({
    where: { slug },
    select: { avatarId: true, headline: true, bio: true, city: true, graduationYear: true, githubUrl: true, skillsClaimed: true, isSample: true, user: { select: { name: true } }, projects: true, skills: true, endorsements: { include: { mentor: { include: { user: { select: { name: true } } } } } } },
  });
  if (!p || !p.headline) notFound();
  const url = `${site.url}/t/${slug}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#0B1B3F", light: "#FFFFFF" } });
  return (
    <div className="container max-w-3xl py-12">
      <article className="card overflow-hidden">
        <header className="flex items-start justify-between gap-4 bg-navy p-8 text-white">
          <div className="flex items-start gap-5">
            {p.avatarId
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={`/api/files/${p.avatarId}`} alt={`Photo of ${p.user.name}`} className="h-20 w-20 shrink-0 rounded-2xl object-cover" width={80} height={80} />
              : null}
            <div><div className="flex items-center gap-2"><WingMark className="h-6 w-6" /><span className="text-sm text-white/70">Kalwings Talent Card</span></div>
            <h1 className="mt-4 text-4xl font-extrabold">{p.user.name}</h1><p className="mt-1 text-white/80">{p.headline}</p><p className="text-sm text-white/60">{[p.city, p.graduationYear && `Class of ${p.graduationYear}`].filter(Boolean).join(" · ")}</p></div></div>
          <div className="w-24 shrink-0 rounded-xl bg-white p-1.5" role="img" aria-label={`QR code linking to ${url}`} dangerouslySetInnerHTML={{ __html: qr }} />
        </header>
        <div className="space-y-8 p-8">
          {p.isSample && <SampleTag />}
          {p.bio && <p className="text-ink-soft">{p.bio}</p>}
          <section><h2 className="text-xl">Verified skills</h2>
            {p.skills.length ? <ul className="mt-3 flex flex-wrap gap-2">{p.skills.map((s) => <li key={s.id}><Badge tone="teal" title={s.explanation}><BadgeCheck className="h-3.5 w-3.5" />{s.skill}</Badge></li>)}</ul> : <p className="mt-2 text-sm text-ink-soft">No verified skills yet. Badges appear only when backed by evidence.</p>}
            {p.skills.length > 0 && <details className="mt-3 text-sm text-ink-soft"><summary className="cursor-pointer font-semibold">How these were verified</summary><ul className="mt-2 space-y-1">{p.skills.map((s) => <li key={s.id}><b>{s.skill}:</b> {s.explanation}</li>)}</ul></details>}
          </section>
          {asList(p.skillsClaimed).length > 0 && <section><h2 className="text-xl">Self-declared skills</h2><ul className="mt-3 flex flex-wrap gap-2">{asList(p.skillsClaimed).map((s) => <li key={s}><Badge>{s}</Badge></li>)}</ul><p className="mt-2 text-xs text-ink-soft">Not independently verified.</p></section>}
          {p.projects.length > 0 && <section><h2 className="text-xl">Projects</h2><ul className="mt-3 space-y-4">{p.projects.map((x) => <li key={x.id} className="rounded-xl border border-line p-4"><p className="flex items-center gap-2 font-semibold"><GitBranch className="h-4 w-4" aria-hidden />{x.title}</p><p className="mt-1 text-sm text-ink-soft">{x.summary}</p>{x.imageId && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/files/${x.imageId}`} alt={`Screenshot of ${x.title}`} className="mt-3 max-h-64 w-full rounded-lg border border-line object-cover" loading="lazy" width={800} height={450} />)}<p className="mt-2 flex gap-4 text-sm">{x.githubUrl && <a className="font-semibold underline" rel="noopener noreferrer" target="_blank" href={x.githubUrl}>Code</a>}{x.demoUrl && <a className="font-semibold underline" rel="noopener noreferrer" target="_blank" href={x.demoUrl}>Demo</a>}</p></li>)}</ul></section>}
          {p.endorsements.length > 0 && <section><h2 className="text-xl">Mentor endorsements</h2><ul className="mt-3 space-y-3">{p.endorsements.map((e) => <li key={e.id}><blockquote className="rounded-xl border-l-2 border-saffron bg-saffron-50 p-4 text-navy dark:bg-saffron/10 dark:text-ink">“{e.text}”<footer className="mt-1 text-xs text-saffron-700 dark:text-saffron">— {e.mentor.user.name}, {e.mentor.roleTitle} · <a className="underline" href={e.evidence} rel="noopener noreferrer" target="_blank">evidence</a></footer></blockquote></li>)}</ul></section>}
          <p className="border-t border-line pt-4 text-xs text-ink-soft">Contact details are private. Kalwings doesn&apos;t guarantee jobs or interviews.</p>
        </div>
      </article>
    </div>
  );
}
