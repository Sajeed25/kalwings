import { sourceLabel } from "@/lib/distribution";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionButton, ActionForm, Area, Field } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel, fmtTime } from "@/components/dash/ui";
import { extendOffer, markHired, saveInterviewFeedback, saveNotes, scheduleInterview, setStage } from "@/app/actions/employer";
import { daysBetween } from "@/lib/stage-history";
import { BulkBar } from "@/components/dash/bulk-bar";
import { removeTag } from "@/app/actions/employer";
import Link from "next/link";
import { Thread } from "@/components/dash/thread";
import { PIPELINE, stageLabels } from "@/lib/stages";

const sel = "mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px]";

export default async function Page({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag: tagFilter } = await searchParams;
  const u = await requirePageRole("EMPLOYER");
  const mem = await db.employerMember.findUnique({ where: { userId: u.id }, include: { company: true } });
  if (!mem || mem.company.status !== "VERIFIED") return (<><PageTitle title="Pipeline" /><Panel><Empty>Your company must be verified to use the pipeline.</Empty></Panel></>);
  const labels = stageLabels(mem.company.stageLabels);
  const apps = await db.application.findMany({
    where: { opportunity: { companyId: mem.company.id }, stage: { in: [...PIPELINE, "REJECTED"] }, ...(tagFilter ? { tags: { some: { label: tagFilter } } } : {}) }, orderBy: { createdAt: "desc" },
    include: {
      opportunity: true, offer: true, tags: { orderBy: { label: "asc" } }, interviews: { orderBy: { scheduledAt: "asc" }, include: { feedback: { include: { author: { select: { name: true } } } } } },
      answers: { include: { question: true }, orderBy: { question: { position: "asc" } } }, events: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: true } }, student: { include: { user: { select: { name: true, email: true, phone: true } } } }, referrer: { include: { user: { select: { name: true } } } },
    },
  });
  const allTags = await db.candidateTag.groupBy({ by: ["label"], where: { application: { opportunity: { companyId: mem.company.id } } }, orderBy: { label: "asc" } });
  const templates = await db.messageTemplate.findMany({ where: { companyId: mem.company.id }, orderBy: { name: "asc" }, select: { id: true, name: true, body: true } });
  return (
    <>
      <PageTitle title="Pipeline" sub="Move candidates forward, schedule interviews, extend offers and keep private notes. Candidates are never rejected automatically." />
      <BulkBar stageNames={{ UNDER_REVIEW: labels.UNDER_REVIEW, SHORTLISTED: labels.SHORTLISTED, REJECTED: labels.REJECTED }} />
      {(allTags.length > 0 || tagFilter) && <p className="mb-4 text-sm"><span className="font-semibold">Filter by tag: </span>{tagFilter && <Link href="/dashboard/pipeline" className="mr-2 font-semibold underline">All candidates</Link>}{allTags.map((t) => <Link key={t.label} href={`/dashboard/pipeline?tag=${encodeURIComponent(t.label)}`} className={`mr-2 inline-block rounded-full border border-line px-2.5 py-0.5 ${t.label === tagFilter ? "bg-black text-white" : "hover:bg-muted"}`}>{t.label}</Link>)}</p>}
      <div className="overflow-x-auto pb-4" role="region" aria-label="Pipeline board, scroll sideways for more stages" tabIndex={0}>
        <div className="grid min-w-[1320px] grid-cols-6 gap-4">
          {PIPELINE.map((stage, ci) => {
            const col = apps.filter((a) => a.stage === stage);
            return (
              <section key={stage} aria-label={labels[stage]} className="min-w-0">
                <h2 className="mb-3 font-sans text-sm font-semibold tracking-normal text-ink-soft">{labels[stage]} ({col.length})</h2>
                <div className="space-y-3">{col.map((a) => {
                  const next = PIPELINE[ci + 1];
                  const direct = next && next !== "OFFER" && next !== "HIRED" ? next : null;
                  return (
                    <article key={a.id} className="card p-4 text-sm">
                      <div className="flex items-start justify-between gap-2"><p className="font-display font-bold">{a.student.user.name}</p>
                        <input type="checkbox" name="ids" value={a.id} form="bulk-form" aria-label={`Select ${a.student.user.name}, ${a.opportunity.title}`} className="mt-1 h-4 w-4 accent-neon" /></div>
                      {a.tags.length > 0 && <ul className="mt-1 flex flex-wrap gap-1">{a.tags.map((t) => <li key={t.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"><Link href={`/dashboard/pipeline?tag=${encodeURIComponent(t.label)}`} className="underline-offset-2 hover:underline">{t.label}</Link><ActionButton variant="ghost" action={removeTag.bind(null, a.id, t.label)}>×<span className="sr-only"> remove tag {t.label}</span></ActionButton></li>)}</ul>}<p className="text-ink-soft">{a.opportunity.title}</p>
                      {a.student.contactVisible ? <p className="mt-1 text-xs">{a.student.user.email ?? a.student.user.phone}</p> : <p className="mt-1 text-xs text-ink-soft">Contact private, use messages</p>}
                      <a href={`/talent/${a.student.username ?? a.student.slug}`} className="mt-1 inline-block text-xs font-semibold underline">Talent Passport</a>
                      <p className="mt-1 text-xs text-ink-soft">Source: {sourceLabel(a.source)}{a.referrer && <> · Referred by {a.referrer.user.name}</>}</p>
                      {a.interviews.find((i) => i.status === "SCHEDULED") && <p className="mt-2 text-xs text-ink-soft">Next interview: {fmtTime(a.interviews.find((i) => i.status === "SCHEDULED")!.scheduledAt)} IST</p>}
                      <p className="text-xs text-ink-soft">In this stage for {daysBetween(a.events.at(-1)?.createdAt ?? a.createdAt, new Date())} days</p>
                      {a.answers.length > 0 && (
                        <details className="mt-2"><summary className="cursor-pointer font-semibold">Screening answers ({a.answers.length})</summary>
                          <dl className="mt-2 space-y-2 text-xs">{a.answers.map((x) => <div key={x.id}><dt className="font-semibold">{x.question.text}</dt><dd className="whitespace-pre-line text-ink-soft">{x.answer}</dd></div>)}</dl>
                          <p className="mt-1 text-[11px] text-ink-soft">Read by people only. Answers never score or filter candidates.</p>
                        </details>)}
                      {a.interviews.some((i) => i.status === "COMPLETED") && (
                        <details className="mt-2"><summary className="cursor-pointer font-semibold">Interview feedback{(() => { const f = a.interviews.flatMap((i) => i.feedback); return f.length ? ` (${f.length} · avg ${(f.reduce((n, x) => n + x.rating, 0) / f.length).toFixed(1)}/5)` : ""; })()}</summary>
                          {a.interviews.filter((i) => i.status === "COMPLETED").map((iv) => (
                            <div key={iv.id} className="mt-2 rounded-lg border border-line p-2">
                              <p className="text-xs font-semibold">Interview on {fmtTime(iv.scheduledAt)} IST</p>
                              <ul className="mt-1 space-y-1 text-xs">{iv.feedback.map((f) => <li key={f.id}><b>{f.author.name}</b>: {f.rating}/5 · {f.recommendation.replace("_", " ").toLowerCase()}{f.strengths && <> · Strengths: {f.strengths}</>}{f.concerns && <> · Concerns: {f.concerns}</>}</li>)}</ul>
                              <ActionForm action={saveInterviewFeedback} submit="Save my feedback" success="Saved" className="mt-2 space-y-2">
                                <input type="hidden" name="interviewId" value={iv.id} />
                                <label className="block text-sm font-semibold">Rating (1 to 5)<select name="rating" className={sel} defaultValue={iv.feedback.find((f) => f.authorId === u.id)?.rating ?? 3}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
                                <label className="block text-sm font-semibold">Recommendation<select name="recommendation" className={sel} defaultValue={iv.feedback.find((f) => f.authorId === u.id)?.recommendation ?? "YES"}><option value="STRONG_YES">Strong yes</option><option value="YES">Yes</option><option value="NO">No</option><option value="STRONG_NO">Strong no</option></select></label>
                                <Field label="Strengths" name="strengths" maxLength={800} defaultValue={iv.feedback.find((f) => f.authorId === u.id)?.strengths ?? ""} />
                                <Field label="Concerns" name="concerns" maxLength={800} defaultValue={iv.feedback.find((f) => f.authorId === u.id)?.concerns ?? ""} />
                              </ActionForm>
                            </div>))}
                          <p className="mt-1 text-[11px] text-ink-soft">Private to your team. Feedback is advice for people and never moves a candidate by itself.</p>
                        </details>)}
                      <details className="mt-2"><summary className="cursor-pointer font-semibold">Stage history</summary>
                        <ol className="mt-2 space-y-1 text-xs text-ink-soft">{a.events.map((e) => <li key={e.id}>{fmtTime(e.createdAt)}: {e.fromStage ? `${labels[e.fromStage as keyof typeof labels] ?? e.fromStage} → ` : ""}{labels[e.toStage as keyof typeof labels] ?? e.toStage}</li>)}{a.events.length === 0 && <li>No history recorded before this feature.</li>}</ol>
                      </details>
                      {a.offer && <p className="mt-2 text-xs"><Link className="font-semibold underline" href={`/dashboard/pipeline/${a.id}/offer`}>Printable offer letter</Link></p>}
                      {a.offer && <p className="mt-2 text-xs text-ink-soft">Offer: {a.offer.status.toLowerCase()}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {direct && <ActionButton variant="primary" action={setStage.bind(null, a.id, direct)}>Move to {labels[direct]}</ActionButton>}
                        {stage === "OFFER" && a.offer?.status === "ACCEPTED" && <ActionButton variant="primary" confirm="Mark this candidate as hired?" action={markHired.bind(null, a.id)}>Mark hired</ActionButton>}
                        {stage !== "HIRED" && <ActionButton confirm="Reject this candidate?" action={setStage.bind(null, a.id, "REJECTED")}>Reject</ActionButton>}
                      </div>
                      {stage !== "HIRED" && (
                        <details className="mt-3"><summary className="cursor-pointer font-semibold">Interview</summary>
                          <ActionForm action={scheduleInterview} submit="Schedule" success="Scheduled" className="mt-2 space-y-2" reset>
                            <input type="hidden" name="applicationId" value={a.id} />
                            <Field label="Date and time (IST)" name="scheduledAt" type="datetime-local" required />
                            <Field label="Minutes" name="minutes" type="number" defaultValue={30} min={15} max={240} required />
                            <label className="block text-sm font-semibold">Mode<select name="mode" className={sel}><option value="VIDEO">Video</option><option value="PHONE">Phone</option><option value="ONSITE">On-site</option></select></label>
                            <Field label="Link, phone or address" name="detail" required />
                            <Field label="Note to candidate" name="notes" maxLength={500} />
                          </ActionForm>
                        </details>)}
                      {stage !== "HIRED" && a.offer?.status !== "ACCEPTED" && (
                        <details className="mt-2"><summary className="cursor-pointer font-semibold">{a.offer ? "Update offer" : "Extend offer"}</summary>
                          <ActionForm action={extendOffer} submit="Send offer" success="Offer sent" className="mt-2 space-y-2">
                            <input type="hidden" name="applicationId" value={a.id} />
                            <Area label="Role, pay and key terms" name="summary" defaultValue={a.offer?.summary ?? ""} required maxLength={400} />
                            <Field label="Joining date" name="joiningDate" type="date" />
                          </ActionForm>
                        </details>)}
                      <details className="mt-2"><summary className="cursor-pointer font-semibold">Notes & messages</summary>
                        <ActionForm action={saveNotes} submit="Save notes" success="Saved" className="mt-2 space-y-2"><input type="hidden" name="applicationId" value={a.id} /><Field label="Private notes" name="notes" defaultValue={a.employerNotes ?? ""} maxLength={1000} /></ActionForm>
                        <Thread applicationId={a.id} templates={templates} messages={a.messages.map((m) => ({ id: m.id, body: m.body, mine: m.senderId === u.id, who: m.sender.name, at: m.createdAt.toISOString() }))} />
                      </details>
                    </article>);
                })}</div>
              </section>);
          })}
        </div>
      </div>
    </>
  );
}
