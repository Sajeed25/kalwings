import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionForm, Area, Field } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, Status, fmt } from "@/components/dash/ui";
import { reviewSubmission } from "@/app/actions/employer";

const sel = "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px]";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole("EMPLOYER");
  const { id } = await params;
  const mem = await db.employerMember.findUnique({ where: { userId: u.id } });
  if (!mem) notFound();
  const c = await db.challenge.findFirst({
    where: { id, opportunity: { companyId: mem.companyId } },
    include: { opportunity: true, submissions: { where: { status: { not: "WITHDRAWN" } }, orderBy: { createdAt: "asc" }, include: { student: { include: { user: { select: { name: true } } } } } } },
  });
  if (!c) notFound();
  const rubric = c.rubric as { criterion: string; max: number; description: string }[];
  return (
    <>
      <PageTitle title={c.opportunity.title} sub={`${c.submissions.length} submission${c.submissions.length === 1 ? "" : "s"} · closes ${fmt(c.opportunity.deadline)} · listing ${c.opportunity.moderated.toLowerCase()}`} />
      <p className="mb-6 text-sm"><Link className="font-semibold underline" href="/dashboard/challenges">← All challenges</Link></p>
      {c.submissions.length ? (
        <ul className="space-y-4">{c.submissions.map((s) => {
          const scores = (s.scores as { criterion: string; points: number; comment: string }[] | null) ?? [];
          return (
            <li key={s.id}>
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-display text-lg font-bold">{s.title}</p>
                    <p className="text-sm text-ink-soft">{s.student.user.name} · <a className="underline" href={`/talent/${s.student.username ?? s.student.slug}`}>Talent Passport</a> · submitted {fmt(s.createdAt)}</p></div>
                  <div className="flex items-center gap-2">{s.totalScore !== null && <span className="text-sm font-semibold">{s.totalScore}/{s.maxScore}</span>}<Status s={s.status} /></div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm">{s.summary}</p>
                <p className="mt-2 text-sm"><a className="font-semibold underline" href={s.workUrl} rel="noopener noreferrer nofollow" target="_blank">Open the work</a>{s.teamNote && <span className="text-ink-soft"> · Team (self-declared): {s.teamNote}</span>}</p>
                <details className="mt-4"><summary className="cursor-pointer font-semibold">{s.status === "SUBMITTED" ? "Review and score" : "Update review"}</summary>
                  <ActionForm action={reviewSubmission} submit="Save review" className="mt-3 space-y-3">
                    <input type="hidden" name="submissionId" value={s.id} />
                    {rubric.map((r, i) => (
                      <div key={r.criterion} className="grid gap-2 sm:grid-cols-[1fr_110px_1.4fr] sm:items-end">
                        <p className="text-sm"><b>{r.criterion}</b><span className="block text-xs text-ink-soft">{r.description}</span></p>
                        <Field label={`Points (0 to ${r.max})`} name={`p${i}`} type="number" min={0} max={r.max} defaultValue={scores[i]?.points ?? ""} required />
                        <Field label="Comment" name={`c${i}`} defaultValue={scores[i]?.comment ?? ""} maxLength={300} />
                      </div>))}
                    <Area label="Feedback to the candidate" name="feedback" defaultValue={s.feedback ?? ""} required maxLength={1500} />
                    <label className="block text-sm font-semibold">Outcome<select name="outcome" defaultValue={s.status === "SUBMITTED" ? "REVIEWED" : s.status} className={sel}><option value="REVIEWED">Reviewed, no decision yet</option><option value="SHORTLISTED">Shortlist (adds them to your pipeline)</option><option value="NOT_SELECTED">Not selected</option></select></label>
                    {c.skillTag && <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="awardSkill" value="true" className="mt-1 h-4 w-4 accent-neon" /><span>Award &quot;{c.skillTag}&quot; as evidence-backed on their Passport. <span className="text-ink-soft">Tick only if the work demonstrates it. Your company and score are shown as the reason.</span></span></label>}
                  </ActionForm>
                </details>
              </Panel>
            </li>);
        })}</ul>
      ) : <Panel><Empty>No submissions yet.</Empty></Panel>}
    </>
  );
}
