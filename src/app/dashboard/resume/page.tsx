import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { completeness } from "@/lib/completeness";
import { safeNext } from "@/lib/next-path";
import { ActionButton } from "@/components/dash/action-form";
import { PageTitle, Panel, fmt } from "@/components/dash/ui";
import { ResumeUpload } from "@/components/dash/resume-upload";
import { IntroRecorder } from "@/components/dash/intro-recorder";
import { deleteIntroVideo, deleteResume } from "@/app/actions/student";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const u = await requirePageRole("STUDENT");
  const back = safeNext((await searchParams).next) ?? undefined;
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id }, include: { projects: true } });
  const ev = await db.skillEvidence.count({ where: { studentId: p.id } });
  const { score, todo } = completeness(p, ev);
  const [sharedWith] = await Promise.all([p.introVideoId ? db.application.count({ where: { introVideoId: p.introVideoId } }) : Promise.resolve(0)]);
  return (
    <>
      <PageTitle title="Resume & video" sub="Attach your resume to any application in one tap, and add a short selfie introduction so employers can hear you. You decide what each company receives." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Your resume">
          {p.resumeId ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
              <div><p className="font-semibold">{p.resumeName ?? "Resume"}</p><p className="text-xs text-ink-soft">Private. Only companies you apply to with it attached can download it.</p></div>
              <div className="flex gap-2"><a href={`/api/docs/${p.resumeId}`} className="inline-flex h-9 items-center rounded-full border border-line px-4 text-sm font-semibold">Download</a><ActionButton confirm="Delete your resume everywhere, including from applications that carried it?" action={deleteResume}>Delete</ActionButton></div>
            </div>
          ) : <p className="mb-4 text-sm text-ink-soft">No resume yet. Upload the one you already use for other job sites. Applications without one still work, but employers prefer to see it.</p>}
          <ResumeUpload hasResume={!!p.resumeId} backTo={back} />
          {back && <p className="mt-3 text-sm"><Link href={back} className="font-semibold text-accent underline">← Back to the listing</Link></p>}
        </Panel>
        <Panel title="Selfie introduction">
          {score < 100 ? (
            <div>
              <div className="flex items-center gap-3"><div className="h-3 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness"><div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} /></div><b>{score}%</b></div>
              <p className="mt-3 text-sm text-ink-soft"><b className="text-ink">Locked until your profile is 100% complete.</b> A complete profile means employers see your whole picture, and it keeps video storage for people who are ready to apply. Still to do:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{todo.map((t) => <li key={t}>{t}</li>)}</ul>
              <p className="mt-3"><Link href="/dashboard/profile" className="font-semibold text-accent underline">Complete my profile →</Link></p>
            </div>
          ) : p.introVideoId ? (
            <div>
              <video controls preload="metadata" playsInline aria-label="Your intro video" src={`/api/docs/${p.introVideoId}`} className="aspect-[4/3] w-full rounded-2xl bg-black object-cover" />
              <p className="mt-2 text-xs text-ink-soft">Recorded {p.introVideoAt ? fmt(p.introVideoAt) : ""}. Shared with {sharedWith} compan{sharedWith === 1 ? "y" : "ies"}. Employers only see it when you tick “Share my intro video” on an application.</p>
              <div className="mt-3"><ActionButton confirm="Delete your intro video everywhere, including from companies you shared it with?" action={deleteIntroVideo}>Delete video</ActionButton></div>
              <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold text-accent">Record a new one</summary><div className="mt-3"><IntroRecorder /></div></details>
            </div>
          ) : <IntroRecorder />}
          <p className="mt-4 text-xs text-ink-soft">Why a video? It lets an employer hear how you communicate, which a resume cannot show. A person watches it; nothing scores it automatically.</p>
        </Panel>
      </div>
    </>
  );
}
