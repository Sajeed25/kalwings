import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { LANGS, sandboxConfigured } from "@/lib/sandbox";
import { ActionForm, Area, Field } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt, fmtTime } from "@/components/dash/ui";
import { Results, Workspace } from "@/components/assessments/workspace";
import { reviewWritten, submitWritten, type TestOutcome } from "@/app/actions/assessments";
import type { TestCase } from "@/lib/validation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole("STUDENT", "EMPLOYER");
  const { id } = await params;
  const a = await db.assessment.findUnique({ where: { id }, include: { company: true } });
  if (!a) notFound();
  const isOpen = !a.closedAt && (!a.closesAt || a.closesAt > new Date());
  const labels = Object.fromEntries(Object.entries(LANGS).map(([k, v]) => [k, v.label]));

  if (u.role === "EMPLOYER") {
    const mem = await db.employerMember.findUnique({ where: { userId: u.id } });
    if (!mem || mem.companyId !== a.companyId) notFound();
    const attempts = await db.assessmentAttempt.findMany({ where: { assessmentId: a.id }, orderBy: { createdAt: "desc" }, take: 200, include: { student: { include: { user: { select: { name: true } } } } } });
    const qs = a.kind === "WRITTEN" ? (a.items as { prompt: string; max: number }[]) : [];
    return (
      <>
        <PageTitle title={a.title} sub={`${a.kind === "CODING" ? "Coding" : "Written"} · ${attempts.length} attempt${attempts.length === 1 ? "" : "s"}${a.closedAt ? " · closed" : ""}`} />
        <p className="mb-6 text-sm"><Link className="font-semibold underline" href="/dashboard/assessments">← All assessments</Link></p>
        {a.kind === "CODING" && <p className="mb-4 rounded-lg border border-dashed border-line p-3 text-sm text-ink-soft">Results show tests passed. Treat them as one signal; read the code and talk to the candidate before deciding.</p>}
        {attempts.length ? <ul className="space-y-3">{attempts.map((t) => {
          const answers = (t.answers as { prompt: string; answer: string }[] | null) ?? [];
          const scores = (t.scores as { points: number; comment: string }[] | null) ?? [];
          return (
            <li key={t.id}><Panel>
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold">{t.student.user.name} <span className="font-normal text-ink-soft">· <a className="underline" href={`/talent/${t.student.username ?? t.student.slug}`}>Talent Passport</a> · {fmtTime(t.createdAt)} IST{t.language && ` · ${labels[t.language] ?? t.language}`}</span></p>
                <div className="flex items-center gap-3">{t.passed !== null && <b className="text-sm">{t.passed}/{t.total}</b>}<Status s={t.status} /></div></div>
              {t.code && <details className="mt-3"><summary className="cursor-pointer font-semibold">View code</summary><pre tabIndex={0} className="mt-2 overflow-x-auto rounded-lg bg-black p-3 text-xs text-white">{t.code}</pre></details>}
              {t.results && <details className="mt-3"><summary className="cursor-pointer font-semibold">Test results</summary><Results results={(t.results as unknown as TestOutcome[])} passed={t.passed ?? 0} total={t.total ?? 0} /></details>}
              {a.kind === "WRITTEN" && (
                <details className="mt-3"><summary className="cursor-pointer font-semibold">{t.status === "PENDING_REVIEW" ? "Read and score" : "Update review"}</summary>
                  <ActionForm action={reviewWritten} submit="Save review" className="mt-3 space-y-3">
                    <input type="hidden" name="attemptId" value={t.id} />
                    {qs.map((q, i) => (
                      <div key={i} className="space-y-1"><p className="text-sm font-semibold">{q.prompt}</p><p className="whitespace-pre-line rounded-lg bg-muted p-3 text-sm">{answers[i]?.answer}</p>
                        <div className="grid gap-2 sm:grid-cols-[130px_1fr]"><Field label={`Points (0 to ${q.max})`} name={`p${i}`} type="number" min={0} max={q.max} defaultValue={scores[i]?.points ?? ""} required /><Field label="Comment" name={`c${i}`} defaultValue={scores[i]?.comment ?? ""} maxLength={300} /></div></div>))}
                    <Area label="Feedback to the candidate" name="feedback" defaultValue={t.feedback ?? ""} required maxLength={1500} />
                  </ActionForm>
                </details>)}
            </Panel></li>);
        })}</ul> : <Panel><Empty>No attempts yet. Share the Assessments page with candidates.</Empty></Panel>}
      </>
    );
  }

  // Student view
  if (a.company.status !== "VERIFIED") notFound();
  const sp = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id } });
  const history = await db.assessmentAttempt.findMany({ where: { assessmentId: a.id, studentId: sp.id }, orderBy: { createdAt: "desc" }, take: 20 });
  const tests = a.kind === "CODING" ? (a.items as TestCase[]) : [];
  const samples = tests.filter((t) => !t.hidden);
  const qs = a.kind === "WRITTEN" ? (a.items as { prompt: string; max: number }[]) : [];
  return (
    <>
      <PageTitle title={a.title} sub={`${a.company.name} · ${a.kind === "CODING" ? "Coding" : "Written"}${a.closesAt ? ` · closes ${fmt(a.closesAt)}` : ""}`} />
      <p className="mb-6 text-sm"><Link className="font-semibold underline" href="/dashboard/assessments">← All assessments</Link></p>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Panel title="Instructions"><p className="whitespace-pre-line text-sm">{a.instructions}</p>
            {a.kind === "CODING" && <p className="mt-3 text-xs text-ink-soft">{tests.length} tests ({tests.length - samples.length} hidden). Hidden tests never show their input or expected output.</p>}</Panel>
          {samples.length > 0 && <Panel title="Sample tests"><ul className="space-y-3 font-mono text-xs">{samples.map((t, i) => <li key={i} className="rounded-lg border border-line p-3"><p className="text-ink-soft">input</p><pre className="whitespace-pre-wrap">{t.input.trim()}</pre><p className="mt-1 text-ink-soft">expected</p><pre className="whitespace-pre-wrap">{t.expected}</pre></li>)}</ul></Panel>}
          <Panel title="Your history">{history.length ? <ul className="divide-y divide-line text-sm">{history.map((h) => (
            <li key={h.id} className="py-2"><div className="flex items-center justify-between gap-2"><span>{fmtTime(h.createdAt)} IST{h.language && ` · ${labels[h.language] ?? h.language}`}</span><span className="flex items-center gap-2">{h.passed !== null && <b>{h.passed}/{h.total}</b>}<Status s={h.status} /></span></div>
              {h.feedback && <blockquote className="mt-2 rounded-lg border-l-2 border-accent bg-muted p-2">{h.feedback}</blockquote>}</li>))}</ul> : <Empty>No attempts yet.</Empty>}</Panel>
        </div>
        <div>
          {!isOpen ? <Panel><Empty>This assessment is closed.</Empty></Panel>
            : a.kind === "CODING" ? (sandboxConfigured() ? <Workspace assessmentId={a.id} languages={(a.languages as string[]) ?? []} labels={labels} memoryMb={a.memoryMb} timeLimitMs={a.timeLimitMs} /> : <Panel><Empty>Code execution isn&apos;t enabled yet, so this assessment can&apos;t be taken right now.</Empty></Panel>)
            : history.length ? <Panel><Empty>You have submitted this assessment. The employer will review it.</Empty></Panel>
            : (
              <Panel title="Your answers">
                <ActionForm action={submitWritten} submit="Submit answers" success="Submitted" className="space-y-4">
                  <input type="hidden" name="assessmentId" value={a.id} />
                  {qs.map((q, i) => <Area key={i} label={`${i + 1}. ${q.prompt} (${q.max} points)`} name={`a${i}`} required maxLength={3000} />)}
                  <p className="text-xs text-ink-soft">You can submit once. A reviewer scores your answers against the points shown.</p>
                </ActionForm>
              </Panel>)}
        </div>
      </div>
    </>
  );
}
